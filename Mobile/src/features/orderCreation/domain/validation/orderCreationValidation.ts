import isEmail from 'validator/lib/isEmail';
import { OrderCreationError } from '../errors/OrderCreationError';
import type { OrderContactDraft, OrderContactFieldErrors, OrderConfirmInput, OrderItemInput } from '../models/OrderCreation';

export function isOrderId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value);
}

export function isOrderIdempotencyKey(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{16,100}$/.test(value);
}

export function isOrderPreviewSignature(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

export function validateOrderContactDraft(draft: OrderContactDraft): {
  values: OrderContactDraft; errors: OrderContactFieldErrors; valid: boolean;
} {
  const source: Partial<OrderContactDraft> = draft !== null && typeof draft === 'object' && !Array.isArray(draft) ? draft : {};
  const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
  const values: OrderContactDraft = Object.freeze({
    customerName: text(source.customerName), customerEmail: text(source.customerEmail).toLowerCase(),
    customerPhone: text(source.customerPhone), notes: text(source.notes),
  });
  const errors: OrderContactFieldErrors = {};
  const hasControl = (value: string, allowLines: boolean) => [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code === 127 || code < 32 && !(allowLines && (code === 9 || code === 10 || code === 13));
  });
  if (values.customerName.length < 2 || values.customerName.length > 120 || hasControl(values.customerName, false)) {
    errors.customerName = 'Ingresa un nombre de contacto de entre 2 y 120 caracteres.';
  }
  if (values.customerEmail.length < 5 || values.customerEmail.length > 120 || !isEmail(values.customerEmail)) {
    errors.customerEmail = 'Ingresa un correo electrónico válido de hasta 120 caracteres.';
  }
  if (!/^\d{10,15}$/.test(values.customerPhone)) errors.customerPhone = 'Ingresa entre 10 y 15 dígitos, sin espacios ni signos.';
  if (values.notes.length > 600 || hasControl(values.notes, true)
    || source.notes !== undefined && typeof source.notes !== 'string') {
    errors.notes = 'Escribe notas de hasta 600 caracteres.';
  }
  return { values, errors, valid: Object.keys(errors).length === 0 };
}

export function normalizeOrderItems(items: readonly OrderItemInput[]): readonly OrderItemInput[] {
  if (!Array.isArray(items) || items.length < 1 || items.length > 20) {
    throw new OrderCreationError('La bolsa debe contener entre 1 y 20 productos distintos.', 'invalid-request');
  }
  const seen = new Set<string>();
  return Object.freeze(items.map((entry) => {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry) || !isOrderId(entry.productId)
      || !Number.isInteger(entry.quantity) || entry.quantity < 1 || entry.quantity > 25) {
      throw new OrderCreationError('Revisa los productos y las cantidades de la bolsa antes de continuar.', 'invalid-request');
    }
    const productId = entry.productId.toLowerCase();
    if (seen.has(productId)) throw new OrderCreationError('Actualiza la bolsa antes de continuar con el pedido.', 'invalid-request');
    seen.add(productId);
    return Object.freeze({ productId, quantity: entry.quantity });
  }));
}

export function normalizeOrderConfirmInput(input: OrderConfirmInput): OrderConfirmInput {
  const validation = validateOrderContactDraft(input);
  if (!validation.valid) {
    throw new OrderCreationError('Revisa los datos de contacto antes de confirmar el pedido.', 'invalid-request', validation.errors);
  }
  if (!input || !isOrderId(input.shippingAddressId)) {
    throw new OrderCreationError('Selecciona una dirección de envío registrada.', 'invalid-request');
  }
  if (!isOrderPreviewSignature(input.previewSignature)) {
    throw new OrderCreationError('Actualiza el resumen antes de confirmar el pedido.', 'invalid-request');
  }
  return Object.freeze({ ...validation.values, items: normalizeOrderItems(input.items),
    shippingAddressId: input.shippingAddressId.toLowerCase(), previewSignature: input.previewSignature });
}
