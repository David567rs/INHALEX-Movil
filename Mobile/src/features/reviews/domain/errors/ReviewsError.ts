export type ReviewsErrorKind = 'invalid-request' | 'invalid-response' | 'unauthorized'
  | 'forbidden' | 'not-found' | 'conflict' | 'network' | 'timeout' | 'rate-limit'
  | 'server' | 'cancelled' | 'configuration' | 'unknown';

export class ReviewsError extends Error {
  readonly kind: ReviewsErrorKind;

  constructor(message: string, kind: ReviewsErrorKind) {
    super(message);
    this.name = 'ReviewsError';
    this.kind = kind;
  }
}
