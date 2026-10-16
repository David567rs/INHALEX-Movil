import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient } from '../../../../core/network/HttpClient';
import { RegistrationError } from '../../domain/errors/RegistrationError';
import type { RegisteredUser, RegistrationInput } from '../../domain/models/Registration';
import type { RegistrationOptions, RegistrationRepository } from '../../domain/repositories/RegistrationRepository';
import { mapRegisteredUser } from '../mappers/mapRegisteredUser';

function mapRegistrationError(error: unknown): RegistrationError {
  if (error instanceof RegistrationError) return error;
  if (!(error instanceof ApiError)) {
    return new RegistrationError('No pudimos confirmar el registro. Intenta de nuevo más tarde.', 'unknown');
  }

  if (error.kind === 'cancelled') {
    return new RegistrationError('Se canceló la solicitud. No pudimos confirmar si la cuenta se creó.', 'cancelled');
  }
  if (error.kind === 'timeout') {
    return new RegistrationError('No pudimos confirmar el registro porque el servidor tardó en responder. Comprueba si la cuenta ya existe antes de intentarlo de nuevo.', 'timeout');
  }
  if (error.kind === 'network') {
    return new RegistrationError('No pudimos confirmar el registro. Revisa tu conexión y comprueba si la cuenta ya existe antes de intentarlo de nuevo.', 'network');
  }
  if (error.kind === 'invalid-response') {
    return new RegistrationError('No pudimos confirmar el registro. Inténtalo de nuevo más tarde.', 'invalid-response');
  }
  if (error.kind === 'invalid-request') {
    return new RegistrationError('El registro no está disponible en este momento. Inténtalo más tarde.', 'configuration');
  }
  if (error.status === 409) {
    const message = 'Este correo electrónico ya está registrado.';
    return new RegistrationError(message, 'duplicate-email', { email: message });
  }
  if (error.status === 400 || error.status === 422) {
    return new RegistrationError('El servidor no pudo aceptar los datos. Revisa el formulario e inténtalo de nuevo.', 'validation');
  }
  if (error.status !== null && error.status >= 500) {
    return new RegistrationError('No pudimos confirmar el registro. El servicio no está disponible por el momento.', 'server');
  }
  return new RegistrationError('No pudimos confirmar el registro. Intenta de nuevo más tarde.', 'unknown');
}

export class ApiRegistrationRepository implements RegistrationRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async register(input: RegistrationInput, options?: RegistrationOptions): Promise<RegisteredUser> {
    try {
      const payload = await this.httpClient.request('/auth/register', {
        method: 'POST',
        authenticated: false,
        signal: options?.signal,
        body: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          password: input.password,
        },
      });
      return mapRegisteredUser(payload);
    } catch (error) {
      throw mapRegistrationError(error);
    }
  }
}
