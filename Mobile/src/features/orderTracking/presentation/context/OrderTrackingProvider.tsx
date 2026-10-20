import { createContext, useContext, useEffect, type PropsWithChildren } from 'react';
import type { OrderTrackingController } from '../state/createOrderTrackingController';

const OrderTrackingContext = createContext<OrderTrackingController | null>(null);

export function OrderTrackingProvider({ controller, children }: PropsWithChildren<{ controller: OrderTrackingController }>) {
  useEffect(() => { controller.start(); return controller.stop; }, [controller]);
  return <OrderTrackingContext.Provider value={controller}>{children}</OrderTrackingContext.Provider>;
}

export function useOrderTrackingController() {
  const controller = useContext(OrderTrackingContext);
  if (!controller) throw new Error('OrderTrackingProvider is required.');
  return controller;
}
