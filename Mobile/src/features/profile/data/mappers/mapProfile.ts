import { ProfileError } from '../../domain/errors/ProfileError';
import type { Profile } from '../../domain/models/Profile';

export function invalidProfileResponse(): ProfileError {
  return new ProfileError('No pudimos confirmar tus datos. Actualiza tu perfil e inténtalo de nuevo.', 'invalid-response');
}

/** /auth/me returns a flat public profile. Account identity is checked by its session controller. */
export function mapProfile(payload: unknown): Profile {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) throw invalidProfileResponse();
  const value = payload as Record<string, unknown>;
  if (typeof value._id !== 'string' || value._id.length !== 24 || !/^[a-f\d]{24}$/i.test(value._id)
    || !['firstName', 'lastName', 'email', 'phone'].every((field) =>
      typeof value[field] === 'string' && value[field].trim().length > 0)) throw invalidProfileResponse();

  return Object.freeze({
    id: value._id.toLowerCase(),
    firstName: value.firstName as string,
    lastName: value.lastName as string,
    email: value.email as string,
    phone: value.phone as string,
  });
}
