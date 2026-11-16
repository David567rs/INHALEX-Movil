import type { RegistrationErrors } from '../validation/registrationValidation';

export type RegistrationErrorKind = 'validation' | 'duplicate-email' | 'invalid-code' | 'rate-limit' | 'network'
  | 'timeout' | 'cancelled' | 'server' | 'invalid-response' | 'unknown' | 'configuration' | 'connection-unavailable';

export class RegistrationError extends Error {
  readonly kind: RegistrationErrorKind;
  readonly fieldErrors?: RegistrationErrors;

  constructor(message: string, kind: RegistrationErrorKind, fieldErrors?: RegistrationErrors) {
    super(message);
    this.name = 'RegistrationError';
    this.kind = kind;
    this.fieldErrors = fieldErrors;
  }
}
