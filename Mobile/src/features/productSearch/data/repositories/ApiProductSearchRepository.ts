import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient } from '../../../../core/network/HttpClient';
import { mapCatalogPage } from '../../../catalog/data/mappers/mapCatalogPage';
import { CatalogError } from '../../../catalog/domain/errors/CatalogError';
import type { CatalogPage } from '../../../catalog/domain/models/Catalog';
import { ProductSearchError } from '../../domain/errors/ProductSearchError';
import type { ProductSearchInput, ProductSearchRepository, ProductSearchRequestOptions } from '../../domain/repositories/ProductSearchRepository';

function mapSearchError(error: unknown): ProductSearchError {
  if (error instanceof CatalogError && error.kind === 'invalid-response') {
    return new ProductSearchError('No pudimos leer los resultados de búsqueda. Inténtalo de nuevo más tarde.', 'invalid-response');
  }
  if (error instanceof ApiError) {
    if (error.kind === 'cancelled') {
      return new ProductSearchError('Se canceló la búsqueda de productos.', 'cancelled');
    }
    if (error.kind === 'timeout') {
      return new ProductSearchError('La búsqueda tardó demasiado en responder. Inténtalo de nuevo.', 'timeout');
    }
    if (error.kind === 'network') {
      return new ProductSearchError('No pudimos conectar con INHALEX. Revisa tu conexión y vuelve a buscar.', 'network');
    }
    if (error.kind === 'invalid-response') {
      return new ProductSearchError('No pudimos leer los resultados de búsqueda. Inténtalo de nuevo más tarde.', 'invalid-response');
    }
    if (error.kind === 'invalid-request') {
      return new ProductSearchError('La búsqueda no está disponible en este momento. Inténtalo más tarde.', 'configuration');
    }
    if (error.status !== null && error.status >= 500) {
      return new ProductSearchError('La búsqueda no está disponible por el momento. Inténtalo de nuevo más tarde.', 'server');
    }
  }
  return new ProductSearchError('No pudimos buscar productos. Inténtalo de nuevo más tarde.', 'unknown');
}

export class ApiProductSearchRepository implements ProductSearchRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async search(input: ProductSearchInput, options?: ProductSearchRequestOptions): Promise<CatalogPage> {
    try {
      // The current API builds a RegExp from `search`. Escape its syntax so words remain literal.
      const literalTerm = input.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const payload = await this.httpClient.request(`/products?page=${input.page}&limit=${input.limit}&search=${encodeURIComponent(literalTerm)}`, {
        method: 'GET',
        authenticated: false,
        signal: options?.signal,
      });
      return mapCatalogPage(payload, input);
    } catch (error) {
      throw mapSearchError(error);
    }
  }
}
