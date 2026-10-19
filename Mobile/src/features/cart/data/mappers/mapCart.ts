import isISO4217 from 'validator/lib/isISO4217';
import { mapCatalogProduct } from '../../../catalog/data/mappers/mapCatalogPage';
import { CartError } from '../../domain/errors/CartError';
import type { Cart, CartItem } from '../../domain/models/Cart';
import { isCartProductId, isCartQuantity } from '../../domain/validation/cartInput';

function invalidResponse(): CartError {
  return new CartError('No pudimos confirmar tu bolsa. Actualiza la lista e inténtalo de nuevo.', 'invalid-response');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/** Allow only floating-point representation drift, never a different monetary amount. */
function sameAmount(left: number, right: number): boolean {
  return Number.isFinite(left) && Number.isFinite(right)
    && Math.abs(left - right) <= Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right)) * 8;
}

export function mapCart(payload: unknown): Cart {
  if (!isRecord(payload) || !Array.isArray(payload.items)
    || !Number.isSafeInteger(payload.totalItems) || (payload.totalItems as number) < 0
    || !isAmount(payload.subtotal) || typeof payload.currency !== 'string'
    || !/^[A-Z]{3}$/.test(payload.currency) || !isISO4217(payload.currency)) throw invalidResponse();

  const seen = new Set<string>();
  const currency = payload.currency;
  const items = payload.items.map((entry): CartItem => {
    if (!isRecord(entry) || !isCartProductId(entry.productId) || !isCartQuantity(entry.quantity)
      || !isAmount(entry.subtotal) || !isRecord(entry.product)
      || !isCartProductId(entry.product._id)) throw invalidResponse();
    const id = entry.productId.toLowerCase();
    if (seen.has(id) || entry.product._id.toLowerCase() !== id) throw invalidResponse();
    seen.add(id);

    let product;
    try { product = mapCatalogProduct(entry.product); }
    catch { throw invalidResponse(); }
    if (product.currency !== currency) throw invalidResponse();

    const basePrice = entry.product.price as number;
    const promoPrice = entry.product.promoPrice;
    // CartService applies an active lower promo price without checking promoEndsAt.
    // Validate against that contract, then display the unit price confirmed by the line.
    const serverUnitPrice = entry.product.promoActive === true && isAmount(promoPrice)
      && promoPrice > 0 && promoPrice < basePrice ? promoPrice : basePrice;
    if (!sameAmount(entry.subtotal, serverUnitPrice * entry.quantity)) throw invalidResponse();
    const unitPrice = entry.subtotal / entry.quantity;
    if (!isAmount(unitPrice)) throw invalidResponse();

    return {
      productId: id,
      quantity: entry.quantity,
      subtotal: entry.subtotal,
      product: { ...product, id, price: unitPrice, originalPrice: serverUnitPrice < basePrice ? basePrice : null },
    };
  });

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  if (!Number.isSafeInteger(totalItems) || payload.totalItems !== totalItems
    || !sameAmount(payload.subtotal, subtotal)) throw invalidResponse();

  return { items, totalItems, subtotal: payload.subtotal, currency };
}
