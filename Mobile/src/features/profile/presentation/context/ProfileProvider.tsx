import { createContext, useContext, useEffect, useSyncExternalStore, type PropsWithChildren } from 'react';
import type { ProfileController } from '../state/createProfileController';

const ProfileContext = createContext<ProfileController | null>(null);

export function ProfileProvider({ controller, children }: PropsWithChildren<{ controller: ProfileController }>) {
  useEffect(() => { controller.start(); return controller.stop; }, [controller]);
  return <ProfileContext.Provider value={controller}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const controller = useContext(ProfileContext);
  if (!controller) throw new Error('ProfileProvider is required.');
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  return { ...state, refresh: controller.refresh, beginEdit: controller.beginEdit,
    cancelEdit: controller.cancelEdit, updateField: controller.updateField, save: controller.save };
}
