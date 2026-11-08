import type { AuthSession, AuthSessionState } from '../../../auth/domain/session/AuthSession';
import { OrderReceiptError } from '../../domain/errors/OrderReceiptError';
import type { ReceiptOrder } from '../../domain/models/OrderReceipt';
import type { OrderReceiptActions } from '../../domain/repositories/OrderReceiptRepository';
import { canConfirmReceipt } from '../../domain/useCases/orderReceiptActions';

export type OrderReceiptState = Readonly<{
  status: 'checking' | 'anonymous' | 'recovery-error' | 'loading' | 'ready' | 'error' | 'session-expired';
  /** null is an unread collection; only a successful GET can establish an empty one. */
  orders: readonly ReceiptOrder[] | null;
  selectedOrderId: string | null;
  refreshing: boolean;
  confirming: boolean;
  requiresRefresh: boolean;
  error: string | null;
  confirmError: string | null;
  notice: string | null;
}>;

function initialState(auth: AuthSessionState): OrderReceiptState {
  return Object.freeze({
    status: auth.status === 'authenticated' ? (auth.user ? 'loading' : 'anonymous') : auth.status,
    orders: null, selectedOrderId: null, refreshing: false, confirming: false,
    requiresRefresh: false, error: auth.message, confirmError: null, notice: null,
  });
}

function publicOrder(order: ReceiptOrder): ReceiptOrder {
  return Object.freeze({
    id: order.id, reference: order.reference, status: order.status, receiptStatus: order.receiptStatus,
    completedAt: order.completedAt, confirmedAt: order.confirmedAt,
    totalItems: order.totalItems, subtotal: order.subtotal, currency: order.currency,
    items: Object.freeze(order.items.map((item) => Object.freeze({
      id: item.id, productId: item.productId, name: item.name, imageUrl: item.imageUrl,
      presentation: item.presentation, quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.subtotal,
    }))),
  });
}

