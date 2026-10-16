import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient } from '../../../../core/network/HttpClient';
import { SessionError } from '../../domain/errors/SessionError';
import type { LoginUser } from '../../domain/models/Login';
import type { LoginOptions } from '../../domain/repositories/LoginRepository';
import type { SessionRepository } from '../../domain/repositories/SessionRepository';
import { mapSessionUser } from '../mappers/mapSessionUser';

function mapSessionError(error: unknown): SessionError {
  if (error instanceof SessionError) return error;
  if (!(error instanceof ApiError)) {
    return new SessionError('No pudimos comprobar tu sesión. Inténtalo de nuevo más tarde.', 'unknown');
  }
  if (error.kind === 'cancelled') {
    return new SessionError('Se canceló la comprobación de tu sesión.', 'cancelled');
  }
  if (error.kind === 'timeout') {
    return new SessionError('La comprobación de tu sesión tardó demasiado. Revisa tu conexión e inténtalo de nuevo.', 'timeout');
  }
  if (error.kind === 'network') {
    return new SessionError('No pudimos conectar con INHALEX. Revisa tu conexión para comprobar tu sesión.', 'network');
  }
  if (error.kind === 'invalid-response') {
    return new SessionError('No pudimos comprobar tu sesión. Inténtalo de nuevo más tarde.', 'invalid-response');
  }
  if (error.kind === 'invalid-request') {
    return new SessionError('La comprobación de sesión no está disponible en este momento. Inténtalo más tarde.', 'configuration');
  }
  if (error.status === 401) {
    return new SessionError('Tu sesión ya no es válida. Inicia sesión de nuevo.', 'unauthorized');
  }
  if (error.status === 403 || error.status === 429 || (error.status !== null && error.status >= 500)) {
    return new SessionError('No pudimos comprobar tu sesión. El servicio no está disponible por el momento.', 'server');
  }
  return new SessionError('No pudimos comprobar tu sesión. Inténtalo de nuevo más tarde.', 'unknown');
}

export class ApiSessionRepository implements SessionRepository {
  private readonly createClient: (token: string) => HttpClient;

  constructor(createClient: (token: string) => HttpClient) {
    this.createClient = createClient;
  }

  async verify(token: string, options?: LoginOptions): Promise<LoginUser> {
    try {
      const payload = await this.createClient(token).request('/auth/me', {
        method: 'GET',
        authenticated: true,
        signal: options?.signal,
      });
      return mapSessionUser(payload);
    } catch (error) {
      throw mapSessionError(error);
    }
  }
}
