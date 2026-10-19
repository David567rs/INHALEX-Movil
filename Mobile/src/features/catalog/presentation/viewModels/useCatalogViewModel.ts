import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { ListCatalog } from '../../domain/useCases/listCatalog';
import type { CatalogProduct } from '../../domain/models/Catalog';
import { createCatalogController } from '../state/createCatalogController';

export type CatalogLayout = 'grid' | 'list';

export type CatalogProductViewModel = Readonly<{
  id: string;
  name: string;
  aromaNote: string;
  priceLabel: string;
  originalPriceLabel: string | null;
  image: string | null;
  inStock: boolean;
}>;

function priceLabel(price: number, currency: string) {
  return `${new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(price)} ${currency}`;
}

export function useCatalogViewModel(listCatalog: ListCatalog, onSelectProduct?: (product: CatalogProduct) => void) {
  const [controller] = useState(() => createCatalogController(listCatalog));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => { controller.start(); return controller.stop; }, [controller]);
  const products = useMemo<readonly CatalogProductViewModel[]>(() => state.products.map((product) => ({
    id: product.id,
    name: product.name,
    aromaNote: product.aromas.length ? product.aromas.join(' · ') : product.description,
    priceLabel: priceLabel(product.price, product.currency),
    originalPriceLabel: product.originalPrice === null ? null : priceLabel(product.originalPrice, product.currency),
    image: product.image,
    inStock: product.inStock,
  })), [state.products]);
  const [layout, setLayout] = useState<CatalogLayout>('grid');

  return { ...state, products, layout, setLayout, refresh: controller.refresh,
    loadMore: controller.loadMore, hasMore: state.page < state.totalPages,
    openProduct(id: string) {
      const product = controller.getSnapshot().products.find((item) => item.id === id);
      if (product) onSelectProduct?.(product);
    } };
}
