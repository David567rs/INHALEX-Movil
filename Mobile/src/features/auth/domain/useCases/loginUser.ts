import { LoginError } from '../errors/LoginError';
import type { LoginInput, LoginSession } from '../models/Login';
import type { LoginOptions, LoginRepository } from '../repositories/LoginRepository';
import { validateLogin } from '../validation/loginValidation';
import type { LoginForm } from '../validation/loginValidation';

export type LoginUserAction = (form: LoginForm, options?: LoginOptions) => Promise<LoginSession>;

export function createLoginUser(repository: LoginRepository): LoginUserAction {
  return async (form, options) => {
    const input: LoginInput = {
      email: form.email.trim().toLowerCase(),
      password: form.password,
    };
    // Check both entered and outgoing values: Unicode lowercasing can increase byte length.
    const errors = { ...validateLogin(form), ...validateLogin(input) };
    if (Object.keys(errors).length > 0) {
      throw new LoginError('Revisa los datos del formulario antes de iniciar sesión.', 'validation', errors);
    }
    if (options?.signal?.aborted) {
      throw new LoginError('Se canceló el inicio de sesión.', 'cancelled');
    }

    try {
      const session = await repository.login(input, options);
      if (options?.signal?.aborted) {
        throw new LoginError('Se canceló el inicio de sesión.', 'cancelled');
      }
      return session;
    } catch (error) {
      if (error instanceof LoginError) throw error;
      if (options?.signal?.aborted) {
        throw new LoginError('Se canceló el inicio de sesión.', 'cancelled');
      }
      throw new LoginError('No pudimos iniciar sesión. Inténtalo de nuevo más tarde.', 'unknown');
    }
  };
}
