export type CartErrorKind = 'unauthorized' | 'network' | 'timeout' | 'cancelled'
  | 'invalid-response' | 'invalid-request' | 'not-found' | 'configuration' | 'server';

export class CartError extends Error {
  readonly kind: CartErrorKind;

  constructor(message: string, kind: CartErrorKind) {
    super(message);
    this.name = 'CartError';
    this.kind = kind;
  }
}
