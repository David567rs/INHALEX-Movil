import type { AuthSession, AuthSessionState } from '../../../auth/domain/session/AuthSession';
import type { CatalogProduct } from '../../../catalog/domain/models/Catalog';
import { CartError } from '../../domain/errors/CartError';
import type { Cart } from '../../domain/models/Cart';
import type { CartActions } from '../../domain/useCases/cartActions';

export interface CartState {
  readonly status: 'checking' | 'anonymous' | 'recovery-error' | 'loading' | 'ready' | 'error' | 'session-expired';
  readonly cart: Cart | null;
  readonly loaded: boolean;
  readonly refreshing: boolean;
  readonly pendingProductId: string | null;
  readonly error: string | null;
  readonly mutationError: string | null;
  readonly notice: string | null;
}

function initialState(auth: AuthSessionState): CartState {
  return Object.freeze({
    status: auth.status === 'authenticated' ? 'loading' : auth.status,
    cart: null, loaded: false, refreshing: false, pendingProductId: null,
    error: auth.message, mutationError: null, notice: null,
  });
}

function expiredState(): CartState {
  return Object.freeze({
    status: 'session-expired', cart: null, loaded: false, refreshing: false,
    pendingProductId: null, mutationError: null, notice: null,
    error: 'Tu sesión ya no es válida. Inicia sesión de nuevo para consultar tu bolsa.',
  });
}

/** Copy confirmed values so neither an adapter nor a consumer can mutate a snapshot. */
function confirmedCart(cart: Cart): Cart {
  return Object.freeze({
    ...cart,
    items: Object.freeze(cart.items.map((item) => Object.freeze({
      ...item,
      product: Object.freeze({ ...item.product, aromas: Object.freeze([...item.product.aromas]) }),
    }))),
  });
}

const readError = (error: unknown) => error instanceof CartError
  ? error.message : 'No pudimos cargar tu bolsa. Inténtalo de nuevo.';
const mutationError = (error: unknown) => error instanceof CartError
  ? error.message : 'No pudimos actualizar tu bolsa. Actualiza la lista para comprobar su estado.';

/** All operations share one lock because each backend write returns the complete cart. */
export function createCartController(session: AuthSession, actions: CartActions) {
  let state = initialState(session.getSnapshot());
  let active = false;
  let generation = 0;
  let observedSession: AuthSessionState | null = null;
  let expiredSession: AuthSessionState | null = null;
  let unsubscribeSession: (() => void) | null = null;
  let pendingOperation: AbortController | null = null;
  const listeners = new Set<() => void>();

  function publish(patch: Partial<CartState>) {
    state = Object.freeze({ ...state, ...patch });
    for (const listener of [...listeners]) {
      try { listener(); }
      catch { /* Observer failures cannot alter a confirmed operation. */ }
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
      || state.status === 'session-expired' || pendingOperation) return;
    const controller = new AbortController();
    const requestId = generation;
    pendingOperation = controller;
    publish({ status: state.loaded ? 'ready' : 'loading', refreshing: state.loaded,
      pendingProductId: null, error: null, mutationError: null, notice: null });
    try {
      if (!current(auth, requestId, controller)) return;
      const cart = await actions.list({ signal: controller.signal });
      if (!current(auth, requestId, controller)) return;
      const snapshot = confirmedCart(cart);
      pendingOperation = null;
      publish({ status: 'ready', cart: snapshot, loaded: true, refreshing: false, error: null });
    } catch (error) {
      if (!current(auth, requestId, controller)) return;
      if (error instanceof CartError && error.kind === 'unauthorized') {
        expireSession();
        return;
      }
      pendingOperation = null;
      publish({ status: 'error', refreshing: false, error: readError(error) });
    } finally {
      if (pendingOperation === controller) pendingOperation = null;
    }
  }

  async function mutate(productId: string, operation: (signal: AbortSignal) => Promise<Cart>, notice: string): Promise<void> {
    const auth = observedSession;
    if (!active || auth?.status !== 'authenticated' || session.getSnapshot() !== auth
      || state.status !== 'ready' || !state.loaded || pendingOperation) return;
    const controller = new AbortController();
    const requestId = generation;
    pendingOperation = controller;
    publish({ pendingProductId: productId, error: null, mutationError: null, notice: null });
    try {
      if (!current(auth, requestId, controller)) return;
      const cart = await operation(controller.signal);
      if (!current(auth, requestId, controller)) return;
      const snapshot = confirmedCart(cart);
      pendingOperation = null;
      publish({ status: 'ready', cart: snapshot, loaded: true, pendingProductId: null, notice });
    } catch (error) {
      if (!current(auth, requestId, controller)) return;
      if (error instanceof CartError && error.kind === 'unauthorized') {
        expireSession();
        return;
      }
      pendingOperation = null;
      // A write may have reached the server. Only GET can reconcile it before another write.
      publish({ status: 'error', pendingProductId: null, mutationError: mutationError(error) });
    } finally {
      if (pendingOperation === controller) pendingOperation = null;
    }
  }

  function synchronizeSession() {
    const auth = session.getSnapshot();
    if (!active || observedSession === auth) return;
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
    add: (product: CatalogProduct, quantity = 1) => mutate(product.id,
      (signal) => actions.add(product.id, quantity, { signal }), 'Producto agregado a tu bolsa.'),
    updateQuantity: (productId: string, quantity: number) => {
      if (!state.cart?.items.some((item) => item.productId === productId)) return Promise.resolve();
      return mutate(productId, (signal) => actions.updateQuantity(productId, quantity, { signal }), 'Cantidad actualizada.');
    },
    remove: (productId: string) => {
      if (!state.cart?.items.some((item) => item.productId === productId)) return Promise.resolve();
      return mutate(productId, (signal) => actions.remove(productId, { signal }), 'Producto eliminado de tu bolsa.');
    },
  };
}

export type CartController = ReturnType<typeof createCartController>;
