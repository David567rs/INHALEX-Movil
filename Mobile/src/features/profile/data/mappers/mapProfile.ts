import { ProfileError } from '../../domain/errors/ProfileError';
import type { Profile } from '../../domain/models/Profile';
import { mapPublicAccount } from '../../../../shared/data/mappers/mapPublicAccount';

export function invalidProfileResponse(): ProfileError {
  return new ProfileError('No pudimos confirmar tus datos. Actualiza tu perfil e inténtalo de nuevo.', 'invalid-response');
}

/** /auth/me returns a flat public profile. Account identity is checked by its session controller. */
export function mapProfile(payload: unknown): Profile {
  const profile = mapPublicAccount(payload);
  if (!profile) throw invalidProfileResponse();
  return Object.freeze(profile);
}
