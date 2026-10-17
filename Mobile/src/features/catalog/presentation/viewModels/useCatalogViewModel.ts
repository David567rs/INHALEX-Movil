import { useState } from 'react';
import type { CatalogPreviewImageKey } from '../../domain/models/CatalogPreviewProduct';
import type { ReadCatalogPreview } from '../../domain/useCases/readCatalogPreview';

export type CatalogLayout = 'grid' | 'list';

export type CatalogProductViewModel = Readonly<{
  id: string;
  name: string;
  aromaNote: string;
  priceLabel: string;
  imageKey: CatalogPreviewImageKey;
}>;

const priceFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

/** Presentation state for the static design preview, with no API or product actions. */
export function useCatalogViewModel(readPreview: ReadCatalogPreview) {
  const [products] = useState<readonly CatalogProductViewModel[]>(() => readPreview().map((product) => ({
    id: product.id,
    name: product.name,
    aromaNote: product.aromaNote,
    priceLabel: `${priceFormatter.format(product.priceMinor / 100)} ${product.currency}`,
    imageKey: product.imageKey,
  })));
  const [layout, setLayout] = useState<CatalogLayout>('grid');

  return { products, total: products.length, layout, setLayout };
}
