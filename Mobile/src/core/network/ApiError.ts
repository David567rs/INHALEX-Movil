export type ApiErrorKind = 'http' | 'network' | 'timeout' | 'cancelled'
  | 'invalid-response' | 'invalid-request';

export class ApiError extends Error {
  readonly status: number | null;
  readonly kind: ApiErrorKind;
  readonly cause?: unknown;

  constructor(message: string, kind: ApiErrorKind, status: number | null = null, cause?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind;
    this.status = status;
    this.cause = cause;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }
}
