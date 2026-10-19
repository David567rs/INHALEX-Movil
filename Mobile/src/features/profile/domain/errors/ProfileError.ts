import type { ProfileFieldErrors } from '../models/Profile';

export type ProfileErrorKind = 'validation' | 'unauthorized' | 'network' | 'timeout'
  | 'cancelled' | 'configuration' | 'server' | 'invalid-response' | 'unknown';

export class ProfileError extends Error {
  readonly kind: ProfileErrorKind;
  readonly fieldErrors?: ProfileFieldErrors;

  constructor(message: string, kind: ProfileErrorKind, fieldErrors?: ProfileFieldErrors) {
    super(message);
    this.name = 'ProfileError';
    this.kind = kind;
    this.fieldErrors = fieldErrors ? Object.freeze({ ...fieldErrors }) : undefined;
  }
}
