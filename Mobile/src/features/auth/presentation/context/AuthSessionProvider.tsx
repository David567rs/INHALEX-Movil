import { createContext, useContext, useSyncExternalStore, type PropsWithChildren } from 'react';
import type { AuthSession } from '../../domain/session/AuthSession';

const AuthSessionContext = createContext<AuthSession | null>(null);
const anonymousServerSnapshot = () => null;

export function AuthSessionProvider({ session, children }: PropsWithChildren<{ session: AuthSession }>) {
  return <AuthSessionContext.Provider value={session}>{children}</AuthSessionContext.Provider>;
}

/** Presentation sees only the public user and domain actions, never the JWT. */
export function useAuthSession() {
  const session = useContext(AuthSessionContext);
  if (!session) throw new Error('AuthSessionProvider is required.');
  const user = useSyncExternalStore(session.subscribe, session.getSnapshot, anonymousServerSnapshot);
  return { user, signIn: session.signIn, signOut: session.signOut };
}
