import { useEffect, useMemo, useSyncExternalStore } from 'react';
import type { GetProductDetail } from '../../domain/useCases/getProductDetail';
import { createProductDetailController } from '../state/createProductDetailController';

function formatPrice(value: number, currency: string): string {
  return `${new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(value)} ${currency}`;
}

export function useProductDetailViewModel(productId: string, getProduct: GetProductDetail) {
  const controller = useMemo(() => createProductDetailController(productId, getProduct), [productId, getProduct]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => { controller.start(); return controller.stop; }, [controller]);
  const product = useMemo(() => {
    if (!state.product) return null;
    const product = state.product;
    return {
      ...product,
      priceLabel: formatPrice(product.price, product.currency),
      originalPriceLabel: product.originalPrice === null ? null : formatPrice(product.originalPrice, product.currency),
      availabilityLabel: product.inStock ? 'Disponible' : 'Agotado',
    };
  }, [state.product]);
  return { ...state, product, refresh: controller.refresh };
}
