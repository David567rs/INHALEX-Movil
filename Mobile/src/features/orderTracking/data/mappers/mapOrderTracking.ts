import type { OrderHistoryDetail } from '../../../orderHistory/domain/models/OrderHistory';
import { mapOrderHistorySummary } from '../../../orderHistory/data/mappers/mapOrderHistory';
import { OrderTrackingError } from '../../domain/errors/OrderTrackingError';
import type { OrderTracking } from '../../domain/models/OrderTracking';

export function invalidOrderTrackingResponse(): OrderTrackingError {
  return new OrderTrackingError('No pudimos confirmar los datos del seguimiento. Actualiza el pedido e inténtalo de nuevo.', 'invalid-response');
}

function eventDate(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || value.length !== 24
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) throw invalidOrderTrackingResponse();
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) {
    throw invalidOrderTrackingResponse();
  }
  return value;
}

/** Combine the historical detail with the newer authoritative tracking snapshot. */
export function mapOrderTracking(payload: unknown, detail: OrderHistoryDetail): OrderTracking {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw invalidOrderTrackingResponse();
  const source = payload as Record<string, unknown>;
  const summary = mapOrderHistorySummary(source);
  const fields = ['id', 'reference', 'currency', 'createdAt', 'subtotal', 'unitCount'] as const;
  if (fields.some((field) => summary[field] !== detail[field])) throw invalidOrderTrackingResponse();
  const confirmedAt = eventDate(source.confirmedAt);
  const cancelledAt = eventDate(source.cancelledAt);
  const completedAt = eventDate(source.completedAt);
  return Object.freeze({ ...summary, items: detail.items, shippingAddress: detail.shippingAddress,
    confirmedAt, cancelledAt, completedAt });
}
