import type { ShippingAddressFieldErrors } from '../models/ShippingAddress';

export type ShippingAddressErrorKind = 'validation' | 'unauthorized' | 'network' | 'timeout'
  | 'server' | 'invalid-response' | 'configuration' | 'not-found' | 'limit' | 'cancelled' | 'unknown';

export class ShippingAddressError extends Error {
  readonly kind: ShippingAddressErrorKind;
  readonly fieldErrors?: ShippingAddressFieldErrors;

  constructor(message: string, kind: ShippingAddressErrorKind, fieldErrors?: ShippingAddressFieldErrors) {
    super(message);
    this.name = 'ShippingAddressError';
    this.kind = kind;
    this.fieldErrors = fieldErrors ? Object.freeze({ ...fieldErrors }) : undefined;
  }
}
