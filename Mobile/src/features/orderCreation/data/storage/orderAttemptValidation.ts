import isEmail from 'validator/lib/isEmail';
import { OrderCreationError } from '../../domain/errors/OrderCreationError';
import type { OrderConfirmInput, OrderItemInput, OrderReceipt, OrderStatus } from '../../domain/models/OrderCreation';
import type { OrderAttempt } from '../../domain/storage/OrderAttemptStore';

export function orderAttemptStorageError(): OrderCreationError {
  return new OrderCreationError('No pudimos recuperar de forma segura el estado de tu pedido. Intenta de nuevo antes de confirmar.', 'storage');
}

function fail(): never { throw orderAttemptStorageError(); }
function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return fail();
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) return fail();
  return value as Record<string, unknown>;
}
function text(value: unknown, min: number, max: number): string {
  if (typeof value !== 'string') return fail();
  const normalized = value.trim();
  const length = Array.from(normalized).length;
  if (length < min || length > max) return fail();
  return normalized;
}
export function orderAttemptAccountId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{24}$/i.test(value)) return fail();
  return value.toLowerCase();
}
function integer(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) return fail();
  return value;
}
function itemsSnapshot(value: unknown): readonly OrderItemInput[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) return fail();
  const ids = new Set<string>();
  return Object.freeze(value.map((value): OrderItemInput => {
    const item = record(value);
    const productId = orderAttemptAccountId(item.productId);
    if (ids.has(productId)) return fail();
    ids.add(productId);
    return Object.freeze({ productId, quantity: integer(item.quantity, 1, 25) });
  }));
}
function inputSnapshot(value: unknown): OrderConfirmInput {
  const source = record(value);
  const items = itemsSnapshot(source.items);
  const customerName = text(source.customerName, 2, 120);
  const customerEmail = text(source.customerEmail, 5, 120).toLowerCase();
  const customerPhone = text(source.customerPhone, 10, 15);
  if (!isEmail(customerEmail) || !/^\d{10,15}$/.test(customerPhone)) return fail();
  if (typeof source.previewSignature !== 'string' || !/^[a-f0-9]{64}$/i.test(source.previewSignature)) return fail();
  return Object.freeze({
    items,
    shippingAddressId: orderAttemptAccountId(source.shippingAddressId),
    previewSignature: source.previewSignature.toLowerCase(),
    customerName, customerEmail, customerPhone,
    notes: text(source.notes, 0, 600),
  });
}
function receiptSnapshot(value: unknown): OrderReceipt {
  const source = record(value);
  const reference = text(source.reference, 2, 100);
  if (!/^[a-z0-9][a-z0-9_-]+$/i.test(reference)) return fail();
  if (!['pending_review', 'confirmed', 'cancelled', 'completed'].includes(source.status as string)) return fail();
  if (source.createdAt !== null && (typeof source.createdAt !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(source.createdAt)
    || !Number.isFinite(Date.parse(source.createdAt))
    || new Date(source.createdAt).toISOString().slice(0, 19) !== source.createdAt.slice(0, 19))) return fail();
  if (typeof source.subtotal !== 'number' || !Number.isFinite(source.subtotal) || source.subtotal < 0) return fail();
  if (typeof source.currency !== 'string' || !/^[A-Z]{3}$/.test(source.currency)) return fail();
  return Object.freeze({
    orderId: orderAttemptAccountId(source.orderId), reference,
    status: source.status as OrderStatus, createdAt: source.createdAt as string | null,
    subtotal: source.subtotal, totalItems: integer(source.totalItems, 1, 500), currency: source.currency,
  });
}

/** Rebuild only approved fields, rather than persisting caller objects or extra secrets. */
export function snapshotOrderAttempt(accountId: string, value: unknown): OrderAttempt {
  try {
    const normalizedAccount = orderAttemptAccountId(accountId);
    const source = record(value);
    if (source.version !== 1 || orderAttemptAccountId(source.accountId) !== normalizedAccount) return fail();
    if (typeof source.key !== 'string' || !/^[a-zA-Z0-9_-]{16,100}$/.test(source.key)) return fail();
    if (source.phase !== 'pending' && source.phase !== 'confirmed') return fail();
    if ((source.phase === 'pending' && source.receipt !== null)
      || (source.phase === 'confirmed' && source.receipt === null)) return fail();
    if ((source.phase === 'pending' && source.normalizedItems !== null)
      || (source.phase === 'confirmed' && source.normalizedItems === null)) return fail();
    const input = inputSnapshot(source.input);
    const receipt = source.phase === 'confirmed' ? receiptSnapshot(source.receipt) : null;
    const normalizedItems = source.phase === 'confirmed' ? itemsSnapshot(source.normalizedItems) : null;
    if (normalizedItems) {
      for (const item of normalizedItems) {
        const requested = input.items.find((candidate) => candidate.productId === item.productId);
        if (!requested || item.quantity > requested.quantity) return fail();
      }
      if (receipt?.totalItems !== normalizedItems.reduce((sum, item) => sum + item.quantity, 0)) return fail();
    }
    return Object.freeze({
      version: 1, accountId: normalizedAccount, key: source.key,
      input, phase: source.phase, receipt, normalizedItems,
    });
  } catch { throw orderAttemptStorageError(); }
}
