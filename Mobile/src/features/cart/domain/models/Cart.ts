import type { CatalogProduct } from '../../../catalog/domain/models/Catalog';

export type CartItem = Readonly<{
  productId: string;
  quantity: number;
  subtotal: number;
  product: CatalogProduct;
}>;

export type Cart = Readonly<{
  items: readonly CartItem[];
  totalItems: number;
  subtotal: number;
  currency: string;
}>;
