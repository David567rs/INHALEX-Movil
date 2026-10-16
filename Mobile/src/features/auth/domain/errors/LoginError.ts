import type { LoginErrors } from '../validation/loginValidation';

export type LoginErrorKind = 'validation' | 'credentials' | 'too-many-attempts'
  | 'network' | 'timeout' | 'cancelled' | 'server' | 'invalid-response'
  | 'configuration' | 'storage' | 'unknown';

export class LoginError extends Error {
  readonly kind: LoginErrorKind;
  readonly fieldErrors?: LoginErrors;

  constructor(message: string, kind: LoginErrorKind, fieldErrors?: LoginErrors) {
    super(message);
    this.name = 'LoginError';
    this.kind = kind;
    this.fieldErrors = fieldErrors;
  }
}
