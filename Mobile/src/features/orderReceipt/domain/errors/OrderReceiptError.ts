export type OrderReceiptErrorKind = 'invalid-request' | 'invalid-response' | 'unauthorized'
  | 'forbidden' | 'not-found' | 'conflict' | 'network' | 'timeout' | 'rate-limit'
  | 'server' | 'cancelled' | 'configuration' | 'unknown';

export class OrderReceiptError extends Error {
  constructor(message: string, readonly kind: OrderReceiptErrorKind) {
    super(message);
    this.name = 'OrderReceiptError';
  }
}
