import { createContext, useContext, useEffect, type PropsWithChildren } from 'react';
import type { NoticesController } from '../state/createNoticesController';

const NoticesContext = createContext<NoticesController | null>(null);
export function NoticesProvider({ controller, children }: PropsWithChildren<{ controller: NoticesController }>) {
  useEffect(() => { controller.start(); return controller.stop; }, [controller]);
  return <NoticesContext.Provider value={controller}>{children}</NoticesContext.Provider>;
}
export function useNoticesController() {
  const controller = useContext(NoticesContext);
  if (!controller) throw new Error('NoticesProvider is required.');
  return controller;
}
