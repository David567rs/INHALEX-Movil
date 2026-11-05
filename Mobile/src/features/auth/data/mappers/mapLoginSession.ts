import { LoginError } from '../../domain/errors/LoginError';
import type { LoginSession } from '../../domain/models/Login';
import { mapPublicAccount } from '../../../../shared/data/mappers/mapPublicAccount';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function mapLoginSession(payload: unknown): LoginSession {
  const user = mapPublicAccount(isRecord(payload) ? payload.user : null);
  const token = isRecord(payload) ? payload.accessToken : undefined;
  // Validate compact JWT shape and header-safe characters; signature verification stays on the server.
  const hasToken = typeof token === 'string' && !/\s/.test(token)
    && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
  if (!hasToken || !user) {
    throw new LoginError('No pudimos confirmar el inicio de sesión. Inténtalo de nuevo más tarde.', 'invalid-response');
  }

  return {
    accessToken: token,
    user,
  };
}
