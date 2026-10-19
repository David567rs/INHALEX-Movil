import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient } from '../../../../core/network/HttpClient';
import { ProductLinesError } from '../../domain/errors/ProductLinesError';
import type { ProductLine } from '../../domain/models/ProductLine';
import type { ProductLinesRepository, ProductLinesRequestOptions } from '../../domain/repositories/ProductLinesRepository';
import { mapProductLines } from '../mappers/mapProductLines';

function mapProductLinesError(error: unknown): ProductLinesError {
  if (error instanceof ProductLinesError) return error;
  if (!(error instanceof ApiError)) {
    return new ProductLinesError('No pudimos cargar las líneas. Inténtalo de nuevo más tarde.', 'unknown');
  }
  if (error.kind === 'cancelled') return new ProductLinesError('Se canceló la carga de las líneas.', 'cancelled');
  if (error.kind === 'timeout') return new ProductLinesError('Las líneas tardaron demasiado en responder. Inténtalo de nuevo.', 'timeout');
  if (error.kind === 'network') {
    return new ProductLinesError('No pudimos conectar con INHALEX. Revisa tu conexión e inténtalo de nuevo.', 'network');
  }
  if (error.kind === 'invalid-response') {
    return new ProductLinesError('No pudimos cargar las líneas en este momento. Inténtalo de nuevo más tarde.', 'invalid-response');
  }
  if (error.kind === 'invalid-request') {
    return new ProductLinesError('Las líneas no están disponibles en este momento. Inténtalo más tarde.', 'configuration');
  }
  if (error.status !== null && error.status >= 500) {
    return new ProductLinesError('Las líneas no están disponibles por el momento. Inténtalo de nuevo más tarde.', 'server');
  }
  return new ProductLinesError('No pudimos cargar las líneas. Inténtalo de nuevo más tarde.', 'unknown');
}

export class ApiProductLinesRepository implements ProductLinesRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async list(options?: ProductLinesRequestOptions): Promise<readonly ProductLine[]> {
    try {
      const payload = await this.httpClient.request('/products/categories', {
        method: 'GET', authenticated: false, signal: options?.signal,
      });
      return mapProductLines(payload);
    } catch (error) {
      throw mapProductLinesError(error);
    }
  }
}
