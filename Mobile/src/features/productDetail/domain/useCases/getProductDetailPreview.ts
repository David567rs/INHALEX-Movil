import type { ProductDetailPreview } from '../models/ProductDetailPreview';
import type { ProductDetailPreviewRepository } from '../repositories/ProductDetailPreviewRepository';

export type GetProductDetailPreview = (id: string) => ProductDetailPreview | null;

export function createGetProductDetailPreview(repository: ProductDetailPreviewRepository): GetProductDetailPreview {
  return (id) => typeof id === 'string' && id.trim() ? repository.get(id) : null;
}
