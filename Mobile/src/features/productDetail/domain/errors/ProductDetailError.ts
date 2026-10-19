export type ProductDetailErrorKind = 'configuration' | 'network' | 'timeout' | 'not-found'
  | 'invalid-response' | 'server' | 'cancelled';

export class ProductDetailError extends Error {
  readonly kind: ProductDetailErrorKind;

  constructor(message: string, kind: ProductDetailErrorKind) {
    super(message);
    this.name = 'ProductDetailError';
    this.kind = kind;
  }
}
