import { mapCatalogImage } from '../../../catalog/data/mappers/mapCatalogPage';
import { OrderReceiptError } from '../../domain/errors/OrderReceiptError';
import type { ReceiptItem, ReceiptOrder, ReceiptStatus } from '../../domain/models/OrderReceipt';

export function invalidOrderReceiptResponse(): OrderReceiptError {
  return new OrderReceiptError('No pudimos confirmar los datos de recepción. Actualiza la lista e inténtalo de nuevo.', 'invalid-response');
}

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const id = (value: unknown): value is string => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
const integer = (value: unknown, min: number, max: number): value is number => Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
const text = (value: unknown, maximum: number, empty = false): value is string => typeof value === 'string'
  && value === value.trim() && value.length <= maximum && (empty || value.length > 0)
  && !/[\u0000-\u001F\u007F-\u009F]/.test(value);

function cents(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw invalidOrderReceiptResponse();
  const scaled = value * 100;
  const rounded = Math.round(scaled);
  if (!Number.isSafeInteger(rounded) || Math.abs(scaled - rounded) > Number.EPSILON * Math.max(1, scaled) * 16) {
    throw invalidOrderReceiptResponse();
  }
  return rounded;
}

function optionalDate(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) throw invalidOrderReceiptResponse();
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== value) throw invalidOrderReceiptResponse();
  return value;
}

function receiptStatus(value: unknown): ReceiptStatus {
  // Older completed orders did not have this field. The server treats these as pending too.
  if (value === undefined || value === null || value === 'not_required') return 'pending';
  if (value === 'pending' || value === 'confirmed' || value === 'issue_reported') return value;
  throw invalidOrderReceiptResponse();
}

function mapItem(value: unknown): ReceiptItem {
  if (!record(value) || !id(value.productId) || !text(value.productName, 200)
    || !text(value.presentation, 160, true) || value.currency !== 'MXN' || !integer(value.quantity, 1, 25)) {
    throw invalidOrderReceiptResponse();
  }
  const unitPrice = cents(value.unitPrice);
  const subtotal = cents(value.subtotal);
  if (!Number.isSafeInteger(unitPrice * value.quantity) || subtotal !== unitPrice * value.quantity) throw invalidOrderReceiptResponse();
  return Object.freeze({ id: value.productId.toLowerCase(), productId: value.productId.toLowerCase(),
    name: value.productName, imageUrl: mapCatalogImage(value.image), presentation: value.presentation,
    quantity: value.quantity, unitPrice: unitPrice / 100, subtotal: subtotal / 100 });
}

export function mapReceiptOrder(payload: unknown): ReceiptOrder {
  if (!record(payload) || !id(payload.id) || !text(payload.reference, 80)
    || !/^[A-Z\d][A-Z\d-]*$/.test(payload.reference) || payload.status !== 'completed'
    || payload.currency !== 'MXN' || !integer(payload.totalItems, 1, 500)
    || !Array.isArray(payload.items) || payload.items.length < 1 || payload.items.length > 20) {
    throw invalidOrderReceiptResponse();
  }
  const status = receiptStatus(payload.customerReceiptStatus);
  const completedAt = optionalDate(payload.completedAt);
  const confirmedAt = optionalDate(payload.customerReceiptConfirmedAt);
  if (status !== 'confirmed' && confirmedAt !== null) throw invalidOrderReceiptResponse();
  const subtotal = cents(payload.subtotal);
  const items = payload.items.map(mapItem);
  if (new Set(items.map((item) => item.productId)).size !== items.length
    || items.reduce((sum, item) => sum + item.quantity, 0) !== payload.totalItems
    || items.reduce((sum, item) => sum + cents(item.subtotal), 0) !== subtotal) throw invalidOrderReceiptResponse();
  return Object.freeze({ id: payload.id.toLowerCase(), reference: payload.reference, status: 'completed',
    receiptStatus: status, completedAt, confirmedAt, items: Object.freeze(items),
    totalItems: payload.totalItems, subtotal: subtotal / 100, currency: 'MXN' });
}

export function mapReceiptCollection(payload: unknown): readonly ReceiptOrder[] {
  if (!Array.isArray(payload) || payload.length > 12) throw invalidOrderReceiptResponse();
  const orders = payload.map(mapReceiptOrder);
  if (new Set(orders.map((order) => order.id)).size !== orders.length) throw invalidOrderReceiptResponse();
  return Object.freeze(orders);
}

export function mapConfirmedReceipt(payload: unknown, expectedId: string): ReceiptOrder {
  const order = mapReceiptOrder(payload);
  if (order.id !== expectedId || order.receiptStatus !== 'confirmed' || order.confirmedAt === null) throw invalidOrderReceiptResponse();
  return order;
}
