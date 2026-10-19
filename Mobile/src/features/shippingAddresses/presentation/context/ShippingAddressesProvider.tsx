import { createContext, useContext, useEffect, useSyncExternalStore, type PropsWithChildren } from 'react';
import type { ShippingAddressesController } from '../state/createShippingAddressesController';

const ShippingAddressesContext = createContext<ShippingAddressesController | null>(null);

export function ShippingAddressesProvider({ controller, children }: PropsWithChildren<{ controller: ShippingAddressesController }>) {
  useEffect(() => { controller.start(); return controller.stop; }, [controller]);
  return <ShippingAddressesContext.Provider value={controller}>{children}</ShippingAddressesContext.Provider>;
}

/** Presentation receives one shared personal collection and domain actions, never credentials. */
export function useShippingAddresses() {
  const controller = useContext(ShippingAddressesContext);
  if (!controller) throw new Error('ShippingAddressesProvider is required.');
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  return { ...state, refresh: controller.refresh, openCreate: controller.openCreate, openEdit: controller.openEdit,
    updateField: controller.updateField, toggleDefault: controller.toggleDefault, cancelForm: controller.cancelForm,
    save: controller.save, select: controller.select, remove: controller.remove, dismissConfirmation: controller.dismissConfirmation };
}
