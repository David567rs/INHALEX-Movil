import { ProductDetailError } from '../errors/ProductDetailError';
import type { ProductDetail } from '../models/ProductDetail';
import type { ProductDetailRepository, ProductDetailRequestOptions } from '../repositories/ProductDetailRepository';
import { isProductDetailId } from '../validation/productDetailId';

export type GetProductDetail = (id: string, options?: ProductDetailRequestOptions) => Promise<ProductDetail>;

function cancelled(): ProductDetailError {
  return new ProductDetailError('Se canceló la carga del producto.', 'cancelled');
}

export function createGetProductDetail(repository: ProductDetailRepository): GetProductDetail {
  return async (id, options) => {
    if (options?.signal?.aborted) throw cancelled();
    if (!isProductDetailId(id)) {
      throw new ProductDetailError('Este producto no está disponible. Vuelve al catálogo y elige otro aroma.', 'not-found');
    }
    try {
      const product = await repository.getById(id, options);
      if (options?.signal?.aborted) throw cancelled();
      return product;
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      if (error instanceof ProductDetailError) throw error;
      throw new ProductDetailError('No pudimos cargar este producto. Inténtalo de nuevo más tarde.', 'server');
    }
  };
}
