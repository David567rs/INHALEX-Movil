import type { OrderContactFieldErrors } from '../models/OrderCreation';

export type OrderCreationErrorKind = 'network' | 'timeout' | 'unauthorized' | 'invalid-request'
  | 'invalid-response' | 'conflict' | 'server' | 'configuration' | 'cancelled' | 'storage';

export class OrderCreationError extends Error {
  readonly kind: OrderCreationErrorKind;
  readonly fieldErrors?: OrderContactFieldErrors;

  constructor(message: string, kind: OrderCreationErrorKind, fieldErrors?: OrderContactFieldErrors) {
    super(message);
    this.name = 'OrderCreationError';
    this.kind = kind;
    this.fieldErrors = fieldErrors ? Object.freeze({ ...fieldErrors }) : undefined;
  }
}
