import { SessionError } from '../errors/SessionError';
import type { LoginUser } from '../models/Login';
import type { LoginOptions } from '../repositories/LoginRepository';
import type { SessionRepository } from '../repositories/SessionRepository';

export type VerifySessionAction = (token: string, options?: LoginOptions) => Promise<LoginUser>;

/** Only validates compact JWT shape and header-safe characters, never claims or signature. */
export function isSessionToken(token: unknown): token is string {
  return typeof token === 'string' && !/\s/.test(token)
    && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}

function cancelled(): SessionError {
  return new SessionError('Se canceló la comprobación de tu sesión.', 'cancelled');
}

export function createVerifySession(repository: SessionRepository): VerifySessionAction {
  return async (token, options) => {
    if (options?.signal?.aborted) throw cancelled();
    if (!isSessionToken(token)) {
      throw new SessionError('Tu sesión ya no es válida. Inicia sesión de nuevo.', 'unauthorized');
    }

    try {
      const user = await repository.verify(token, options);
      if (options?.signal?.aborted) throw cancelled();
      return user;
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      if (error instanceof SessionError) throw error;
      throw new SessionError('No pudimos comprobar tu sesión. Inténtalo de nuevo más tarde.', 'unknown');
    }
  };
}
