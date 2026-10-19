import type { AuthSession, AuthSessionState } from '../../../auth/domain/session/AuthSession';
import type { CatalogProduct } from '../../../catalog/domain/models/Catalog';
import { FavoritesError } from '../../domain/errors/FavoritesError';
import type { FavoritesActions } from '../../domain/repositories/FavoritesRepository';

export interface FavoritesState {
  readonly status: 'checking' | 'anonymous' | 'recovery-error' | 'loading' | 'ready' | 'error' | 'session-expired';
  readonly products: readonly CatalogProduct[];
  readonly loaded: boolean;
  readonly refreshing: boolean;
  readonly pendingProductIds: readonly string[];
  readonly error: string | null;
  readonly mutationError: string | null;
}

function initialState(auth: AuthSessionState): FavoritesState {
  return Object.freeze({
    status: auth.status === 'authenticated' ? 'loading' : auth.status,
    products: Object.freeze([]),
    loaded: false,
    refreshing: false,
    pendingProductIds: Object.freeze([]),
    error: auth.message,
    mutationError: null,
  });
}

const readError = (error: unknown) => error instanceof FavoritesError
  ? error.message : 'No pudimos cargar tus favoritos. Inténtalo de nuevo.';
const mutationError = (error: unknown) => error instanceof FavoritesError
  ? error.message : 'No pudimos actualizar tus favoritos. Inténtalo de nuevo.';

function expiredState(): FavoritesState {
  return Object.freeze({
    status: 'session-expired', products: Object.freeze([]), loaded: false, refreshing: false,
    pendingProductIds: Object.freeze([]), mutationError: null,
    error: 'Tu sesión ya no es válida. Inicia sesión de nuevo para consultar tus favoritos.',
  });
}

/** A single runtime controller keeps the list and detail hearts in the same session. */
export function createFavoritesController(session: AuthSession, actions: FavoritesActions) {
  let state = initialState(session.getSnapshot());
  let active = false;
  let generation = 0;
  let observedSession: AuthSessionState | null = null;
  let expiredSession: AuthSessionState | null = null;
  let unsubscribeSession: (() => void) | null = null;
  let pendingRead: AbortController | null = null;
  const mutations = new Map<string, AbortController>();
  const listeners = new Set<() => void>();

  function publish(patch: Partial<FavoritesState>) {
    state = Object.freeze({ ...state, ...patch });
    for (const listener of [...listeners]) {
      try { listener(); }
      catch { /* Observers cannot change the result of a confirmed operation. */ }
    }
  }

  function cancelOperations() {
    generation++;
    pendingRead?.abort();
    pendingRead = null;
    for (const controller of mutations.values()) controller.abort();
    mutations.clear();
  }

  function current(auth: AuthSessionState, requestId: number, controller: AbortController) {
    return active && generation === requestId && !controller.signal.aborted
      && observedSession === auth && session.getSnapshot() === auth
      && auth.status === 'authenticated';
  }

  function expireSession() {
    cancelOperations();
    expiredSession = observedSession;
    publish(expiredState());
  }

  async function refresh(): Promise<void> {
    const auth = observedSession;
    if (!active || auth?.status !== 'authenticated' || session.getSnapshot() !== auth
      || state.status === 'session-expired' || pendingRead || mutations.size > 0) return;
    const controller = new AbortController();
    const requestId = generation;
    pendingRead = controller;
    publish({ status: state.loaded ? 'ready' : 'loading', refreshing: state.loaded,
      error: null, mutationError: null });
    try {
      if (!current(auth, requestId, controller)) return;
      const products = await actions.list({ signal: controller.signal });
      if (!current(auth, requestId, controller)) return;
      pendingRead = null;
      publish({ status: 'ready', products: Object.freeze([...products]), loaded: true,
        refreshing: false, error: null });
    } catch (error) {
      if (!current(auth, requestId, controller)) return;
      if (error instanceof FavoritesError && error.kind === 'unauthorized') {
        expireSession();
        return;
      }
      pendingRead = null;
      // A failed read cannot replace the last server-confirmed collection with an empty one.
      publish({ status: state.loaded ? 'ready' : 'error', refreshing: false, error: readError(error) });
    } finally {
      if (pendingRead === controller) pendingRead = null;
    }
  }

  async function mutate(productId: string, product?: CatalogProduct): Promise<void> {
    const auth = observedSession;
    if (!active || auth?.status !== 'authenticated' || session.getSnapshot() !== auth
      || state.status !== 'ready' || !state.loaded || pendingRead || mutations.has(productId)) return;
    const present = state.products.some((item) => item.id === productId);
    if ((product && present) || (!product && !present)) return;
    const controller = new AbortController();
    const requestId = generation;
    mutations.set(productId, controller);
    publish({ pendingProductIds: Object.freeze([...mutations.keys()]), mutationError: null });
    try {
      if (!current(auth, requestId, controller)) return;
      if (product) await actions.add(productId, { signal: controller.signal });
      else await actions.remove(productId, { signal: controller.signal });
      if (!current(auth, requestId, controller)) return;
      mutations.delete(productId);
      publish({
        products: Object.freeze(product ? [...state.products, product]
          : state.products.filter((item) => item.id !== productId)),
        pendingProductIds: Object.freeze([...mutations.keys()]),
      });
    } catch (error) {
      if (!current(auth, requestId, controller)) return;
      if (error instanceof FavoritesError && error.kind === 'unauthorized') {
        expireSession();
        return;
      }
      mutations.delete(productId);
      publish({ pendingProductIds: Object.freeze([...mutations.keys()]), mutationError: mutationError(error) });
    } finally {
      if (mutations.get(productId) === controller) mutations.delete(productId);
    }
  }

  function synchronizeSession() {
    const auth = session.getSnapshot();
    if (!active || observedSession === auth) return;
    // The snapshot identity also detects another login to the same user ID.
    cancelOperations();
    observedSession = auth;
    if (auth === expiredSession) {
      publish(expiredState());
      return;
    }
    expiredSession = null;
    publish(initialState(auth));
    if (auth.status === 'authenticated') void refresh();
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
      state = auth === expiredSession ? expiredState() : initialState(auth);
    },
    refresh,
    add: (product: CatalogProduct) => mutate(product.id, product),
    remove: (productId: string) => mutate(productId),
  };
}

export type FavoritesController = ReturnType<typeof createFavoritesController>;
