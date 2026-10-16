export type SessionErrorKind = 'unauthorized' | 'network' | 'timeout' | 'cancelled'
  | 'configuration' | 'invalid-response' | 'server' | 'storage' | 'unknown';

export class SessionError extends Error {
  readonly kind: SessionErrorKind;

  constructor(message: string, kind: SessionErrorKind) {
    super(message);
    this.name = 'SessionError';
    this.kind = kind;
  }
}