export function createOrderReceiptController(session: AuthSession, actions: OrderReceiptActions) {
  let visibleAuth = session.getSnapshot();
  let state = initialState(visibleAuth);
  let observedAuth: AuthSessionState | null = null;
  let expiredAuth: AuthSessionState | null = null;
  let hiddenAuth: AuthSessionState | null = null;
  let hiddenState: OrderReceiptState | null = null;
  let active = false;
  let generation = 0;
  let pending: AbortController | null = null;
  let unsubscribe: (() => void) | null = null;
  let uncertainOrderId: string | null = null;
  // An acknowledged confirmation must not become confirmable through a stale GET.
  // Retain only entries still present in the server's bounded collection window.
  const confirmed = new Map<string, ReceiptOrder>();
  const listeners = new Set<() => void>();

  function publish(patch: Partial<OrderReceiptState>) {
    state = Object.freeze({ ...state, ...patch });
    if (observedAuth) visibleAuth = observedAuth;
    for (const listener of [...listeners]) {
      try { listener(); } catch { /* Observers cannot change an acknowledged write into a failure. */ }
    }
  }
  function cancel() { generation++; pending?.abort(); pending = null; }
  function available() {
    return active && observedAuth?.status === 'authenticated' && !!observedAuth.user
      && observedAuth === session.getSnapshot() && observedAuth !== expiredAuth;
  }
  function current(auth: AuthSessionState, requestId: number, request: AbortController) {
    return available() && observedAuth === auth && generation === requestId
      && pending === request && !request.signal.aborted;
  }
  function expiredState(auth: AuthSessionState): OrderReceiptState {
    return Object.freeze({ ...initialState(auth), status: 'session-expired',
      error: 'Tu sesión ya no es válida. Inicia sesión para consultar la recepción de tus pedidos.' });
  }
  function authorizationFailure(error: unknown, auth: AuthSessionState) {
    if (!(error instanceof OrderReceiptError)
      || (error.kind !== 'unauthorized' && error.kind !== 'forbidden')) return false;
    cancel(); uncertainOrderId = null; confirmed.clear();
    if (error.kind === 'unauthorized') {
      expiredAuth = auth; publish(expiredState(auth));
    } else {
      publish({ ...initialState(auth), status: 'error', error: error.message, requiresRefresh: true });
    }
    return true;
  }
  function collectionSnapshot(orders: readonly ReceiptOrder[]): readonly ReceiptOrder[] {
    const ids = new Set(orders.map((order) => order.id));
    for (const id of confirmed.keys()) if (!ids.has(id)) confirmed.delete(id);
    return Object.freeze(orders.map((order) => {
      const acknowledged = confirmed.get(order.id);
      if (acknowledged && order.receiptStatus === 'pending') return acknowledged;
      const snapshot = publicOrder(order);
      if (snapshot.receiptStatus === 'confirmed') confirmed.set(snapshot.id, snapshot);
      return snapshot;
    }));
  }
  function collectionUpdate(orders: readonly ReceiptOrder[]): Partial<OrderReceiptState> {
    const snapshot = collectionSnapshot(orders);
    const recovered = uncertainOrderId !== null
      && snapshot.some((order) => order.id === uncertainOrderId && order.receiptStatus === 'confirmed');
    const selectedOrderId = snapshot.some((order) => order.id === state.selectedOrderId) ? state.selectedOrderId : null;
    uncertainOrderId = null;
    return { status: 'ready', orders: snapshot, selectedOrderId, refreshing: false, confirming: false,
      requiresRefresh: false, error: null, confirmError: null,
      notice: recovered ? 'La recepción de este pedido ya está confirmada.' : state.notice };
  }
  async function refresh(): Promise<void> {
    const auth = observedAuth;
    if (!available() || !auth || pending) return;
    const request = new AbortController();
    const requestId = generation;
    pending = request;
    publish({ status: state.orders === null ? 'loading' : 'ready', refreshing: state.orders !== null, error: null });
    try {
      if (!current(auth, requestId, request)) return;
      const result = await actions.list({ signal: request.signal });
      if (!current(auth, requestId, request)) return;
      // Prepare the complete snapshot before releasing the request lock.
      const update = collectionUpdate(result);
      pending = null; publish(update);
    } catch (error) {
      if (!current(auth, requestId, request)) return;
      if (authorizationFailure(error, auth)) return;
      pending = null;
      publish({ status: state.orders === null ? 'error' : 'ready', refreshing: false, requiresRefresh: true,
        error: error instanceof OrderReceiptError ? error.message : 'No pudimos cargar tus pedidos. Inténtalo de nuevo.' });
    } finally { if (pending === request) pending = null; }
  }
  async function confirmReceipt(): Promise<void> {
    const auth = observedAuth;
    const order = state.orders?.find((item) => item.id === state.selectedOrderId);
    if (!available() || !auth || pending || !order || !canConfirmReceipt(order)
      || state.status !== 'ready' || state.requiresRefresh) return;
    const request = new AbortController();
    const requestId = generation;
    pending = request;
    publish({ confirming: true, confirmError: null, notice: null, error: null });
    try {
      if (!current(auth, requestId, request)) return;
      const result = await actions.confirm(order.id, { signal: request.signal });
      if (!current(auth, requestId, request)) return;
      if (result.id !== order.id || result.status !== 'completed' || result.receiptStatus !== 'confirmed') {
        throw new OrderReceiptError('No pudimos comprobar la confirmación. Verifica la recepción antes de intentarlo de nuevo.', 'invalid-response');
      }
      const acknowledged = publicOrder(result);
      confirmed.set(order.id, acknowledged);
      uncertainOrderId = null;
      const orders = Object.freeze(state.orders!.map((item) => item.id === order.id ? acknowledged : item));
      pending = null;
      publish({ orders, confirming: false, requiresRefresh: false, confirmError: null,
        notice: 'Confirmaste la recepción de tu pedido.' });
    } catch (error) {
      if (!current(auth, requestId, request)) return;
      if (authorizationFailure(error, auth)) return;
      pending = null;
      uncertainOrderId = order.id;
      publish({ confirming: false, requiresRefresh: true,
        confirmError: error instanceof OrderReceiptError ? error.message
          : 'No pudimos comprobar la confirmación. Verifica la recepción antes de intentarlo de nuevo.' });
      // Recovery is an explicit GET. Never replay a confirmation automatically.
    } finally { if (pending === request) pending = null; }
  }
  function synchronize() {
    const auth = session.getSnapshot();
    if (!active || observedAuth === auth) return;
    cancel(); observedAuth = auth; uncertainOrderId = null; confirmed.clear();
    if (auth === expiredAuth) { publish(expiredState(auth)); return; }
    expiredAuth = null; publish(initialState(auth));
    if (available()) void refresh();
  }
  return {
    getSnapshot(): OrderReceiptState {
      const auth = session.getSnapshot();
      if (auth === visibleAuth) return state;
      if (hiddenAuth !== auth || !hiddenState) {
        hiddenAuth = auth; hiddenState = auth === expiredAuth ? expiredState(auth) : initialState(auth);
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
      uncertainOrderId = null; confirmed.clear(); visibleAuth = session.getSnapshot();
      state = visibleAuth === expiredAuth ? expiredState(visibleAuth) : initialState(visibleAuth);
    },
    refresh, confirmReceipt,
    selectOrder(id: string | null) {
      if (!available() || pending || state.status !== 'ready'
        || (state.requiresRefresh && id !== null)
        || (id !== null && !state.orders?.some((order) => order.id === id))) return;
      if (id === state.selectedOrderId) return;
      publish({ selectedOrderId: id, confirmError: null, notice: null });
    },
  };
}

export type OrderReceiptController = ReturnType<typeof createOrderReceiptController>;
