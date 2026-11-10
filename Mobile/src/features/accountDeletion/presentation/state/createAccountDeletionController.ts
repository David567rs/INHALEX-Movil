import type { AuthSession, AuthSessionState } from '../../../auth/domain/session/AuthSession';
import { AccountDeletionError, validateDeletion, type AccountDeletionRepository, type DeletionInput, type DeletionRequest } from '../../domain/AccountDeletion';

export type DeletionState = Readonly<{
  request: DeletionRequest | null; loaded: boolean; busy: boolean;
  message: string | null; requiresVerification: boolean; expired: boolean;
}>;
const empty = (): DeletionState => Object.freeze({ request: null, loaded: false, busy: false, message: null, requiresVerification: false, expired: false });

/** Passwords are passed only to the repository, never retained in snapshots or storage. */
export function createAccountDeletionController(session: AuthSession, repository: AccountDeletionRepository) {
  let state = empty();
  let observed: AuthSessionState = session.getSnapshot();
  let active = false;
  let pending: AbortController | null = null;
  let writing = false;
  let refreshOnStart = false;
  const hidden = empty();
  let unsubscribe: (() => void) | null = null;
  const listeners = new Set<() => void>();
  function publish(patch: Partial<DeletionState>) {
    state = Object.freeze({ ...state, ...patch });
    for (const listener of [...listeners]) { try { listener(); } catch { /* Observers cannot alter write outcomes. */ } }
  }
  function synchronize() {
    const auth = session.getSnapshot();
    if (auth === observed) return;
    pending?.abort(); pending = null; writing = false; observed = auth; publish(empty());
  }
  function ready() {
    synchronize();
    return active && observed.status === 'authenticated' && !!observed.user && !pending && !state.expired;
  }
  function current(auth: AuthSessionState, operation: AbortController) {
    return active && observed === auth && session.getSnapshot() === auth && pending === operation && !operation.signal.aborted;
  }
  async function refresh() {
    // A screen focus can run before the root provider's effect on a cold link.
    if (!active) { refreshOnStart = true; return; }
    if (!ready()) return;
    const auth = observed; const operation = new AbortController(); pending = operation;
    publish({ busy: true, message: null });
    try {
      if (!current(auth, operation)) return;
      const request = await repository.get(operation.signal);
      if (!current(auth, operation)) return;
      // An acknowledged request cannot disappear on a stale read in the same session.
      publish({ request: request ?? state.request, loaded: true, busy: false, requiresVerification: false });
    } catch (error) {
      if (!current(auth, operation)) return;
      const expired = error instanceof AccountDeletionError && error.kind === 'unauthorized';
      publish({ busy: false, expired, ...(expired ? { request: null, loaded: false } : {}),
        message: error instanceof AccountDeletionError ? error.message : 'No pudimos consultar la solicitud. Inténtalo de nuevo.' });
    } finally { if (pending === operation) pending = null; }
  }
  async function submit(input: DeletionInput) {
    if (!ready() || !state.loaded || state.requiresVerification || state.request) return;
    const validation = validateDeletion(input);
    if (validation) { publish({ message: validation }); return; }
    const auth = observed; const operation = new AbortController(); pending = operation;
    writing = true;
    publish({ busy: true, message: null });
    try {
      if (!current(auth, operation)) return;
      const request = await repository.request(input, operation.signal);
      if (!current(auth, operation)) return;
      publish({ request, busy: false, requiresVerification: false });
    } catch (error) {
      if (!current(auth, operation)) return;
      const expired = error instanceof AccountDeletionError && error.kind === 'unauthorized';
      // POST 401 can mean a wrong password or an expired token. A read distinguishes
      // them without signing out a valid session or repeatedly sending a password.
      const uncertain = !(error instanceof AccountDeletionError) || error.kind !== 'validation';
      publish({ busy: false, expired, requiresVerification: uncertain,
        ...(expired ? { request: null, loaded: false } : {}),
        message: error instanceof AccountDeletionError ? error.message : 'No pudimos confirmar el envío. Verifica el estado de tu solicitud.' });
    } finally { if (pending === operation) { pending = null; writing = false; } }
  }
  return Object.freeze({
    start() {
      if (active) return;
      active = true; unsubscribe = session.subscribe(synchronize); synchronize();
      if (refreshOnStart) { refreshOnStart = false; void refresh(); }
    },
    stop() {
      if (!active) return;
      active = false; unsubscribe?.(); unsubscribe = null;
      const interruptedWrite = writing;
      pending?.abort(); pending = null; writing = false;
      // Aborting a POST does not prove that the server did not record it.
      publish({ busy: false, loaded: false, ...(interruptedWrite ? {
        requiresVerification: true, message: 'Verifica el estado de tu solicitud antes de volver a enviarla.',
      } : {}) });
    },
    getSnapshot() { return session.getSnapshot() === observed ? state : hidden; },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    refresh, submit,
  });
}
export type AccountDeletionController = ReturnType<typeof createAccountDeletionController>;
