import { RegistrationError } from '../errors/RegistrationError';
import type { RegisteredUser, RegistrationInput } from '../models/Registration';
import type { RegistrationOptions, RegistrationRepository } from '../repositories/RegistrationRepository';
import { validateRegistration } from '../validation/registrationValidation';
import type { RegistrationForm } from '../validation/registrationValidation';

export type RegisterUser = (form: RegistrationForm, options?: RegistrationOptions) => Promise<RegisteredUser>;

export function createRegisterUser(repository: RegistrationRepository): RegisterUser {
  return async (form, options) => {
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

    try {
      return await repository.register(input, options);
    } catch (error) {
      if (error instanceof RegistrationError) throw error;
      throw new RegistrationError('No pudimos confirmar el registro. Intenta de nuevo más tarde.', 'unknown');
    }
  };
}
