/** Route identity only; never accepts paths, query strings, credentials or encoded separators. */
export function isProductDetailId(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= 160
    && /^[a-zA-Z0-9-]+$/.test(value) && /[a-zA-Z0-9]/.test(value);
}
