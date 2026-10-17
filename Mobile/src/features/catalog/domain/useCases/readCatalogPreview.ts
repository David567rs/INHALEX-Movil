import type { CatalogPreviewProduct } from '../models/CatalogPreviewProduct';
import type { CatalogPreviewRepository } from '../repositories/CatalogPreviewRepository';

export type ReadCatalogPreview = () => readonly CatalogPreviewProduct[];

export function createReadCatalogPreview(repository: CatalogPreviewRepository): ReadCatalogPreview {
  return () => repository.read();
}
