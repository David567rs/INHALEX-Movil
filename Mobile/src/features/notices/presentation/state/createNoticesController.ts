import type { AuthSession, AuthSessionState } from '../../../auth/domain/session/AuthSession';
import { NoticesError } from '../../domain/errors/NoticesError';
import type { Notice, NoticeInbox } from '../../domain/models/Notice';
import type { NoticesActions } from '../../domain/repositories/NoticesRepository';

export type NoticesState = Readonly<{
  status: 'checking' | 'anonymous' | 'recovery-error' | 'loading' | 'ready' | 'error' | 'session-expired';
  /** null has not confirmed a list; [] is a confirmed empty inbox. */
  items: readonly Notice[] | null;
  /** The global server count is unknown until a list reconciles a confirmed write. */
  unread: number | null;
  selectedNoticeId: string | null;
  refreshing: boolean;
  error: string | null;
  markingReadId: string | null;
  readError: string | null;
}>;

const reconcileMessage = 'El aviso se marcó como leído. No pudimos actualizar la bandeja. Vuelve a actualizarla.';
function initialState(auth: AuthSessionState): NoticesState {
  return Object.freeze({
    status: auth.status === 'authenticated' ? (auth.user ? 'loading' : 'anonymous') : auth.status,
    items: null, unread: null, selectedNoticeId: null, refreshing: false,
    error: auth.message, markingReadId: null, readError: null,
  });
}
function publicNotice(notice: Notice): Notice {
  return Object.freeze({ id: notice.id, title: notice.title, message: notice.message,
    type: notice.type, severity: notice.severity, createdAt: notice.createdAt, readAt: notice.readAt });
}
function publicItems(items: readonly Notice[]): readonly Notice[] {
  const timestamp = (value: string | null) => value ? Date.parse(value) : Number.NEGATIVE_INFINITY;
  return Object.freeze([...new Map(items.map((item) => [item.id, publicNotice(item)])).values()]
    .sort((left, right) => {
      const a = timestamp(left.createdAt), b = timestamp(right.createdAt);
      return (a === b ? 0 : a < b ? 1 : -1) || (left.id < right.id ? 1 : left.id > right.id ? -1 : 0);
    }));
}

