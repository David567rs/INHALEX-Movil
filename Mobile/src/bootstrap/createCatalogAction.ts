import { readEnvironment, type Environment } from '../core/config/environment';
import { HttpClient, type FetchImplementation } from '../core/network/HttpClient';
import { ApiCatalogRepository } from '../features/catalog/data/repositories/ApiCatalogRepository';
import { CatalogError } from '../features/catalog/domain/errors/CatalogError';
import { createListCatalog, type ListCatalog } from '../features/catalog/domain/useCases/listCatalog';

/** Catalog is public. Compose lazily so configuration errors remain recoverable in its view. */
export function createCatalogAction(options: { environment?: Environment; fetch?: FetchImplementation } = {}): ListCatalog {
  let action: ListCatalog | undefined;
  return (input, requestOptions) => {
    if (!action) {
      try {
        const environment = options.environment ?? readEnvironment();
        action = createListCatalog(new ApiCatalogRepository(new HttpClient({
          baseUrl: environment.apiUrl, isDevelopment: environment.isDevelopment,
          requestTimeoutMs: environment.requestTimeoutMs, fetch: options.fetch,
        })));
      } catch {
        return Promise.reject(new CatalogError('El catálogo no está disponible en este momento. Inténtalo más tarde.', 'configuration'));
      }
    }
    return action(input, requestOptions);
  };
}
