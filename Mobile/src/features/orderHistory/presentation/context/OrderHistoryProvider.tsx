import { createContext, useContext, useEffect, type PropsWithChildren } from 'react';
import type { OrderHistoryController } from '../state/createOrderHistoryController';

const OrderHistoryContext = createContext<OrderHistoryController | null>(null);

export function OrderHistoryProvider({ controller, children }: PropsWithChildren<{ controller: OrderHistoryController }>) {
  useEffect(() => { controller.start(); return controller.stop; }, [controller]);
  return <OrderHistoryContext.Provider value={controller}>{children}</OrderHistoryContext.Provider>;
}

export function useOrderHistoryController() {
  const controller = useContext(OrderHistoryContext);
  if (!controller) throw new Error('OrderHistoryProvider is required.');
  return controller;
}
