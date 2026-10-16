import { LoginError } from '../../domain/errors/LoginError';
import type { LoginSession } from '../../domain/models/Login';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function mapLoginSession(payload: unknown): LoginSession {
  const user = isRecord(payload) && isRecord(payload.user) ? payload.user : null;
  const token = isRecord(payload) ? payload.accessToken : undefined;
  // Validate compact JWT shape and header-safe characters; signature verification stays on the server.
  const hasToken = typeof token === 'string' && !/\s/.test(token)
    && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
  if (!hasToken || !user || !['_id', 'firstName', 'lastName', 'email', 'phone'].every((field) =>
    typeof user[field] === 'string' && user[field].trim().length > 0)) {
    throw new LoginError('No pudimos confirmar el inicio de sesión. Inténtalo de nuevo más tarde.', 'invalid-response');
  }

  return {
    accessToken: token,
    user: {
      id: user._id as string,
      firstName: user.firstName as string,
      lastName: user.lastName as string,
      email: user.email as string,
      phone: user.phone as string,
    },
  };
}
