export type CatalogPreviewImageKey = 'eucalipto' | 'lavanda' | 'menta'
  | 'manzanilla' | 'canela' | 'rosas';

/** Local design sample. Prices and image keys do not define the future API contract. */
export type CatalogPreviewProduct = Readonly<{
  id: string;
  name: string;
  aromaNote: string;
  priceMinor: number;
  currency: 'MXN';
  imageKey: CatalogPreviewImageKey;
}>;
