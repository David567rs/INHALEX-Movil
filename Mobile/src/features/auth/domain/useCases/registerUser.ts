import { RegistrationError } from '../errors/RegistrationError';
import type {
  RegisteredUser, RegistrationChallenge, RegistrationInput, RegistrationVerification,
} from '../models/Registration';
import type { RegistrationOptions, RegistrationRepository } from '../repositories/RegistrationRepository';
import {
  isRegistrationChallengeId, validateRegistration, validateRegistrationEmail,
} from '../validation/registrationValidation';
import type { RegistrationForm } from '../validation/registrationValidation';

export type RegisterUser = (
  form: RegistrationForm,
  verification: RegistrationVerification,
  options?: RegistrationOptions,
) => Promise<RegisteredUser>;

export type RequestRegistrationCode = (
  email: string, options?: RegistrationOptions,
) => Promise<RegistrationChallenge>;

export type RegistrationActions = {
  requestCode: RequestRegistrationCode;
  registerUser: RegisterUser;
};

export function createRequestRegistrationCode(repository: RegistrationRepository): RequestRegistrationCode {
  return async (email, options) => {
    const normalizedEmail = email.trim().toLowerCase();
    const emailError = validateRegistrationEmail(normalizedEmail);
    if (emailError) {
      throw new RegistrationError(emailError, 'validation', { email: emailError });
    }
    if (options?.signal?.aborted) {
      throw new RegistrationError('Se canceló la solicitud del código.', 'cancelled');
    }

    try {
      return await repository.requestCode(normalizedEmail, options);
    } catch (error) {
      if (error instanceof RegistrationError) throw error;
      throw new RegistrationError('No pudimos solicitar el código. Inténtalo más tarde.', 'unknown');
    }
  };
}

export function createRegisterUser(repository: RegistrationRepository): RegisterUser {
  return async (form, verification, options) => {
    const input: RegistrationInput = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      password: form.password,
    };
    // Lowercasing Unicode can change byte length, so validate the values being sent.
    const errors = validateRegistration({ ...input, confirmPassword: form.confirmPassword });
    if (Object.keys(errors).length > 0) {
      throw new RegistrationError('Revisa los datos del formulario antes de crear tu cuenta.', 'validation', errors);
    }
    if (options?.signal?.aborted) {
      throw new RegistrationError('Se canceló la solicitud de registro.', 'cancelled');
    }
    if (!isRegistrationChallengeId(verification?.challengeId)
      || typeof verification.code !== 'string' || !/^[0-9]{6}$/.test(verification.code)) {
      throw new RegistrationError('Ingresa los seis dígitos del código de verificación.', 'invalid-code');
    }

    try {
      return await repository.register(input, {
        challengeId: verification.challengeId,
        code: verification.code,
      }, options);
    } catch (error) {
      if (error instanceof RegistrationError) throw error;
      throw new RegistrationError('No pudimos confirmar el registro. Intenta de nuevo más tarde.', 'unknown');
    }
  };
}
