import { createContext, useContext, useEffect, useSyncExternalStore, type PropsWithChildren } from 'react';
import type { AuthSession } from '../../domain/session/AuthSession';
import { AUTH_INITIAL_STATE } from '../../domain/session/AuthSession';

const AuthSessionContext = createContext<AuthSession | null>(null);
const serverSnapshot = () => AUTH_INITIAL_STATE;

export function AuthSessionProvider({ session, children }: PropsWithChildren<{ session: AuthSession }>) {
  // The runtime owns this idempotent operation; unmounting a consumer only unsubscribes.
  useEffect(() => { void session.restore(); }, [session]);
  return <AuthSessionContext.Provider value={session}>{children}</AuthSessionContext.Provider>;
}

/** Presentation sees only the public user and domain actions, never the JWT. */
export function useAuthSession() {
  const session = useContext(AuthSessionContext);
  if (!session) throw new Error('AuthSessionProvider is required.');
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot, serverSnapshot);
  return { ...state, signIn: session.signIn, signOut: session.signOut, restore: session.restore };
}