export function createNoticesController(session: AuthSession, actions: NoticesActions) {
  let state = initialState(session.getSnapshot());
  let visibleAuth = session.getSnapshot();
  let observedAuth: AuthSessionState | null = null;
  let expiredAuth: AuthSessionState | null = null;
  let hiddenAuth: AuthSessionState | null = null;
  let hiddenState: NoticesState | null = null;
  let active = false;
  let generation = 0;
  let pending: AbortController | null = null;
  let unsubscribe: (() => void) | null = null;
  const listeners = new Set<() => void>();

  function publish(patch: Partial<NoticesState>) {
    state = Object.freeze({ ...state, ...patch });
    if (observedAuth) visibleAuth = observedAuth;
    for (const listener of [...listeners]) {
      try { listener(); } catch { /* An observer cannot change a confirmed operation. */ }
    }
  }
  function cancel() { generation++; pending?.abort(); pending = null; }
  function available() {
    return active && observedAuth?.status === 'authenticated' && !!observedAuth.user
      && session.getSnapshot() === observedAuth && observedAuth !== expiredAuth;
  }
  function expiredState(auth: AuthSessionState): NoticesState {
    return Object.freeze({ ...initialState(auth), status: 'session-expired',
      error: 'Tu sesión ya no es válida. Inicia sesión para consultar tus avisos.' });
  }
  function authorizationFailure(error: unknown, auth: AuthSessionState): boolean {
    if (!(error instanceof NoticesError)) return false;
    if (error.kind === 'unauthorized') {
      expiredAuth = auth; cancel(); publish(expiredState(auth)); return true;
    }
    if (error.kind === 'forbidden') {
      cancel(); publish({ ...initialState(auth), status: 'error', error: error.message }); return true;
    }
    return false;
  }
  function applyInbox(inbox: NoticeInbox) {
    const items = publicItems(inbox.items);
    const selectedNoticeId = items.some((item) => item.id === state.selectedNoticeId) ? state.selectedNoticeId : null;
    publish({ status: 'ready', items, unread: inbox.unread, selectedNoticeId,
      refreshing: false, error: null, markingReadId: null, readError: null });
  }
  async function refresh(): Promise<void> {
    const auth = observedAuth;
    if (!available() || !auth || pending) return;
    const controller = new AbortController();
    const requestId = generation;
    pending = controller;
    publish({ status: state.items === null ? 'loading' : 'ready', refreshing: state.items !== null,
      error: null, readError: null });
    const current = () => available() && observedAuth === auth && generation === requestId
      && pending === controller && !controller.signal.aborted;
    try {
      if (!current()) return;
      const inbox = await actions.list({ signal: controller.signal });
      if (!current()) return;
      pending = null; applyInbox(inbox);
    } catch (error) {
      if (!current()) return;
      if (authorizationFailure(error, auth)) return;
      pending = null;
      publish({ status: state.items === null ? 'error' : 'ready', refreshing: false,
        error: error instanceof NoticesError ? error.message : 'No pudimos cargar tus avisos. Inténtalo de nuevo.' });
    } finally { if (pending === controller) pending = null; }
  }
  async function markSelectedRead(): Promise<void> {
    const auth = observedAuth;
    const id = state.selectedNoticeId;
    const notice = state.items?.find((item) => item.id === id);
    if (!available() || !auth || pending || !id || !notice || notice.readAt !== null) return;
    const controller = new AbortController();
    const requestId = generation;
    pending = controller;
    let confirmed = false;
    publish({ markingReadId: id, readError: null, error: null });
    const current = () => available() && observedAuth === auth && generation === requestId
      && pending === controller && !controller.signal.aborted;
    try {
      if (!current()) return;
      const result = await actions.markRead(id, { signal: controller.signal });
      if (!current()) return;
      if (result.id !== id || typeof result.readAt !== 'string') {
        throw new NoticesError('No pudimos confirmar el estado del aviso. Inténtalo de nuevo.', 'invalid-response');
      }
      const updated = publicNotice(result);
      confirmed = true;
      publish({ items: Object.freeze(state.items!.map((item) => item.id === id ? updated : item)),
        unread: null, refreshing: true, error: null, readError: null });
      if (!current()) return;
      const inbox = await actions.list({ signal: controller.signal });
      if (!current()) return;
      pending = null; applyInbox(inbox);
    } catch (error) {
      if (!current()) return;
      if (authorizationFailure(error, auth)) return;
      pending = null;
      if (confirmed) {
        publish({ status: 'ready', refreshing: false, markingReadId: null, readError: null, error: reconcileMessage });
      } else {
        publish({ refreshing: false, markingReadId: null,
          readError: state.selectedNoticeId === id
            ? error instanceof NoticesError ? error.message : 'No pudimos marcar el aviso como leído. Inténtalo de nuevo.' : null });
      }
    } finally { if (pending === controller) pending = null; }
  }
  function synchronize() {
    const auth = session.getSnapshot();
    if (!active || observedAuth === auth) return;
    cancel(); observedAuth = auth;
    if (auth === expiredAuth) { publish(expiredState(auth)); return; }
    expiredAuth = null; publish(initialState(auth));
    if (available()) void refresh();
  }
  return {
    getSnapshot(): NoticesState {
      const auth = session.getSnapshot();
      if (auth === visibleAuth) return state;
      if (hiddenAuth !== auth || !hiddenState) {
        hiddenAuth = auth;
        hiddenState = auth === expiredAuth ? expiredState(auth) : initialState(auth);
      }
      return hiddenState;
    },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start() {
      if (active) return;
      active = true; unsubscribe = session.subscribe(synchronize); synchronize();
    },
    stop() {
      if (!active) return;
      active = false; unsubscribe?.(); unsubscribe = null; cancel(); observedAuth = null;
      visibleAuth = session.getSnapshot();
      state = visibleAuth === expiredAuth ? expiredState(visibleAuth) : initialState(visibleAuth);
    },
    refresh,
    selectNotice(id: string | null) {
      if (!available() || id !== null && !state.items?.some((item) => item.id === id)) return;
      if (state.selectedNoticeId === id) return;
      publish({ selectedNoticeId: id, readError: null });
    },
    markSelectedRead,
  };
}

export type NoticesController = ReturnType<typeof createNoticesController>;
