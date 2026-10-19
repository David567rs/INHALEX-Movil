import type { AuthSession, AuthSessionState } from '../../../auth/domain/session/AuthSession';
import { ProfileError } from '../../domain/errors/ProfileError';
import type { Profile, ProfileDraft, ProfileField, ProfileFieldErrors } from '../../domain/models/Profile';
import type { ProfileActions } from '../../domain/useCases/profileActions';
import { validateProfileDraft } from '../../domain/validation/profileValidation';

export interface ProfileState {
  readonly status: 'checking' | 'anonymous' | 'recovery-error' | 'loading' | 'ready' | 'error' | 'session-expired';
  readonly profile: Profile | null;
  readonly draft: ProfileDraft | null;
  readonly mode: 'summary' | 'edit';
  readonly refreshing: boolean;
  readonly saving: boolean;
  readonly requiresRefresh: boolean;
  readonly error: string | null;
  readonly saveError: string | null;
  readonly fieldErrors: ProfileFieldErrors;
  readonly notice: string | null;
}

function initialState(auth: AuthSessionState): ProfileState {
  return Object.freeze({
    status: auth.status === 'authenticated' ? (auth.user ? 'loading' : 'error') : auth.status,
    profile: null, draft: null, mode: 'summary', refreshing: false, saving: false,
    requiresRefresh: false, error: auth.message, saveError: null,
    fieldErrors: Object.freeze({}), notice: null,
  });
}

function expiredState(auth: AuthSessionState): ProfileState {
  return Object.freeze({ ...initialState(auth), status: 'session-expired',
    error: 'Tu sesión ya no es válida. Inicia sesión de nuevo para consultar tu perfil.' });
}

/** Only the public profile fields can enter controller snapshots or the session callback. */
function confirmedProfile(profile: Profile): Profile {
  return Object.freeze({ id: profile.id, firstName: profile.firstName, lastName: profile.lastName,
    email: profile.email, phone: profile.phone });
}

function draftFrom(profile: Profile): ProfileDraft {
  return Object.freeze({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone });
}

function matchesConfirmedUser(auth: AuthSessionState, profile: Profile) {
  return auth.status === 'authenticated' && auth.user?.id === profile.id
    && auth.user.firstName === profile.firstName && auth.user.lastName === profile.lastName
    && auth.user.email === profile.email && auth.user.phone === profile.phone;
}

const readError = (error: unknown) => error instanceof ProfileError
  ? error.message : 'No pudimos cargar tu perfil. Inténtalo de nuevo.';
const saveError = (error: unknown) => error instanceof ProfileError
  ? error.message : 'No pudimos confirmar los cambios. Consulta tu perfil antes de volver a guardar.';

