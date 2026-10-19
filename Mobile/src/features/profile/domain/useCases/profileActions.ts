import { ProfileError } from '../errors/ProfileError';
import type { ProfileActions, ProfileRepository, ProfileRequestOptions } from '../repositories/ProfileRepository';
import { validateProfileDraft } from '../validation/profileValidation';

export type { ProfileActions } from '../repositories/ProfileRepository';

function cancelled(): ProfileError {
  return new ProfileError('Se canceló la operación del perfil.', 'cancelled');
}

export function createProfileActions(repository: ProfileRepository): ProfileActions {
  async function perform<T>(operation: () => Promise<T>, options?: ProfileRequestOptions): Promise<T> {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const result = await operation();
      if (options?.signal?.aborted) throw cancelled();
      return result;
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      if (error instanceof ProfileError) throw error;
      throw new ProfileError('No pudimos completar la operación del perfil. Inténtalo de nuevo más tarde.', 'unknown');
    }
  }

  return {
    get: (options) => perform(() => repository.get(options), options),
    update: (draft, options) => perform(() => {
      const validation = validateProfileDraft(draft);
      if (!validation.valid) {
        throw new ProfileError('Revisa los campos señalados antes de guardar.', 'validation', validation.errors);
      }
      return repository.update(validation.values, options);
    }, options),
  };
}
