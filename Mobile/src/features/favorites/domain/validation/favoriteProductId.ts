export function isFavoriteProductId(value: unknown): value is string {
  return typeof value === 'string' && value.length === 24 && /^[a-f\d]{24}$/i.test(value);
}