/** A single operation lock protects confirmed data, editable drafts and session ownership. */
export function createProfileController(
  session: AuthSession,
  actions: ProfileActions,
  onConfirmed?: (profile: Profile, expected: AuthSessionState) => boolean,
) {
  let state = initialState(session.getSnapshot());
  let active = false;
  let generation = 0;
  let observedSession: AuthSessionState | null = null;
  let expiredSession: AuthSessionState | null = null;
  let unsubscribeSession: (() => void) | null = null;
  let pendingOperation: AbortController | null = null;
  let confirming: Profile | null = null;
  let confirmationSession: AuthSessionState | null = null;
  const listeners = new Set<() => void>();

  function publish(patch: Partial<ProfileState>) {
    state = Object.freeze({ ...state, ...patch });
    for (const listener of [...listeners]) {
      try { listener(); }
      catch { /* Observers cannot turn a confirmed operation into an error. */ }
    }
  }

  function cancelOperations() {
    generation++;
    pendingOperation?.abort();
    pendingOperation = null;
  }

  function current(auth: AuthSessionState, requestId: number, controller: AbortController) {
    return active && generation === requestId && !controller.signal.aborted
      && observedSession === auth && session.getSnapshot() === auth
      && auth.status === 'authenticated' && auth.user !== null;
  }

  function assertOwnership(profile: Profile, auth: AuthSessionState) {
    if (!auth.user || profile.id !== auth.user.id) {
      throw new ProfileError('No pudimos confirmar los datos de tu perfil. Inténtalo de nuevo.', 'invalid-response');
    }
  }

  function expireSession(auth: AuthSessionState) {
    cancelOperations();
    expiredSession = auth;
    publish(expiredState(auth));
  }

  async function refresh(): Promise<void> {
    const auth = observedSession;
    if (!active || auth?.status !== 'authenticated' || !auth.user || session.getSnapshot() !== auth
      || state.status === 'session-expired' || pendingOperation) return;
    const controller = new AbortController();
    const requestId = generation;
    pendingOperation = controller;
    publish({ status: state.profile ? 'ready' : 'loading', refreshing: state.profile !== null,
      error: null, notice: null });
    try {
      if (!current(auth, requestId, controller)) return;
      const profile = await actions.get({ signal: controller.signal });
      if (!current(auth, requestId, controller)) return;
      assertOwnership(profile, auth);
      const snapshot = confirmedProfile(profile);
      pendingOperation = null;
      publish({ status: 'ready', profile: snapshot,
        draft: state.mode === 'edit' ? state.draft : draftFrom(snapshot),
        refreshing: false, requiresRefresh: false, error: null, saveError: null });
    } catch (error) {
      if (!current(auth, requestId, controller)) return;
      if (error instanceof ProfileError && error.kind === 'unauthorized') {
        expireSession(auth);
        return;
      }
      pendingOperation = null;
      publish({ status: state.profile ? 'ready' : 'error', refreshing: false, error: readError(error) });
    } finally {
      if (pendingOperation === controller) pendingOperation = null;
    }
  }

  function synchronizeSession() {
    const auth = session.getSnapshot();
    if (!active || observedSession === auth) return;
    if (confirming && matchesConfirmedUser(auth, confirming)) {
      // The private callback can replace the public user synchronously after PATCH.
      confirmationSession = auth;
      return;
    }
    cancelOperations();
    observedSession = auth;
    if (auth === expiredSession) {
      publish(expiredState(auth));
      return;
    }
    expiredSession = null;
    publish(initialState(auth));
    if (auth.status === 'authenticated') void refresh();
  }

  async function save(): Promise<void> {
    let auth = observedSession;
    if (!active || auth?.status !== 'authenticated' || !auth.user || session.getSnapshot() !== auth
      || state.status !== 'ready' || !state.profile || !state.draft || state.mode !== 'edit'
      || state.requiresRefresh || pendingOperation) return;
    const validation = validateProfileDraft(state.draft);
    if (!validation.valid) {
      publish({ fieldErrors: Object.freeze({ ...validation.errors }), saveError: 'Revisa los datos indicados.', notice: null });
      return;
    }
    const controller = new AbortController();
    const requestId = generation;
    pendingOperation = controller;
    publish({ saving: true, fieldErrors: Object.freeze({}), saveError: null, error: null, notice: null });
    try {
      if (!current(auth, requestId, controller)) return;
      const profile = await actions.update(validation.values, { signal: controller.signal });
      if (!current(auth, requestId, controller)) return;
      assertOwnership(profile, auth);
      const snapshot = confirmedProfile(profile);
      if (onConfirmed) {
        confirming = snapshot;
        confirmationSession = null;
        let accepted = false;
        let callbackFailed = false;
        try { accepted = onConfirmed(snapshot, auth); }
        catch { callbackFailed = true; }
        finally { confirming = null; }
        if (!active || generation !== requestId || controller.signal.aborted) return;
        const latest = session.getSnapshot();
        if (latest !== auth) {
          if (latest !== confirmationSession || !matchesConfirmedUser(latest, snapshot)) {
            synchronizeSession();
            return;
          }
          observedSession = latest;
          auth = latest;
        }
        if (!accepted || callbackFailed) {
          throw new ProfileError('No pudimos confirmar la sesión actual. Consulta tu perfil de nuevo.', 'unknown');
        }
      }
      if (!current(auth, requestId, controller)) return;
      pendingOperation = null;
      publish({ status: 'ready', profile: snapshot, draft: draftFrom(snapshot), mode: 'summary',
        saving: false, requiresRefresh: false, saveError: null, fieldErrors: Object.freeze({}),
        notice: 'Tus datos se guardaron correctamente.' });
    } catch (error) {
      if (!current(auth, requestId, controller)) return;
      if (error instanceof ProfileError && error.kind === 'unauthorized') {
        expireSession(auth);
        return;
      }
      const validationError = error instanceof ProfileError && error.kind === 'validation';
      pendingOperation = null;
      // A failed PATCH can have committed remotely. Only a successful GET unlocks another PATCH.
      publish({ saving: false, requiresRefresh: !validationError, saveError: saveError(error),
        fieldErrors: Object.freeze({ ...(validationError ? error.fieldErrors : {}) }) });
    } finally {
      confirming = null;
      confirmationSession = null;
      if (pendingOperation === controller) pendingOperation = null;
    }
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    start() {
      if (active) return;
      active = true;
      unsubscribeSession = session.subscribe(synchronizeSession);
      synchronizeSession();
    },
    stop() {
      if (!active) return;
      active = false;
      unsubscribeSession?.();
      unsubscribeSession = null;
      observedSession = null;
      cancelOperations();
      const auth = session.getSnapshot();
      state = auth === expiredSession ? expiredState(auth) : initialState(auth);
    },
    refresh,
    beginEdit() {
      if (!active || state.status !== 'ready' || !state.profile || pendingOperation) return;
      publish({ mode: 'edit', draft: draftFrom(state.profile), fieldErrors: Object.freeze({}),
        saveError: null, error: null, notice: null });
    },
    cancelEdit() {
      if (!active || !state.profile || pendingOperation) return;
      publish({ mode: 'summary', draft: draftFrom(state.profile), fieldErrors: Object.freeze({}),
        saveError: null, notice: null });
    },
    updateField(field: ProfileField, value: string) {
      if (!active || state.mode !== 'edit' || !state.draft || pendingOperation
        || !['firstName', 'lastName', 'phone'].includes(field)) return;
      const fieldErrors = { ...state.fieldErrors };
      delete fieldErrors[field];
      publish({ draft: Object.freeze({ ...state.draft, [field]: value }),
        fieldErrors: Object.freeze(fieldErrors), saveError: null, notice: null });
    },
    save,
  };
}

export type ProfileController = ReturnType<typeof createProfileController>;
