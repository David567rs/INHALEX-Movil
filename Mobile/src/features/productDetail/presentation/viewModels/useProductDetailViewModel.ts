import { useMemo } from 'react';
import type { GetProductDetailPreview } from '../../domain/useCases/getProductDetailPreview';

function formatPrice(value: number, currency: string): string {
  return `${new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(value)} ${currency}`;
}

export function useProductDetailViewModel(productId: string, readProduct: GetProductDetailPreview) {
  return useMemo(() => {
    const product = readProduct(productId);
    if (!product) return { product: null };
    return {
      product: {
        ...product,
        priceLabel: formatPrice(product.price, product.currency),
        originalPriceLabel: product.originalPrice === null ? null : formatPrice(product.originalPrice, product.currency),
        availabilityLabel: product.inStock ? 'Disponible' : 'Agotado',
      },
    };
  }, [productId, readProduct]);
}
