import { createContext, useContext, useEffect, useSyncExternalStore, type PropsWithChildren } from 'react';
import type { FavoritesController } from '../state/createFavoritesController';

const FavoritesContext = createContext<FavoritesController | null>(null);

export function FavoritesProvider({ controller, children }: PropsWithChildren<{ controller: FavoritesController }>) {
  useEffect(() => { controller.start(); return controller.stop; }, [controller]);
  return <FavoritesContext.Provider value={controller}>{children}</FavoritesContext.Provider>;
}

/** A shared public snapshot, with no credential or transport details. */
export function useFavorites() {
  const controller = useContext(FavoritesContext);
  if (!controller) throw new Error('FavoritesProvider is required.');
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  return { ...state, refresh: controller.refresh, add: controller.add, remove: controller.remove };
}
