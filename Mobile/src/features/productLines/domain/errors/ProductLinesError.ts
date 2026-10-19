export type ProductLinesErrorKind = 'network' | 'timeout' | 'cancelled' | 'server'
  | 'invalid-response' | 'configuration' | 'unknown';

export class ProductLinesError extends Error {
  readonly kind: ProductLinesErrorKind;

  constructor(message: string, kind: ProductLinesErrorKind) {
    super(message);
    this.name = 'ProductLinesError';
    this.kind = kind;
  }
}
