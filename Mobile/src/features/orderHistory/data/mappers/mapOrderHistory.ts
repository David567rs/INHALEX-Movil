import { mapCatalogImage } from '../../../catalog/data/mappers/mapCatalogPage';
import { OrderHistoryError } from '../../domain/errors/OrderHistoryError';
import type {
  OrderHistoryAddress, OrderHistoryDetail, OrderHistoryItem, OrderHistoryPage,
  OrderHistoryStatus, OrderHistorySummary,
} from '../../domain/models/OrderHistory';

export function invalidOrderHistoryResponse(): OrderHistoryError {
  return new OrderHistoryError('No pudimos confirmar los datos de tu historial. Actualiza la lista e inténtalo de nuevo.', 'invalid-response');
}

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown, min: number, max: number): value is number => Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
const id = (value: unknown): value is string => typeof value === 'string' && value.length === 24 && /^[a-f\d]{24}$/i.test(value);
const text = (value: unknown, maximum: number, empty = false, multiline = false): value is string => typeof value === 'string'
  && value.length <= maximum && value === value.trim() && (empty || value.length > 0)
  && ![...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 && !(multiline && (code === 10 || code === 13)) || code >= 127 && code <= 159;
  });

function cents(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw invalidOrderHistoryResponse();
  const scaled = value * 100;
  const rounded = Math.round(scaled);
  if (!Number.isSafeInteger(rounded) || Math.abs(scaled - rounded) > Number.EPSILON * Math.max(1, scaled) * 16) {
    throw invalidOrderHistoryResponse();
  }
  return rounded;
}

function isoDate(value: unknown): value is string {
  if (typeof value !== 'string' || value.length !== 24 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

export function mapOrderHistorySummary(payload: unknown): OrderHistorySummary {
  if (!record(payload) || !id(payload.id) || !text(payload.reference, 80)
    || !/^[A-Z\d][A-Z\d-]*$/.test(payload.reference)
    || !['pending_review', 'confirmed', 'cancelled', 'completed'].includes(payload.status as string)
    || payload.currency !== 'MXN' || !integer(payload.totalItems, 1, 500) || !isoDate(payload.createdAt)) {
    throw invalidOrderHistoryResponse();
  }
  return Object.freeze({
    id: payload.id.toLowerCase(), reference: payload.reference, status: payload.status as OrderHistoryStatus,
    currency: 'MXN', unitCount: payload.totalItems, subtotal: cents(payload.subtotal) / 100,
    createdAt: payload.createdAt,
  });
}

export function mapOrderHistoryPage(payload: unknown): OrderHistoryPage {
  if (!record(payload) || !Array.isArray(payload.orders) || payload.orders.length > 20
    || (payload.nextCursor !== null && (typeof payload.nextCursor !== 'string' || payload.nextCursor.length === 0
      || payload.nextCursor.length > 256 || !/^[A-Za-z0-9_-]+$/.test(payload.nextCursor)))) {
    throw invalidOrderHistoryResponse();
  }
  const orders = payload.orders.map(mapOrderHistorySummary);
  if (new Set(orders.map((order) => order.id)).size !== orders.length || orders.length === 0 && payload.nextCursor !== null) {
    throw invalidOrderHistoryResponse();
  }
  return Object.freeze({ orders: Object.freeze(orders), nextCursor: payload.nextCursor as string | null });
}

function mapAddress(payload: unknown): OrderHistoryAddress | null {
  if (payload === null) return null;
  if (!record(payload)) throw invalidOrderHistoryResponse();
  const fields = {
    label: 40, recipientName: 120, phone: 15, street: 120, exteriorNumber: 20,
    neighborhood: 100, municipality: 100, state: 100, postalCode: 5,
  } as const;
  if (Object.entries(fields).some(([field, maximum]) => !text(payload[field], maximum))
    || !/^[\d]{10,15}$/.test(payload.phone as string) || !/^[\d]{5}$/.test(payload.postalCode as string)) {
    throw invalidOrderHistoryResponse();
  }
  const interiorNumber = payload.interiorNumber ?? '';
  const references = payload.references ?? '';
  if (!text(interiorNumber, 20, true) || !text(references, 300, true, true)) throw invalidOrderHistoryResponse();
  return Object.freeze({
    label: payload.label as string, recipientName: payload.recipientName as string, phone: payload.phone as string,
    street: payload.street as string, exteriorNumber: payload.exteriorNumber as string, interiorNumber,
    neighborhood: payload.neighborhood as string, municipality: payload.municipality as string,
    state: payload.state as string, postalCode: payload.postalCode as string, references,
  });
}

export function mapOrderHistoryDetail(payload: unknown, expectedId: string): OrderHistoryDetail {
  const summary = mapOrderHistorySummary(payload);
  if (!record(payload) || summary.id !== expectedId.toLowerCase() || !Array.isArray(payload.items)
    || payload.items.length === 0 || payload.items.length > 20) throw invalidOrderHistoryResponse();
  const items = payload.items.map((entry): OrderHistoryItem => {
    if (!record(entry) || !id(entry.productId) || !text(entry.productName, 120)
      || !text(entry.presentation, 160) || !integer(entry.quantity, 1, 25) || entry.currency !== 'MXN') {
      throw invalidOrderHistoryResponse();
    }
    const unit = cents(entry.unitPrice);
    const subtotal = cents(entry.subtotal);
    if (!Number.isSafeInteger(unit * entry.quantity) || subtotal !== unit * entry.quantity) throw invalidOrderHistoryResponse();
    return Object.freeze({
      productId: entry.productId.toLowerCase(), productName: entry.productName, presentation: entry.presentation,
      image: mapCatalogImage(entry.image), quantity: entry.quantity, unitPrice: unit / 100,
      subtotal: subtotal / 100, currency: 'MXN',
    });
  });
  const units = items.reduce((sum, item) => sum + item.quantity, 0);
  const amount = items.reduce((sum, item) => sum + cents(item.subtotal), 0);
  if (new Set(items.map((item) => item.productId)).size !== items.length
    || units !== summary.unitCount || amount !== cents(summary.subtotal)) throw invalidOrderHistoryResponse();
  return Object.freeze({ ...summary, items: Object.freeze(items), shippingAddress: mapAddress(payload.shippingAddress) });
}
