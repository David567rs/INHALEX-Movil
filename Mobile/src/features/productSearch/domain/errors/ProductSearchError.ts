export type ProductSearchErrorKind = 'validation' | 'network' | 'timeout' | 'cancelled'
  | 'server' | 'invalid-response' | 'configuration' | 'unknown';

export class ProductSearchError extends Error {
  readonly kind: ProductSearchErrorKind;

  constructor(message: string, kind: ProductSearchErrorKind) {
    super(message);
    this.name = 'ProductSearchError';
    this.kind = kind;
  }
}
