import type { ProductDetail } from '../models/ProductDetail';

export type ProductDetailRequestOptions = { signal?: AbortSignal };

export interface ProductDetailRepository {
  getById(id: string, options?: ProductDetailRequestOptions): Promise<ProductDetail>;
}
