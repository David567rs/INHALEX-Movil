import { LocalPreviewCatalogRepository } from '../features/catalog/data/repositories/LocalPreviewCatalogRepository';
import { createReadCatalogPreview, type ReadCatalogPreview } from '../features/catalog/domain/useCases/readCatalogPreview';

/** Compose only local sample data for the design checkpoint. */
export function createCatalogPreview(): ReadCatalogPreview {
  return createReadCatalogPreview(new LocalPreviewCatalogRepository());
}
