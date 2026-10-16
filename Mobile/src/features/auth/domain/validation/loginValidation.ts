import isEmail from 'validator/lib/isEmail';
import isLength from 'validator/lib/isLength';

export type LoginForm = {
  email: string;
  password: string;
};

export type LoginField = keyof LoginForm;
export type LoginErrors = Partial<Record<LoginField, string>>;

export function createEmptyLoginForm(): LoginForm {
  return { email: '', password: '' };
}

/** Prevalidate entered values without changing them or attempting to sign in. */
export function validateLogin(form: LoginForm): LoginErrors {
  const errors: LoginErrors = {};
  const email = form.email.trim();

  if (!email) {
    errors.email = 'El correo electrónico es obligatorio.';
  } else if (!isEmail(email)) {
    errors.email = 'Ingresa un correo electrónico válido.';
  }

  if (/^\s*$/.test(form.password)) {
    errors.password = 'La contraseña es obligatoria.';
  } else if (!isLength(form.password, { min: 8, max: 128 })) {
    // Use LoginDto's length semantics, including surrogate and presentation sequences.
    errors.password = 'La contraseña debe tener entre 8 y 128 caracteres.';
  }

  return errors;
}
