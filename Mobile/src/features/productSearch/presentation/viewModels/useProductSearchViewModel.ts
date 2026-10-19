import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import type { CatalogProductViewModel } from '@/features/catalog/presentation/viewModels/useCatalogViewModel';
import { PRODUCT_SEARCH_TERM_MAX_LENGTH, type SearchProducts } from '../../domain/useCases/searchProducts';
import { createProductSearchController } from '../state/createProductSearchController';

export function useProductSearchViewModel(searchProducts: SearchProducts) {
  const [controller] = useState(() => createProductSearchController(searchProducts));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => { controller.start(); return controller.stop; }, [controller]);
  const products = useMemo<readonly CatalogProductViewModel[]>(() => state.products.map((product) => {
    const format = (price: number) => `${new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: product.currency,
    }).format(price)} ${product.currency}`;
    return { id: product.id, name: product.name,
      aromaNote: product.aromas.length ? product.aromas.join(' · ') : product.description,
      priceLabel: format(product.price), originalPriceLabel: product.originalPrice === null ? null : format(product.originalPrice),
      image: product.image, inStock: product.inStock };
  }), [state.products]);

  return { ...state, products, maxLength: PRODUCT_SEARCH_TERM_MAX_LENGTH,
    suggestions: ['Lavanda', 'Eucalipto', 'Menta'] as const,
    canSearch: state.query.trim().length > 0 && state.status !== 'loading' && !state.refreshing,
    hasMore: state.status === 'ready' && state.page < state.totalPages,
    setQuery: controller.setQuery, clearQuery: controller.clear,
    search: controller.search, retry: controller.retry, loadMore: controller.loadMore };
}
