import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient } from '../../../../core/network/HttpClient';
import { RegistrationError } from '../../domain/errors/RegistrationError';
import type {
  RegisteredUser, RegistrationChallenge, RegistrationInput, RegistrationVerification,
} from '../../domain/models/Registration';
import type { RegistrationOptions, RegistrationRepository } from '../../domain/repositories/RegistrationRepository';
import { isRegistrationChallengeId } from '../../domain/validation/registrationValidation';
import { mapRegisteredUser } from '../mappers/mapRegisteredUser';

type RegistrationOperation = 'request-code' | 'register';

const INVALID_CODE_RESPONSE = 'El código es incorrecto, venció o ya se usó. Solicita otro si lo necesitas.';
// Gmail allows 10 seconds for token renewal and another 10 for delivery.
const CODE_REQUEST_TIMEOUT_MS = 30_000;

function mapRegistrationError(error: unknown, operation: RegistrationOperation): RegistrationError {
  const requestingCode = operation === 'request-code';
  const unknownMessage = requestingCode
    ? 'No pudimos solicitar el código. Inténtalo más tarde.'
    : 'No pudimos confirmar el registro. Intenta de nuevo más tarde.';
  if (error instanceof RegistrationError) return error;
  if (!(error instanceof ApiError)) {
    return new RegistrationError(unknownMessage, 'unknown');
  }

  if (error.kind === 'cancelled') {
    return new RegistrationError(requestingCode
      ? 'Se canceló la solicitud del código.'
      : 'Se canceló la solicitud. No pudimos confirmar si la cuenta se creó.', 'cancelled');
  }
  if (error.kind === 'timeout') {
    return new RegistrationError(requestingCode
      ? 'El servidor tardó en responder. Espera un momento antes de pedir otro código.'
      : 'No pudimos confirmar el registro porque el servidor tardó en responder. Comprueba si la cuenta ya existe antes de intentarlo de nuevo.', 'timeout');
  }
  if (error.kind === 'network') {
    return new RegistrationError(requestingCode
      ? 'No pudimos solicitar el código. Revisa tu conexión e inténtalo de nuevo.'
      : 'No pudimos confirmar el registro. Revisa tu conexión y comprueba si la cuenta ya existe antes de intentarlo de nuevo.', 'network');
  }
  if (error.kind === 'invalid-response') {
    return new RegistrationError(unknownMessage, 'invalid-response');
  }
  if (error.kind === 'invalid-request') {
    return new RegistrationError(requestingCode
      ? 'El envío de códigos no está disponible en este momento. Inténtalo más tarde.'
      : 'El registro no está disponible en este momento. Inténtalo más tarde.', 'configuration');
  }
  if (!requestingCode && error.status === 409) {
    const message = 'Este correo electrónico ya está registrado.';
    return new RegistrationError(message, 'duplicate-email', { email: message });
  }
  if (error.status === 429) {
    return new RegistrationError(requestingCode
      ? 'Has solicitado códigos muy seguido. Espera antes de pedir otro.'
      : 'Hubo demasiados intentos. Espera antes de volver a intentarlo.', 'rate-limit');
  }
  if (error.status === 400 || error.status === 422) {
    if (requestingCode) {
      const message = 'El servidor no pudo aceptar el correo electrónico. Revísalo e inténtalo de nuevo.';
      return new RegistrationError(message, 'validation', { email: message });
    }
    // The endpoint uses 400 for both DTO validation and a rejected code.
    if (error.status === 400 && error.message === INVALID_CODE_RESPONSE) {
      return new RegistrationError('El código no es válido o ya venció. Revísalo o solicita otro.', 'invalid-code');
    }
    return new RegistrationError('El servidor no pudo aceptar los datos. Revisa el formulario e inténtalo de nuevo.', 'validation');
  }
  if (error.status !== null && error.status >= 500) {
    return new RegistrationError(requestingCode
      ? 'No pudimos enviar el código. El servicio no está disponible por el momento.'
      : 'No pudimos confirmar el registro. El servicio no está disponible por el momento.', 'server');
  }
  return new RegistrationError(unknownMessage, 'unknown');
}

function mapRegistrationChallenge(payload: unknown): RegistrationChallenge {
  const dto = payload && typeof payload === 'object' && !Array.isArray(payload)
    ? payload as Record<string, unknown>
    : {};
  const { challengeId, expiresInSeconds, resendAfterSeconds } = dto;
  if (!isRegistrationChallengeId(challengeId)
    || typeof expiresInSeconds !== 'number' || !Number.isSafeInteger(expiresInSeconds)
    || expiresInSeconds <= 0 || expiresInSeconds * 1000 > 2_147_483_647
    || typeof resendAfterSeconds !== 'number' || !Number.isSafeInteger(resendAfterSeconds)
    || resendAfterSeconds < 0 || resendAfterSeconds > expiresInSeconds) {
    throw new RegistrationError('No pudimos confirmar el envío del código. Inténtalo más tarde.', 'invalid-response');
  }
  return { challengeId, expiresInSeconds, resendAfterSeconds };
}

export class ApiRegistrationRepository implements RegistrationRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async requestCode(email: string, options?: RegistrationOptions): Promise<RegistrationChallenge> {
    try {
      const payload = await this.httpClient.request('/auth/register/verification', {
        method: 'POST',
        authenticated: false,
        signal: options?.signal,
        timeoutMs: CODE_REQUEST_TIMEOUT_MS,
        body: { email },
      });
      return mapRegistrationChallenge(payload);
    } catch (error) {
      throw mapRegistrationError(error, 'request-code');
    }
  }

  async register(
    input: RegistrationInput, verification: RegistrationVerification, options?: RegistrationOptions,
  ): Promise<RegisteredUser> {
    try {
      const payload = await this.httpClient.request('/auth/register/verified', {
        method: 'POST',
        authenticated: false,
        signal: options?.signal,
        body: {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          password: input.password,
          challengeId: verification.challengeId,
          code: verification.code,
        },
      });
      return mapRegisteredUser(payload);
    } catch (error) {
      throw mapRegistrationError(error, 'register');
    }
  }
}
