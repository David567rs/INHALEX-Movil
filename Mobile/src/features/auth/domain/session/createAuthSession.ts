import { LoginError } from '../errors/LoginError';
import { SessionError } from '../errors/SessionError';
import type { LoginUser } from '../models/Login';
import type { LoginOptions } from '../repositories/LoginRepository';
import type { SessionTokenStore } from '../storage/SessionTokenStore';
import type { LoginUserAction } from '../useCases/loginUser';
import { isSessionToken, type VerifySessionAction } from '../useCases/verifySession';
import type { LoginForm } from '../validation/loginValidation';
import { AUTH_INITIAL_STATE, type AuthSession, type AuthSessionState } from './AuthSession';

function cancelled(): LoginError {
  return new LoginError('Se canceló el inicio de sesión.', 'cancelled');
}

function storageFailure(): LoginError {
  return new LoginError('No pudimos guardar la sesión de forma segura. No se inició sesión. Inténtalo de nuevo.', 'storage');
}

function publicUser(user: LoginUser): LoginUser {
  return Object.freeze({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
  });
}

/** Coordinates credential restoration and the current session behind public state. */
export function createAuthSession(login: LoginUserAction, store: SessionTokenStore, verifySession: VerifySessionAction): {
  session: AuthSession;
  getAccessToken: () => string | undefined;
} {
  let snapshot: AuthSessionState = AUTH_INITIAL_STATE;
  let accessToken: string | undefined;
  let generation = 0;
  let pendingLogin = false;
  let pendingController: AbortController | null = null;
  let restorationController: AbortController | null = null;
  let pendingRestoration: Promise<void> | null = null;
  let storageTail: Promise<void> = Promise.resolve();
  const listeners = new Set<() => void>();

  function publish(next: AuthSessionState) {
    if (snapshot.status === next.status && snapshot.user === next.user && snapshot.message === next.message) return;
    snapshot = Object.freeze(next);
    for (const listener of [...listeners]) {
      try { listener(); }
      catch { /* Observers cannot turn a committed authentication operation into a failure. */ }
    }
  }

  function clearLocalSession(message: string | null = null, status: 'anonymous' | 'recovery-error' = 'anonymous') {
    accessToken = undefined;
    publish({ status, user: null, message });
  }

  function serializeStorage<T>(operation: () => Promise<T>): Promise<T> {
    const next = storageTail.then(operation);
    storageTail = next.then(() => undefined, () => undefined);
    return next;
  }

  function restorationIsCurrent(controller: AbortController, attempt: number) {
    return !controller.signal.aborted && generation === attempt;
  }

  async function discardSavedToken(controller: AbortController, attempt: number) {
    const isCurrent = () => restorationIsCurrent(controller, attempt);
    try {
      const cleared = await serializeStorage(async () => {
        // A 401 from an obsolete verification must never erase a newer login.
        if (!isCurrent()) return false;
        await store.clear();
        return isCurrent();
      });
      if (cleared && isCurrent()) clearLocalSession('Tu sesión ya no está disponible. Inicia sesión de nuevo.');
    } catch {
      if (isCurrent()) clearLocalSession('No pudimos eliminar la sesión guardada que ya no es válida. Inténtalo de nuevo.', 'recovery-error');
    }
  }

  async function performRestoration(controller: AbortController, attempt: number): Promise<void> {
    const isCurrent = () => restorationIsCurrent(controller, attempt);
    try {
      let token: string | null;
      try {
        token = await serializeStorage(async () => {
          if (!isCurrent()) throw new SessionError('Se canceló la comprobación de sesión.', 'cancelled');
          return store.get();
        });
      } catch {
        if (isCurrent()) clearLocalSession('No pudimos leer tu sesión guardada. Inténtalo de nuevo.', 'recovery-error');
        return;
      }
      if (!isCurrent()) return;
      if (token === null) {
        clearLocalSession();
        return;
      }
      if (!isSessionToken(token)) {
        await discardSavedToken(controller, attempt);
        return;
      }

      const user = await verifySession(token, { signal: controller.signal });
      if (!isCurrent()) return;
      // Only a verified server response can make the saved token available to HTTP.
      accessToken = token;
      restorationController = null;
      publish({ status: 'authenticated', user: publicUser(user), message: null });
    } catch (error) {
      if (!isCurrent()) return;
      if (error instanceof SessionError && error.kind === 'unauthorized') {
        await discardSavedToken(controller, attempt);
        return;
      }
      const message = error instanceof SessionError
        ? error.message
        : 'No pudimos comprobar tu sesión guardada. Inténtalo de nuevo.';
      clearLocalSession(message, 'recovery-error');
    }
  }

  function restore(): Promise<void> {
    // A normal result is final for this runtime. Only an explicit error retry starts again.
    if (pendingLogin || snapshot.status === 'anonymous' || snapshot.status === 'authenticated') return Promise.resolve();
    if (pendingRestoration) return pendingRestoration;
    const attempt = ++generation;
    const controller = new AbortController();
    restorationController = controller;
    accessToken = undefined;
    // Register the shared promise before notifying observers (also handles StrictMode replay).
    const operation = Promise.resolve().then(() => performRestoration(controller, attempt));
    const pending = operation.finally(() => {
      if (pendingRestoration === pending) pendingRestoration = null;
      if (restorationController === controller) restorationController = null;
    });
    pendingRestoration = pending;
    publish(AUTH_INITIAL_STATE);
    return pending;
  }

  async function signIn(form: LoginForm, options?: LoginOptions): Promise<LoginUser> {
    if (options?.signal?.aborted) throw cancelled();
    if (pendingLogin) {
      throw new LoginError('Ya hay un inicio de sesión en curso. Espera a que termine.', 'configuration');
    }
    pendingLogin = true;
    const attempt = ++generation;
    restorationController?.abort();
    restorationController = null;
    if (snapshot.status === 'checking' || snapshot.status === 'recovery-error') clearLocalSession();
    const controller = new AbortController();
    const cancel = () => controller.abort();
    options?.signal?.addEventListener('abort', cancel, { once: true });
    pendingController = controller;
    const isCurrent = () => !controller.signal.aborted && generation === attempt;

    try {
      const result = await login(form, { signal: controller.signal });
      if (!isCurrent()) throw cancelled();
      const user = publicUser(result.user);

      return await serializeStorage(async () => {
        if (!isCurrent()) throw cancelled();
        try {
          await store.set(result.accessToken);
        } catch {
          clearLocalSession();
          // A rejected native write can still have changed storage. Do not publish it.
          try { await store.clear(); }
          catch { /* Keep the session anonymous even when cleanup cannot be confirmed. */ }
          throw storageFailure();
        }

        if (!isCurrent()) {
          clearLocalSession();
          try { await store.clear(); }
          catch {
            throw new LoginError('No se inició sesión, pero no pudimos completar la eliminación segura. Inténtalo de nuevo.', 'storage');
          }
          throw cancelled();
        }

        // Commit after the write and final cancellation check. No await or rollback follows.
        accessToken = result.accessToken;
        pendingController = null;
        publish({ status: 'authenticated', user, message: null });
        return user;
      });
    } catch (error) {
      if (error instanceof LoginError) throw error;
      if (!isCurrent()) throw cancelled();
      throw new LoginError('No pudimos iniciar sesión. Inténtalo de nuevo más tarde.', 'unknown');
    } finally {
      options?.signal?.removeEventListener('abort', cancel);
      if (pendingController === controller) pendingController = null;
      pendingLogin = false;
    }
  }

  async function signOut(): Promise<void> {
    const attempt = ++generation;
    pendingController?.abort();
    restorationController?.abort();
    restorationController = null;
    clearLocalSession();
    try {
      await serializeStorage(() => store.clear());
    } catch {
      const message = 'La sesión está cerrada en esta app, pero no pudimos completar su eliminación segura. Inténtalo de nuevo.';
      // Do not overwrite state belonging to a login that completed after this clear.
      if (generation === attempt) clearLocalSession(message);
      throw new LoginError(message, 'storage');
    }
  }

  const session: AuthSession = Object.freeze({
    restore,
    signIn,
    signOut,
    getSnapshot: () => snapshot,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  });

  return { session, getAccessToken: () => accessToken };
}
