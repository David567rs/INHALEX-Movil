import type { CatalogPreviewProduct } from '../../domain/models/CatalogPreviewProduct';
import type { CatalogPreviewRepository } from '../../domain/repositories/CatalogPreviewRepository';

// Illustrative items for visual review; these are not live products or sale prices.
const products: readonly CatalogPreviewProduct[] = [
  { id: 'preview-eucalipto', name: 'Eucalipto', aromaNote: 'Fresco y herbal', priceMinor: 18900, currency: 'MXN', imageKey: 'eucalipto' },
  { id: 'preview-lavanda', name: 'Lavanda', aromaNote: 'Floral y delicado', priceMinor: 19900, currency: 'MXN', imageKey: 'lavanda' },
  { id: 'preview-menta', name: 'Menta', aromaNote: 'Verde y refrescante', priceMinor: 17900, currency: 'MXN', imageKey: 'menta' },
  { id: 'preview-manzanilla', name: 'Manzanilla', aromaNote: 'Suave y ligeramente dulce', priceMinor: 18900, currency: 'MXN', imageKey: 'manzanilla' },
  { id: 'preview-canela', name: 'Canela', aromaNote: 'Cálido y especiado', priceMinor: 17900, currency: 'MXN', imageKey: 'canela' },
  { id: 'preview-rosas', name: 'Rosas', aromaNote: 'Floral y envolvente', priceMinor: 20900, currency: 'MXN', imageKey: 'rosas' },
];

export class LocalPreviewCatalogRepository implements CatalogPreviewRepository {
  read(): readonly CatalogPreviewProduct[] {
    return products;
  }
}
