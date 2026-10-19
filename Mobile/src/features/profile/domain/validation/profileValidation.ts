import type { ProfileDraft, ProfileFieldErrors } from '../models/Profile';

const NAME_CHARACTERS = /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü' -]+$/;
const HAS_LETTER = /[A-Za-zÁÉÍÓÚáéíóúÑñÜü]/;

function normalizeName(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

/** Match UpdateProfileDto without mutating the form or forwarding restricted fields. */
export function validateProfileDraft(draft: ProfileDraft): {
  values: ProfileDraft;
  errors: ProfileFieldErrors;
  valid: boolean;
} {
  const source: Partial<ProfileDraft> = draft !== null && typeof draft === 'object' && !Array.isArray(draft)
    ? draft : {};
  const values: ProfileDraft = {
    firstName: normalizeName(source.firstName),
    lastName: normalizeName(source.lastName),
    phone: typeof source.phone === 'string' ? source.phone.trim() : '',
  };
  const errors: ProfileFieldErrors = {};

  for (const field of ['firstName', 'lastName'] as const) {
    const label = field === 'firstName' ? 'El nombre' : 'El apellido';
    const value = values[field];
    if (!value) errors[field] = `${label} es obligatorio.`;
    else if (value.length < 2 || value.length > 50) errors[field] = `${label} debe tener entre 2 y 50 caracteres.`;
    else if (!NAME_CHARACTERS.test(value) || !HAS_LETTER.test(value)) {
      errors[field] = 'Usa letras, espacios, apóstrofos o guiones e incluye al menos una letra.';
    }
  }

  if (!errors.firstName && !errors.lastName && `${values.firstName} ${values.lastName}`.length > 100) {
    errors.lastName = 'El nombre completo debe tener como máximo 100 caracteres.';
  }

  if (!values.phone) errors.phone = 'El número telefónico es obligatorio.';
  else if (!/^[0-9]{10,15}$/.test(values.phone)) {
    errors.phone = 'Ingresa entre 10 y 15 dígitos, sin espacios, signos ni guiones.';
  }

  return { values, errors, valid: Object.keys(errors).length === 0 };
}
