import type { CatalogProduct } from '../features/catalog/domain/models/Catalog';
import { MemoryProductDetailPreviewRepository } from '../features/productDetail/data/repositories/MemoryProductDetailPreviewRepository';
import { createGetProductDetailPreview, type GetProductDetailPreview } from '../features/productDetail/domain/useCases/getProductDetailPreview';

const repository = new MemoryProductDetailPreviewRepository();

export function rememberProductDetailPreview(product: CatalogProduct): void {
  repository.remember(product);
}

export function createProductDetailPreviewAction(): GetProductDetailPreview {
  return createGetProductDetailPreview(repository);
}
