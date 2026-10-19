import type { CatalogPage } from '../../../catalog/domain/models/Catalog';
import { ProductSearchError } from '../errors/ProductSearchError';
import type { ProductSearchInput, ProductSearchRepository, ProductSearchRequestOptions } from '../repositories/ProductSearchRepository';

export const PRODUCT_SEARCH_TERM_MAX_LENGTH = 100;
export type SearchProducts = (input: ProductSearchInput, options?: ProductSearchRequestOptions) => Promise<CatalogPage>;

function cancelled(): ProductSearchError {
  return new ProductSearchError('Se canceló la búsqueda de productos.', 'cancelled');
}

/** Treat the user's words literally; only the data adapter knows the server's query syntax. */
export function createSearchProducts(repository: ProductSearchRepository): SearchProducts {
  return async (input, options) => {
    if (options?.signal?.aborted) throw cancelled();
    const term = typeof input?.term === 'string' ? input.term.trim() : '';
    if (!term) {
      throw new ProductSearchError('Escribe el nombre o una palabra clave para buscar un producto.', 'validation');
    }
    if (term.length > PRODUCT_SEARCH_TERM_MAX_LENGTH) {
      throw new ProductSearchError('Usa hasta 100 caracteres para buscar un producto.', 'validation');
    }
    if (!Number.isSafeInteger(input.page) || input.page < 1
      || !Number.isSafeInteger(input.limit) || input.limit < 1 || input.limit > 100) {
      throw new ProductSearchError('No pudimos cargar esta página de resultados. Inténtalo de nuevo.', 'configuration');
    }

    try {
      const result = await repository.search({ term, page: input.page, limit: input.limit }, options);
      if (options?.signal?.aborted) throw cancelled();
      return result;
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      if (error instanceof ProductSearchError) throw error;
      throw new ProductSearchError('No pudimos buscar productos. Inténtalo de nuevo más tarde.', 'unknown');
    }
  };
}
