import { LoginError } from '../errors/LoginError';
import type { LoginUser } from '../models/Login';
import type { LoginOptions } from '../repositories/LoginRepository';
import type { SessionTokenStore } from '../storage/SessionTokenStore';
import type { LoginUserAction } from '../useCases/loginUser';
import type { LoginForm } from '../validation/loginValidation';
import type { AuthSession } from './AuthSession';

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

/** Coordinates one running session without reading or restoring stored credentials. */
export function createAuthSession(login: LoginUserAction, store: SessionTokenStore): {
  session: AuthSession;
  getAccessToken: () => string | undefined;
} {
  let snapshot: LoginUser | null = null;
  let accessToken: string | undefined;
  let generation = 0;
  let pendingLogin = false;
  let pendingController: AbortController | null = null;
  let storageTail: Promise<void> = Promise.resolve();
  const listeners = new Set<() => void>();

  function publish(next: LoginUser | null) {
    if (snapshot === next) return;
    snapshot = next;
    for (const listener of [...listeners]) {
      try { listener(); }
      catch { /* Observers cannot turn a committed authentication operation into a failure. */ }
    }
  }

  function clearLocalSession() {
    accessToken = undefined;
    publish(null);
  }

  function serializeStorage<T>(operation: () => Promise<T>): Promise<T> {
    const next = storageTail.then(operation);
    storageTail = next.then(() => undefined, () => undefined);
    return next;
  }

  async function signIn(form: LoginForm, options?: LoginOptions): Promise<LoginUser> {
    if (options?.signal?.aborted) throw cancelled();
    if (pendingLogin) {
      throw new LoginError('Ya hay un inicio de sesión en curso. Espera a que termine.', 'configuration');
    }
    pendingLogin = true;
    const attempt = ++generation;
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
        publish(user);
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
    ++generation;
    pendingController?.abort();
    clearLocalSession();
    try {
      await serializeStorage(() => store.clear());
    } catch {
      throw new LoginError('La sesión está cerrada en esta app, pero no pudimos completar su eliminación segura. Inténtalo de nuevo.', 'storage');
    }
  }

  const session: AuthSession = Object.freeze({
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
