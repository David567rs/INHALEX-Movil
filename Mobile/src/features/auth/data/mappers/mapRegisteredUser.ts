import { RegistrationError } from '../../domain/errors/RegistrationError';
import type { RegisteredUser } from '../../domain/models/Registration';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function mapRegisteredUser(payload: unknown): RegisteredUser {
  const user = isRecord(payload) && isRecord(payload.user) ? payload.user : null;
  if (!user || !['_id', 'firstName', 'lastName', 'email', 'phone'].every((field) =>
    typeof user[field] === 'string' && user[field].trim().length > 0)) {
    throw new RegistrationError('No pudimos confirmar el registro. Inténtalo de nuevo más tarde.', 'invalid-response');
  }

  // The registration response also contains an access token. Do not consume or retain it.
  return {
    id: user._id as string,
    firstName: user.firstName as string,
    lastName: user.lastName as string,
    email: user.email as string,
    phone: user.phone as string,
  };
}
