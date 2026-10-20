import type { AuthSession, AuthSessionState } from '../../../auth/domain/session/AuthSession';
import { OrderTrackingError } from '../../domain/errors/OrderTrackingError';
import type { OrderTracking } from '../../domain/models/OrderTracking';
import type { OrderTrackingActions } from '../../domain/repositories/OrderTrackingRepository';
import { normalizeOrderTrackingId } from '../../domain/useCases/orderTrackingActions';

export type OrderTrackingState = Readonly<{
  status: 'checking' | 'anonymous' | 'recovery-error' | 'idle' | 'loading' | 'ready'
    | 'not-found' | 'error' | 'session-expired';
  selectedOrderId: string | null;
  order: OrderTracking | null;
  error: string | null;
  refreshing: boolean;
}>;

const missingMessage = 'No encontramos ese pedido en tu cuenta. Vuelve a tu historial y elige otro pedido.';
function emptyState(auth: AuthSessionState, id: string | null, invalid = false): OrderTrackingState {
  const authenticated = auth.status === 'authenticated' && !!auth.user;
  return Object.freeze({
    status: authenticated ? (invalid ? 'not-found' : id ? 'loading' : 'idle')
      : auth.status === 'authenticated' ? 'anonymous' : auth.status,
    selectedOrderId: id, order: null, error: authenticated && invalid ? missingMessage : auth.message,
    refreshing: false,
  });
}
function publicOrder(order: OrderTracking): OrderTracking {
  const address = order.shippingAddress;
  return Object.freeze({
    id: order.id, reference: order.reference, status: order.status, currency: order.currency,
    unitCount: order.unitCount, subtotal: order.subtotal, createdAt: order.createdAt,
    confirmedAt: order.confirmedAt, cancelledAt: order.cancelledAt, completedAt: order.completedAt,
    items: Object.freeze(order.items.map((item) => Object.freeze({
      productId: item.productId, productName: item.productName, presentation: item.presentation,
      image: item.image, quantity: item.quantity, unitPrice: item.unitPrice,
      subtotal: item.subtotal, currency: item.currency,
    }))),
    shippingAddress: address ? Object.freeze({
      label: address.label, recipientName: address.recipientName, phone: address.phone,
      street: address.street, exteriorNumber: address.exteriorNumber, interiorNumber: address.interiorNumber,
      neighborhood: address.neighborhood, municipality: address.municipality, state: address.state,
      postalCode: address.postalCode, references: address.references,
    }) : null,
  });
}

/** The selected order is read only for the current private authorization identity. */
export function createOrderTrackingController(session: AuthSession, actions: OrderTrackingActions) {
  let active = false;
  let generation = 0;
  let selectedId: string | null = null;
  let invalidSelection = false;
  let observedAuth: AuthSessionState | null = null;
  let visibleAuth = session.getSnapshot();
  let expiredAuth: AuthSessionState | null = null;
  let state = emptyState(visibleAuth, selectedId);
  let hiddenAuth: AuthSessionState | null = null;
  let hiddenState: OrderTrackingState | null = null;
  let pending: AbortController | null = null;
  let unsubscribe: (() => void) | null = null;
  const listeners = new Set<() => void>();

  function publish(patch: Partial<OrderTrackingState>) {
    state = Object.freeze({ ...state, ...patch });
    if (observedAuth) visibleAuth = observedAuth;
    for (const listener of [...listeners]) {
      try { listener(); } catch { /* An observer cannot change a confirmed read. */ }
    }
  }
  function cancel() { generation++; pending?.abort(); pending = null; }
  function available() {
    return active && observedAuth?.status === 'authenticated' && !!observedAuth.user
      && session.getSnapshot() === observedAuth && observedAuth !== expiredAuth;
  }
  function expiredState(auth: AuthSessionState): OrderTrackingState {
    return Object.freeze({ ...emptyState(auth, selectedId), status: 'session-expired',
      error: 'Tu sesión ya no es válida. Inicia sesión para consultar tu pedido.' });
  }
  async function refresh(): Promise<void> {
    const auth = observedAuth;
    const id = selectedId;
    if (!available() || !auth || !id || invalidSelection || pending) return;
    const controller = new AbortController();
    const requestId = generation;
    pending = controller;
    publish({ status: state.order ? 'ready' : 'loading', refreshing: !!state.order, error: null });
    const current = () => available() && observedAuth === auth && generation === requestId
      && pending === controller && selectedId === id && !controller.signal.aborted;
    try {
      if (!current()) return;
      const result = await actions.get(id, { signal: controller.signal });
      if (!current()) return;
      if (result.id !== id) throw new OrderTrackingError('No pudimos confirmar el pedido seleccionado. Inténtalo de nuevo.', 'invalid-response');
      const order = publicOrder(result);
      pending = null;
      publish({ status: 'ready', order, refreshing: false, error: null });
    } catch (error) {
      if (!current()) return;
      if (error instanceof OrderTrackingError && error.kind === 'unauthorized') {
        expiredAuth = auth; cancel(); publish(expiredState(auth)); return;
      }
      pending = null;
      if (error instanceof OrderTrackingError && (error.kind === 'not-found' || error.kind === 'invalid-request')) {
        publish({ status: 'not-found', order: null, refreshing: false, error: missingMessage }); return;
      }
      if (error instanceof OrderTrackingError && error.kind === 'forbidden') {
        publish({ status: 'error', order: null, refreshing: false, error: error.message }); return;
      }
      publish({ status: state.order ? 'ready' : 'error', refreshing: false,
        error: error instanceof OrderTrackingError ? error.message : 'No pudimos consultar tu pedido. Inténtalo de nuevo.' });
    } finally { if (pending === controller) pending = null; }
  }
  function synchronize() {
    const auth = session.getSnapshot();
    if (!active || observedAuth === auth) return;
    cancel(); observedAuth = auth;
    if (auth === expiredAuth) { publish(expiredState(auth)); return; }
    expiredAuth = null;
    publish(emptyState(auth, selectedId, invalidSelection));
    if (available() && selectedId && !invalidSelection) void refresh();
  }
  return {
    getSnapshot(): OrderTrackingState {
      const auth = session.getSnapshot();
      if (auth === visibleAuth) return state;
      if (hiddenAuth !== auth || !hiddenState) {
        hiddenAuth = auth;
        hiddenState = auth === expiredAuth ? expiredState(auth) : emptyState(auth, selectedId, invalidSelection);
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
      state = visibleAuth === expiredAuth ? expiredState(visibleAuth) : emptyState(visibleAuth, selectedId, invalidSelection);
    },
    refresh,
    async selectOrder(id: string | null): Promise<void> {
      let normalized: string | null = null;
      let invalid = false;
      try { normalized = id === null ? null : normalizeOrderTrackingId(id); }
      catch { invalid = true; }
      if (selectedId === normalized && invalidSelection === invalid) return;
      cancel(); selectedId = normalized; invalidSelection = invalid;
      const auth = session.getSnapshot();
      publish(auth === expiredAuth ? expiredState(auth) : emptyState(auth, selectedId, invalidSelection));
      if (available() && selectedId && !invalidSelection) await refresh();
    },
  };
}

export type OrderTrackingController = ReturnType<typeof createOrderTrackingController>;
