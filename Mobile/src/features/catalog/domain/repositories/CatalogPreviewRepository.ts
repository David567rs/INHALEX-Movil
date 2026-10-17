import type { CatalogPreviewProduct } from '../models/CatalogPreviewProduct';

export interface CatalogPreviewRepository {
  read(): readonly CatalogPreviewProduct[];
}
