import type { Cart } from '../models/Cart';

export interface CartRequestOptions {
  signal?: AbortSignal;
}

export interface CartActions {
  list(options?: CartRequestOptions): Promise<Cart>;
  add(productId: string, quantity: number, options?: CartRequestOptions): Promise<Cart>;
  updateQuantity(productId: string, quantity: number, options?: CartRequestOptions): Promise<Cart>;
  remove(productId: string, options?: CartRequestOptions): Promise<Cart>;
}

export type CartRepository = CartActions;
