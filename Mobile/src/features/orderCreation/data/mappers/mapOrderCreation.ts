import isISO4217 from 'validator/lib/isISO4217';
import isISO8601 from 'validator/lib/isISO8601';
import { mapCatalogImage } from '../../../catalog/data/mappers/mapCatalogPage';
import { OrderCreationError } from '../../domain/errors/OrderCreationError';
import type { OrderConfirmation, OrderItemInput, OrderQuote, OrderQuoteIssue, OrderQuoteItem, OrderStatus } from '../../domain/models/OrderCreation';
import { isOrderId, isOrderPreviewSignature } from '../../domain/validation/orderCreationValidation';

export function invalidOrderResponse(): OrderCreationError {
  return new OrderCreationError('No pudimos confirmar la respuesta del pedido. Revisa su estado antes de continuar.', 'invalid-response');
}

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown, min: number, max: number): value is number => Number.isSafeInteger(value) && (value as number) >= min && (value as number) <= max;
const text = (value: unknown, max: number, empty = false): value is string => typeof value === 'string'
  && value.length <= max && value === value.trim() && (empty || value.length > 0)
  && ![...value].some((character) => { const code = character.charCodeAt(0); return code < 32 && code !== 10 && code !== 13 || code === 127; });

function cents(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw invalidOrderResponse();
  const amount = value * 100;
  const rounded = Math.round(amount);
  if (!Number.isSafeInteger(rounded) || Math.abs(amount - rounded) > Number.EPSILON * Math.max(1, amount) * 16) throw invalidOrderResponse();
  return rounded;
}

function optionalText(value: unknown, maximum: number): string | null {
  if (value === undefined || value === null) return null;
  if (!text(value, maximum, true)) throw invalidOrderResponse();
  return value || null;
}

