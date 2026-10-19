import { createContext, useContext, useEffect, useSyncExternalStore, type PropsWithChildren } from 'react';
import type { CartController } from '../state/createCartController';

const CartContext = createContext<CartController | null>(null);

export function CartProvider({ controller, children }: PropsWithChildren<{ controller: CartController }>) {
  useEffect(() => { controller.start(); return controller.stop; }, [controller]);
  return <CartContext.Provider value={controller}>{children}</CartContext.Provider>;
}

export function useCart() {
  const controller = useContext(CartContext);
  if (!controller) throw new Error('CartProvider is required.');
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  return { ...state, refresh: controller.refresh, add: controller.add,
    updateQuantity: controller.updateQuantity, remove: controller.remove };
}
