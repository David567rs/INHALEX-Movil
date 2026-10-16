import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient } from '../../../../core/network/HttpClient';
import { LoginError } from '../../domain/errors/LoginError';
import type { LoginInput, LoginSession } from '../../domain/models/Login';
import type { LoginOptions, LoginRepository } from '../../domain/repositories/LoginRepository';
import { mapLoginSession } from '../mappers/mapLoginSession';

function mapLoginError(error: unknown): LoginError {
  if (error instanceof LoginError) return error;
  if (!(error instanceof ApiError)) {
    return new LoginError('No pudimos iniciar sesión. Inténtalo de nuevo más tarde.', 'unknown');
  }

  if (error.kind === 'cancelled') {
    return new LoginError('Se canceló el inicio de sesión.', 'cancelled');
  }
  if (error.kind === 'timeout') {
    return new LoginError('El inicio de sesión tardó demasiado. Revisa tu conexión e inténtalo de nuevo.', 'timeout');
  }
  if (error.kind === 'network') {
    return new LoginError('No pudimos conectar con INHALEX. Revisa tu conexión e inténtalo de nuevo.', 'network');
  }
  if (error.kind === 'invalid-response') {
    return new LoginError('No pudimos confirmar el inicio de sesión. Inténtalo de nuevo más tarde.', 'invalid-response');
  }
  if (error.kind === 'invalid-request') {
    return new LoginError('El inicio de sesión no está disponible en este momento. Inténtalo más tarde.', 'configuration');
  }
  if (error.status === 401) {
    return new LoginError('El correo electrónico o la contraseña son incorrectos.', 'credentials');
  }
  if (error.status === 429) {
    return new LoginError('Has realizado demasiados intentos. Inténtalo de nuevo más tarde.', 'too-many-attempts');
  }
  if (error.status === 400 || error.status === 422) {
    return new LoginError('No pudimos aceptar los datos. Revisa el formulario e inténtalo de nuevo.', 'validation');
  }
  if (error.status !== null && error.status >= 500) {
    return new LoginError('No pudimos iniciar sesión. El servicio no está disponible por el momento.', 'server');
  }
  return new LoginError('No pudimos iniciar sesión. Inténtalo de nuevo más tarde.', 'unknown');
}

export class ApiLoginRepository implements LoginRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async login(input: LoginInput, options?: LoginOptions): Promise<LoginSession> {
    try {
      const payload = await this.httpClient.request('/auth/login', {
        method: 'POST',
        authenticated: false,
        signal: options?.signal,
        body: { email: input.email, password: input.password },
      });
      return mapLoginSession(payload);
    } catch (error) {
      throw mapLoginError(error);
    }
  }
}
