import { readEnvironment, type Environment } from '../core/config/environment';
import { HttpClient, type FetchImplementation } from '../core/network/HttpClient';
import { ApiProductSearchRepository } from '../features/productSearch/data/repositories/ApiProductSearchRepository';
import { ProductSearchError } from '../features/productSearch/domain/errors/ProductSearchError';
import { createSearchProducts, type SearchProducts } from '../features/productSearch/domain/useCases/searchProducts';

/** Public search, composed lazily after domain validation so configuration remains recoverable. */
export function createProductSearchAction(options: { environment?: Environment; fetch?: FetchImplementation } = {}): SearchProducts {
  let repository: ApiProductSearchRepository | undefined;
  return createSearchProducts({ search: (input, requestOptions) => {
    if (!repository) {
      try {
        const environment = options.environment ?? readEnvironment();
        repository = new ApiProductSearchRepository(new HttpClient({
          baseUrl: environment.apiUrl, isDevelopment: environment.isDevelopment,
          requestTimeoutMs: environment.requestTimeoutMs, fetch: options.fetch,
        }));
      } catch {
        return Promise.reject(new ProductSearchError('La búsqueda no está disponible en este momento. Inténtalo más tarde.', 'configuration'));
      }
    }
    return repository.search(input, requestOptions);
  } });
}
