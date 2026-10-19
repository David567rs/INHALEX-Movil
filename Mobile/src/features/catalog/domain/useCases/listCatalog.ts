import { CatalogError } from '../errors/CatalogError';
import type { CatalogPage } from '../models/Catalog';
import type { CatalogListInput, CatalogRepository, CatalogRequestOptions } from '../repositories/CatalogRepository';

export type ListCatalog = (input: CatalogListInput, options?: CatalogRequestOptions) => Promise<CatalogPage>;

function cancelled(): CatalogError {
  return new CatalogError('Se canceló la carga del catálogo.', 'cancelled');
}

export function createListCatalog(repository: CatalogRepository): ListCatalog {
  return async (input, options) => {
    if (options?.signal?.aborted) throw cancelled();
    if (!Number.isSafeInteger(input?.page) || input.page < 1
      || !Number.isSafeInteger(input?.limit) || input.limit < 1 || input.limit > 100) {
      throw new CatalogError('No pudimos cargar esta página del catálogo. Inténtalo de nuevo.', 'configuration');
    }
    const category = typeof input.category === 'string' ? input.category.trim().toLowerCase() : input.category;
    if (category !== undefined && (typeof category !== 'string' || !/^[a-z0-9-]+$/.test(category))) {
      throw new CatalogError('No pudimos identificar esta línea. Vuelve al catálogo y selecciona otra.', 'configuration');
    }

    try {
      const result = await repository.list({ page: input.page, limit: input.limit,
        ...(category === undefined ? {} : { category }) }, options);
      if (options?.signal?.aborted) throw cancelled();
      return result;
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      if (error instanceof CatalogError) throw error;
      throw new CatalogError('No pudimos cargar el catálogo. Inténtalo de nuevo más tarde.', 'unknown');
    }
  };
}
