import { createContext, useContext, useEffect, type PropsWithChildren } from 'react';
import type { OrderReceiptController } from '../state/createOrderReceiptController';

const OrderReceiptContext = createContext<OrderReceiptController | null>(null);
export function OrderReceiptProvider({ controller, children }: PropsWithChildren<{ controller: OrderReceiptController }>) {
  useEffect(() => { controller.start(); return controller.stop; }, [controller]);
  return <OrderReceiptContext.Provider value={controller}>{children}</OrderReceiptContext.Provider>;
}
export function useOrderReceiptController() {
  const controller = useContext(OrderReceiptContext);
  if (!controller) throw new Error('OrderReceiptProvider is required.');
  return controller;
}
