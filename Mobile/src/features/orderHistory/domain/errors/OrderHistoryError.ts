export type OrderHistoryErrorKind = 'invalid-request' | 'invalid-response' | 'unauthorized'
  | 'forbidden' | 'not-found' | 'network' | 'timeout' | 'rate-limit' | 'server'
  | 'cancelled' | 'configuration' | 'unknown';

export class OrderHistoryError extends Error {
  readonly kind: OrderHistoryErrorKind;

  constructor(message: string, kind: OrderHistoryErrorKind) {
    super(message);
    this.name = 'OrderHistoryError';
    this.kind = kind;
  }
}
