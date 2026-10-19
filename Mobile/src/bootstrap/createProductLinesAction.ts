import { readEnvironment, type Environment } from '../core/config/environment';
import { HttpClient, type FetchImplementation } from '../core/network/HttpClient';
import { ApiProductLinesRepository } from '../features/productLines/data/repositories/ApiProductLinesRepository';
import { ProductLinesError } from '../features/productLines/domain/errors/ProductLinesError';
import { createListProductLines, type ListProductLines } from '../features/productLines/domain/useCases/listProductLines';

/** Public category dependencies are composed only when the view requests them. */
export function createProductLinesAction(options: { environment?: Environment; fetch?: FetchImplementation } = {}): ListProductLines {
  let action: ListProductLines | undefined;
  return (requestOptions) => {
    if (!action) {
      try {
        const environment = options.environment ?? readEnvironment();
        action = createListProductLines(new ApiProductLinesRepository(new HttpClient({
          baseUrl: environment.apiUrl, isDevelopment: environment.isDevelopment,
          requestTimeoutMs: environment.requestTimeoutMs, fetch: options.fetch,
        })));
      } catch {
        return Promise.reject(new ProductLinesError('Las líneas no están disponibles en este momento. Inténtalo más tarde.', 'configuration'));
      }
    }
    return action(requestOptions);
  };
}
