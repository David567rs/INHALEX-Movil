export type NoticesErrorKind = 'invalid-request' | 'invalid-response' | 'unauthorized'
  | 'forbidden' | 'not-found' | 'network' | 'timeout' | 'rate-limit' | 'server'
  | 'cancelled' | 'configuration' | 'unknown';

export class NoticesError extends Error {
  readonly kind: NoticesErrorKind;

  constructor(message: string, kind: NoticesErrorKind) {
    super(message);
    this.name = 'NoticesError';
    this.kind = kind;
  }
}
