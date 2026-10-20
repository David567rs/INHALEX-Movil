import type { OrderTracking, OrderTrackingStatus } from '../../domain/models/OrderTracking';

const labels: Record<OrderTrackingStatus, string> = {
  pending_review: 'En revisión', confirmed: 'Confirmado', cancelled: 'Cancelado', completed: 'Completado',
};
const date = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const formatTrackingDate = (value: string) => date.format(new Date(value));
export const trackingStatusLabel = (status: OrderTrackingStatus) => labels[status];
export type OrderTrackingStep = Readonly<{
  id: OrderTrackingStatus; label: string; description: string; dateLabel: string | null;
  state: 'past' | 'current' | 'upcoming';
}>;

/** Only event timestamps returned by the API become dated historical steps. */
export function trackingTimeline(order: OrderTracking): readonly OrderTrackingStep[] {
  const step = (id: OrderTrackingStatus, description: string, timestamp: string | null,
    state: OrderTrackingStep['state'], label = labels[id]): OrderTrackingStep => Object.freeze({
    id, label, description, dateLabel: timestamp ? formatTrackingDate(timestamp) : null, state,
  });
  const received = step('pending_review', 'Recibimos el pedido para su revisión.', order.createdAt,
    order.status === 'pending_review' ? 'current' : 'past', 'Pedido recibido');
  if (order.status === 'cancelled') return Object.freeze([
    received,
    ...(order.confirmedAt ? [step('confirmed', 'El pedido fue confirmado por INHALEX.', order.confirmedAt, 'past')] : []),
    step('cancelled', 'El pedido está cancelado.', order.cancelledAt, 'current'),
  ]);
  const confirmed = order.status === 'completed' && !order.confirmedAt ? [] : [
    step('confirmed', order.status === 'pending_review' ? 'Pendiente de confirmación.'
      : order.confirmedAt ? 'El pedido fue confirmado por INHALEX.' : 'El estado actual del pedido es Confirmado.',
    order.status === 'pending_review' ? null : order.confirmedAt,
    order.status === 'confirmed' ? 'current' : order.status === 'completed' ? 'past' : 'upcoming'),
  ];
  return Object.freeze([
    received, ...confirmed,
    step('completed', order.status === 'completed' ? 'El pedido está completado.' : 'El pedido aún no está completado.',
      order.status === 'completed' ? order.completedAt : null, order.status === 'completed' ? 'current' : 'upcoming'),
  ]);
}
