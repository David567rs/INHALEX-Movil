import { createContext, useContext, useEffect, useSyncExternalStore, type PropsWithChildren } from 'react';
import type { AccountDeletionController } from '../state/createAccountDeletionController';
const Context = createContext<AccountDeletionController | null>(null);
export function AccountDeletionProvider({ controller, children }: PropsWithChildren<{ controller: AccountDeletionController }>) {
  useEffect(() => { controller.start(); return controller.stop; }, [controller]);
  return <Context.Provider value={controller}>{children}</Context.Provider>;
}
export function useAccountDeletion() {
  const controller = useContext(Context);
  if (!controller) throw new Error('AccountDeletionProvider is required');
  return { ...useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot), refresh: controller.refresh, submit: controller.submit };
}