/** Whitelist the response, distinguishing current availability from a stored order snapshot. */
function mapQuote(payload: unknown, expected: readonly OrderItemInput[], currentAvailability: boolean): OrderQuote {
  if (!record(payload) || !Array.isArray(payload.items) || payload.items.length > 20
    || !Array.isArray(payload.issues) || payload.issues.length > 40
    || !integer(payload.totalItems, 0, 500) || typeof payload.currency !== 'string'
    || !/^[A-Z]{3}$/.test(payload.currency) || !isISO4217(payload.currency)
    || typeof payload.canCreateDraft !== 'boolean' || typeof payload.canConfirmOrder !== 'boolean'
    || typeof payload.needsManualReview !== 'boolean' || !isOrderPreviewSignature(payload.signature)) throw invalidOrderResponse();
  const requested = new Map(expected.map((item) => [item.productId.toLowerCase(), item.quantity]));
  const seen = new Set<string>();
  const currency = payload.currency;
  const items = payload.items.map((entry): OrderQuoteItem => {
    if (!record(entry) || !isOrderId(entry.productId) || !text(entry.productName, 120)
      || !text(entry.productSlug, 200) || !text(entry.category, 120)
      || !text(entry.presentation, 160) || !text(entry.origin, 200)
      || !integer(entry.requestedQuantity, 1, 25) || !integer(entry.quantity, 1, 25)
      || entry.quantity > entry.requestedQuantity || entry.currency !== currency
      || !['available', 'adjusted', 'backorder', 'manual'].includes(entry.fulfillment as string)
      || !integer(entry.reservedQuantity, 0, 25) || !integer(entry.backorderQuantity, 0, 25)
      || entry.reservedQuantity + entry.backorderQuantity > entry.quantity
      || typeof entry.inventoryTracked !== 'boolean' || typeof entry.allowBackorder !== 'boolean') throw invalidOrderResponse();
    const id = entry.productId.toLowerCase();
    if (seen.has(id) || requested.get(id) !== entry.requestedQuantity) throw invalidOrderResponse();
    seen.add(id);
    const stockAvailable = entry.stockAvailable === undefined || entry.stockAvailable === null ? null : entry.stockAvailable;
    if (stockAvailable !== null && !integer(stockAvailable, 0, Number.MAX_SAFE_INTEGER)) throw invalidOrderResponse();
    if ((entry.inventoryTracked && stockAvailable === null) || (!entry.inventoryTracked && stockAvailable !== null)) throw invalidOrderResponse();
    // A completed/reconciled order stores the remaining stock AFTER its additional
    // reservation. That historical value can be lower than the quantity it reserved.
    if (currentAvailability && stockAvailable !== null && entry.reservedQuantity > stockAvailable) throw invalidOrderResponse();
    if (entry.fulfillment === 'manual') {
      if (entry.inventoryTracked || entry.quantity !== entry.requestedQuantity || entry.reservedQuantity !== 0 || entry.backorderQuantity !== 0) throw invalidOrderResponse();
    } else {
      if (!entry.inventoryTracked || entry.reservedQuantity + entry.backorderQuantity !== entry.quantity) throw invalidOrderResponse();
      if (entry.fulfillment === 'backorder' && (!entry.allowBackorder || entry.backorderQuantity <= 0
        || entry.quantity !== entry.requestedQuantity)) throw invalidOrderResponse();
      if (entry.fulfillment === 'adjusted' && (entry.quantity >= entry.requestedQuantity || entry.allowBackorder
        || entry.reservedQuantity !== entry.quantity || currentAvailability && stockAvailable !== entry.quantity)) throw invalidOrderResponse();
      if (entry.fulfillment === 'available' && (entry.quantity !== entry.requestedQuantity || entry.backorderQuantity !== 0)) throw invalidOrderResponse();
    }
    const unit = cents(entry.unitPrice);
    if (cents(entry.subtotal) !== unit * entry.quantity || !Number.isSafeInteger(unit * entry.quantity)) throw invalidOrderResponse();
    return Object.freeze({
      productId: id, productName: entry.productName, productSlug: entry.productSlug,
      image: mapCatalogImage(entry.image), category: entry.category, presentation: entry.presentation,
      origin: entry.origin, unitPrice: entry.unitPrice as number, currency,
      requestedQuantity: entry.requestedQuantity, quantity: entry.quantity, subtotal: entry.subtotal as number,
      fulfillment: entry.fulfillment as OrderQuoteItem['fulfillment'], stockAvailable,
      reservedQuantity: entry.reservedQuantity, backorderQuantity: entry.backorderQuantity,
      inventoryTracked: entry.inventoryTracked, allowBackorder: entry.allowBackorder,
      message: optionalText(entry.message, 1000),
    });
  });
  const issues = payload.issues.map((entry): OrderQuoteIssue => {
    if (!record(entry) || !text(entry.code, 80) || !/^[a-zA-Z0-9_-]+$/.test(entry.code)
      || !['info', 'warning', 'error'].includes(entry.severity as string)
      || !text(entry.title, 200) || !text(entry.description, 2000)
      || entry.productId !== undefined && entry.productId !== null && !isOrderId(entry.productId)) throw invalidOrderResponse();
    const productId = typeof entry.productId === 'string' ? entry.productId.toLowerCase() : null;
    if (productId && !requested.has(productId)) throw invalidOrderResponse();
    return Object.freeze({ code: entry.code, severity: entry.severity as OrderQuoteIssue['severity'],
      productId, productName: optionalText(entry.productName, 120), title: entry.title, description: entry.description });
  });
  const total = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + cents(item.subtotal), 0);
  const manual = items.some((item) => item.fulfillment === 'manual' || item.fulfillment === 'backorder');
  if ([...requested.keys()].some((id) => !seen.has(id)
    && !issues.some((issue) => issue.productId === id && issue.severity === 'error'))) throw invalidOrderResponse();
  if (payload.totalItems !== total || !Number.isSafeInteger(subtotal) || cents(payload.subtotal) !== subtotal
    || payload.canCreateDraft !== (items.length > 0) || payload.canConfirmOrder !== (items.length > 0)
    || payload.needsManualReview !== manual) throw invalidOrderResponse();
  return Object.freeze({ items: Object.freeze(items), issues: Object.freeze(issues), subtotal: payload.subtotal as number,
    totalItems: total, currency, canCreateDraft: payload.canCreateDraft, canConfirmOrder: payload.canConfirmOrder,
    needsManualReview: payload.needsManualReview, signature: payload.signature });
}

export function mapOrderQuote(payload: unknown, expected: readonly OrderItemInput[]): OrderQuote {
  return mapQuote(payload, expected, true);
}

export function mapOrderConfirmation(payload: unknown, expected: readonly OrderItemInput[]): OrderConfirmation {
  if (!record(payload) || !isOrderId(payload.orderId)
    || typeof payload.reference !== 'string' || !/^PED-\d{8}-[A-Z0-9]{1,6}$/.test(payload.reference)
    || !['pending_review', 'confirmed', 'cancelled', 'completed'].includes(payload.status as string)) throw invalidOrderResponse();
  const quote = mapQuote(payload, expected, payload.status === 'pending_review');
  if (!quote.items.length) throw invalidOrderResponse();
  let createdAt: string | null = null;
  if (payload.createdAt !== undefined && payload.createdAt !== null) {
    if (typeof payload.createdAt !== 'string' || payload.createdAt.length > 40
      || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(payload.createdAt)
      || !isISO8601(payload.createdAt, { strict: true, strictSeparator: true }) || !Number.isFinite(Date.parse(payload.createdAt))) throw invalidOrderResponse();
    createdAt = payload.createdAt;
  }
  return Object.freeze({ ...quote, orderId: payload.orderId.toLowerCase(), reference: payload.reference,
    status: payload.status as OrderStatus, createdAt });
}
