import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient } from '../../../../core/network/HttpClient';
import { ProductDetailError } from '../../domain/errors/ProductDetailError';
import type { ProductDetail } from '../../domain/models/ProductDetail';
import type { ProductDetailRepository, ProductDetailRequestOptions } from '../../domain/repositories/ProductDetailRepository';
import { isProductDetailId } from '../../domain/validation/productDetailId';
import { mapProductDetail } from '../mappers/mapProductDetail';

function mapDetailError(error: unknown): ProductDetailError {
  if (error instanceof ProductDetailError) return error;
  if (!(error instanceof ApiError)) {
    return new ProductDetailError('No pudimos cargar este producto. Inténtalo de nuevo más tarde.', 'server');
  }
  if (error.kind === 'cancelled') return new ProductDetailError('Se canceló la carga del producto.', 'cancelled');
  if (error.kind === 'timeout') return new ProductDetailError('El producto tardó demasiado en responder. Inténtalo de nuevo.', 'timeout');
  if (error.kind === 'network') {
    return new ProductDetailError('No pudimos conectar con INHALEX. Revisa tu conexión e inténtalo de nuevo.', 'network');
  }
  if (error.kind === 'invalid-response') {
    return new ProductDetailError('No pudimos mostrar este producto en este momento. Inténtalo de nuevo más tarde.', 'invalid-response');
  }
  if (error.kind === 'invalid-request') {
    return new ProductDetailError('El detalle no está disponible en este momento. Inténtalo más tarde.', 'configuration');
  }
  if (error.status === 404) {
    return new ProductDetailError('Este producto no está disponible. Vuelve al catálogo y elige otro aroma.', 'not-found');
  }
  return new ProductDetailError('No pudimos cargar este producto. Inténtalo de nuevo más tarde.', 'server');
}

export class ApiProductDetailRepository implements ProductDetailRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async getById(id: string, options?: ProductDetailRequestOptions): Promise<ProductDetail> {
    if (options?.signal?.aborted) throw new ProductDetailError('Se canceló la carga del producto.', 'cancelled');
    if (!isProductDetailId(id)) {
      throw new ProductDetailError('Este producto no está disponible. Vuelve al catálogo y elige otro aroma.', 'not-found');
    }
    try {
      const payload = await this.httpClient.request(`/products/${encodeURIComponent(id)}`, {
        method: 'GET', authenticated: false, signal: options?.signal,
      });
      return mapProductDetail(payload, id);
    } catch (error) {
      throw mapDetailError(error);
    }
  }
}
