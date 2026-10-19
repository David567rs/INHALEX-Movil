export const CART_MIN_QUANTITY = 1;
export const CART_MAX_QUANTITY = 25;

export function isCartProductId(value: unknown): value is string {
  return typeof value === 'string' && value.length === 24 && /^[a-f\d]{24}$/i.test(value);
}

export function isCartQuantity(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value)
    && value >= CART_MIN_QUANTITY && value <= CART_MAX_QUANTITY;
}
