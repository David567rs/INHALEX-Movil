import { createContext, useContext, useEffect, type PropsWithChildren } from 'react';
import type { OrderCreationController } from '../state/createOrderCreationController';

const OrderCreationContext = createContext<OrderCreationController | null>(null);

export function OrderCreationProvider({ controller, children }: PropsWithChildren<{ controller: OrderCreationController }>) {
  useEffect(() => { controller.start(); return controller.stop; }, [controller]);
  return <OrderCreationContext.Provider value={controller}>{children}</OrderCreationContext.Provider>;
}

export function useOrderCreationController() {
  const controller = useContext(OrderCreationContext);
  if (!controller) throw new Error('OrderCreationProvider is required.');
  return controller;
}
