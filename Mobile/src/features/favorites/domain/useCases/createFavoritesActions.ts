import { FavoritesError } from '../errors/FavoritesError';
import type { FavoritesActions, FavoritesRepository, FavoritesRequestOptions } from '../repositories/FavoritesRepository';
import { isFavoriteProductId } from '../validation/favoriteProductId';

function cancelled(): FavoritesError {
  return new FavoritesError('Se canceló la operación de favoritos.', 'cancelled');
}

function productId(id: string): string {
  if (!isFavoriteProductId(id)) {
    throw new FavoritesError('Este producto no es válido. Vuelve al catálogo y elige otro aroma.', 'invalid-request');
  }
  return id.toLowerCase();
}

export function createFavoritesActions(repository: FavoritesRepository): FavoritesActions {
  async function perform<T>(operation: () => Promise<T>, options?: FavoritesRequestOptions): Promise<T> {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const result = await operation();
      if (options?.signal?.aborted) throw cancelled();
      return result;
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      if (error instanceof FavoritesError) throw error;
      throw new FavoritesError('No pudimos completar la operación de favoritos. Inténtalo de nuevo más tarde.', 'server');
    }
  }

  return {
    list: (options) => perform(() => repository.list(options), options),
    add: (id, options) => perform(() => repository.add(productId(id), options), options),
    remove: (id, options) => perform(() => repository.remove(productId(id), options), options),
  };
}
