import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient } from '../../../../core/network/HttpClient';
import { CatalogError } from '../../domain/errors/CatalogError';
import type { CatalogPage } from '../../domain/models/Catalog';
import type { CatalogListInput, CatalogRepository, CatalogRequestOptions } from '../../domain/repositories/CatalogRepository';
import { mapCatalogPage } from '../mappers/mapCatalogPage';

function mapCatalogError(error: unknown): CatalogError {
  if (error instanceof CatalogError) return error;
  if (!(error instanceof ApiError)) {
    return new CatalogError('No pudimos cargar el catálogo. Inténtalo de nuevo más tarde.', 'unknown');
  }
  if (error.kind === 'cancelled') {
    return new CatalogError('Se canceló la carga del catálogo.', 'cancelled');
  }
  if (error.kind === 'timeout') {
    return new CatalogError('El catálogo tardó demasiado en responder. Inténtalo de nuevo.', 'timeout');
  }
  if (error.kind === 'network') {
    return new CatalogError('No pudimos conectar con INHALEX. Revisa tu conexión e inténtalo de nuevo.', 'network');
  }
  if (error.kind === 'invalid-response') {
    return new CatalogError('No pudimos cargar el catálogo en este momento. Inténtalo de nuevo más tarde.', 'invalid-response');
  }
  if (error.kind === 'invalid-request') {
    return new CatalogError('El catálogo no está disponible en este momento. Inténtalo más tarde.', 'configuration');
  }
  if (error.status !== null && error.status >= 500) {
    return new CatalogError('El catálogo no está disponible por el momento. Inténtalo de nuevo más tarde.', 'server');
  }
  return new CatalogError('No pudimos cargar el catálogo. Inténtalo de nuevo más tarde.', 'unknown');
}

export class ApiCatalogRepository implements CatalogRepository {
  private readonly httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  async list(input: CatalogListInput, options?: CatalogRequestOptions): Promise<CatalogPage> {
    try {
      const payload = await this.httpClient.request(`/products?page=${input.page}&limit=${input.limit}`, {
        method: 'GET',
        authenticated: false,
        signal: options?.signal,
      });
      return mapCatalogPage(payload, input);
    } catch (error) {
      throw mapCatalogError(error);
    }
  }
}
