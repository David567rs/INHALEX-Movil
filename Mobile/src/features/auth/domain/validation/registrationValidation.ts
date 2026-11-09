import isEmail from 'validator/lib/isEmail';

export type RegistrationForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
};

export type RegistrationField = keyof RegistrationForm;
export type RegistrationErrors = Partial<Record<RegistrationField, string>>;

const NAME_PATTERN = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]+$/;
const PHONE_PATTERN = /^[0-9]{10,15}$/;
const CHALLENGE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Match the symbol set used by RegisterDto's IsStrongPassword validator.
// An ASCII space counts as a symbol there; other Unicode characters are not banned.
const PASSWORD_SYMBOL_PATTERN = /[-#!$@£%^&*()_+|~=`{}\[\]:";'<>?,.\/\\ ]/;

export function createEmptyRegistrationForm(): RegistrationForm {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  };
}

export function getPasswordChecks(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: PASSWORD_SYMBOL_PATTERN.test(password),
  };
}

export function validateRegistrationEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return 'El correo electrónico es obligatorio.';
  if (!isEmail(trimmed)) return 'Ingresa un correo electrónico válido.';
}

export function isRegistrationChallengeId(value: unknown): value is string {
  return typeof value === 'string' && CHALLENGE_ID_PATTERN.test(value);
}

/** Prevalidate the form without changing any entered values or creating an account. */
export function validateRegistration(form: RegistrationForm): RegistrationErrors {
  const errors: RegistrationErrors = {};
  const firstName = form.firstName.trim();
  const lastName = form.lastName.trim();
  const phone = form.phone.trim();

  if (!firstName) {
    errors.firstName = 'El nombre es obligatorio.';
  } else if (firstName.length < 2 || firstName.length > 50) {
    errors.firstName = 'El nombre debe tener entre 2 y 50 caracteres.';
  } else if (!NAME_PATTERN.test(firstName)) {
    errors.firstName = 'Usa letras, espacios, apóstrofos o guiones en el nombre.';
  }

  if (!lastName) {
    errors.lastName = 'El apellido es obligatorio.';
  } else if (lastName.length < 2 || lastName.length > 50) {
    errors.lastName = 'El apellido debe tener entre 2 y 50 caracteres.';
  } else if (!NAME_PATTERN.test(lastName)) {
    errors.lastName = 'Usa letras, espacios, apóstrofos o guiones en el apellido.';
  }

  const emailError = validateRegistrationEmail(form.email);
  if (emailError) errors.email = emailError;

  if (!phone) {
    errors.phone = 'El número telefónico es obligatorio.';
  } else if (!PHONE_PATTERN.test(phone)) {
    errors.phone = 'Ingresa entre 10 y 15 dígitos, sin espacios, signos ni guiones.';
  }

  // Detect blank fields without trimming the password used by the checks or comparison.
  if (/^\s*$/.test(form.password)) {
    errors.password = 'La contraseña es obligatoria.';
  } else if (Object.values(getPasswordChecks(form.password)).some((check) => !check)) {
    errors.password = 'Usa al menos 8 caracteres, una mayúscula, un número y un símbolo.';
  }

  if (/^\s*$/.test(form.confirmPassword)) {
    errors.confirmPassword = 'Confirma tu contraseña.';
  } else if (form.password !== form.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden.';
  }

  return errors;
}
