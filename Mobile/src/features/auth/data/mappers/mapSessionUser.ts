import { SessionError } from '../../domain/errors/SessionError';
import type { LoginUser } from '../../domain/models/Login';
import { mapPublicAccount } from '../../../../shared/data/mappers/mapPublicAccount';

/** GET /auth/me returns a flat profile, without a token or a nested user object. */
export function mapSessionUser(payload: unknown): LoginUser {
  const user = mapPublicAccount(payload);
  if (!user) {
    throw new SessionError('No pudimos comprobar tu sesión. Inténtalo de nuevo más tarde.', 'invalid-response');
  }

  return user;
}
