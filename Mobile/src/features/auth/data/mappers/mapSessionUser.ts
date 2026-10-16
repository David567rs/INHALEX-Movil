import { SessionError } from '../../domain/errors/SessionError';
import type { LoginUser } from '../../domain/models/Login';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** GET /auth/me returns a flat profile, without a token or a nested user object. */
export function mapSessionUser(payload: unknown): LoginUser {
  if (!isRecord(payload) || !['_id', 'firstName', 'lastName', 'email', 'phone'].every((field) =>
    typeof payload[field] === 'string' && payload[field].trim().length > 0)) {
    throw new SessionError('No pudimos comprobar tu sesión. Inténtalo de nuevo más tarde.', 'invalid-response');
  }

  return {
    id: payload._id as string,
    firstName: payload.firstName as string,
    lastName: payload.lastName as string,
    email: payload.email as string,
    phone: payload.phone as string,
  };
}
