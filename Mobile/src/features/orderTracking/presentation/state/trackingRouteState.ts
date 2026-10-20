import { normalizeOrderTrackingId } from '../../domain/useCases/orderTrackingActions';
import type { OrderTrackingState } from './createOrderTrackingController';

/** Render-time guard: a changed route must never paint the former selected order. */
export function trackingRouteState(state: OrderTrackingState, orderId: string | null): OrderTrackingState {
  let id: string | null = null;
  let invalid = false;
  try { id = orderId === null ? null : normalizeOrderTrackingId(orderId); }
  catch { invalid = true; }
  if (['checking', 'anonymous', 'recovery-error', 'session-expired'].includes(state.status)) {
    return Object.freeze({ ...state, selectedOrderId: id, order: null, refreshing: false });
  }
  if (invalid) return Object.freeze({
    status: 'not-found', selectedOrderId: null, order: null, refreshing: false,
    error: 'No encontramos ese pedido en tu cuenta. Vuelve a tu historial y elige otro pedido.',
  });
  if (id === null) return Object.freeze({
    status: 'idle', selectedOrderId: null, order: null, refreshing: false, error: null,
  });
  if (state.selectedOrderId !== id || state.order && state.order.id !== id) return Object.freeze({
    status: 'loading', selectedOrderId: id, order: null, refreshing: false, error: null,
  });
  return state;
}
