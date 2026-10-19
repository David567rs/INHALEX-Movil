import { readEnvironment, type Environment } from '../core/config/environment';
import { HttpClient, type FetchImplementation } from '../core/network/HttpClient';
import { ApiProductDetailRepository } from '../features/productDetail/data/repositories/ApiProductDetailRepository';
import { ProductDetailError } from '../features/productDetail/domain/errors/ProductDetailError';
import { createGetProductDetail, type GetProductDetail } from '../features/productDetail/domain/useCases/getProductDetail';

/** Public detail, composed lazily so an invalid environment remains recoverable. */
export function createProductDetailAction(options: { environment?: Environment; fetch?: FetchImplementation } = {}): GetProductDetail {
  let repository: ApiProductDetailRepository | undefined;
  return createGetProductDetail({ getById: (id, requestOptions) => {
    if (!repository) {
      try {
        const environment = options.environment ?? readEnvironment();
        repository = new ApiProductDetailRepository(new HttpClient({
          baseUrl: environment.apiUrl, isDevelopment: environment.isDevelopment,
          requestTimeoutMs: environment.requestTimeoutMs, fetch: options.fetch,
        }));
      } catch {
        return Promise.reject(new ProductDetailError('El detalle no está disponible en este momento. Inténtalo más tarde.', 'configuration'));
      }
    }
    return repository.getById(id, requestOptions);
  } });
}
