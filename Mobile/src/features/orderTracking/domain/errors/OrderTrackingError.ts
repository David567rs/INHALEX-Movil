export type OrderTrackingErrorKind = 'invalid-request' | 'invalid-response' | 'unauthorized'
  | 'forbidden' | 'not-found' | 'network' | 'timeout' | 'rate-limit' | 'server'
  | 'cancelled' | 'configuration' | 'unknown';

export class OrderTrackingError extends Error {
  readonly kind: OrderTrackingErrorKind;

  constructor(message: string, kind: OrderTrackingErrorKind) {
    super(message);
    this.name = 'OrderTrackingError';
    this.kind = kind;
  }
}
