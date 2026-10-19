import { readEnvironment } from '../core/config/environment';
import type { Environment } from '../core/config/environment';
import { HttpClient } from '../core/network/HttpClient';
import type { AccessTokenProvider, FetchImplementation } from '../core/network/HttpClient';
import { ApiRegistrationRepository } from '../features/auth/data/repositories/ApiRegistrationRepository';
import { RegistrationError } from '../features/auth/domain/errors/RegistrationError';
import { createRegisterUser, type RegisterUser } from '../features/auth/domain/useCases/registerUser';
import { ApiLoginRepository } from '../features/auth/data/repositories/ApiLoginRepository';
import { createSessionTokenStore } from '../features/auth/data/storage/createSessionTokenStore';
import { LoginError } from '../features/auth/domain/errors/LoginError';
import { createAuthSession } from '../features/auth/domain/session/createAuthSession';
import { createLoginUser, type LoginUserAction } from '../features/auth/domain/useCases/loginUser';
import { ApiSessionRepository } from '../features/auth/data/repositories/ApiSessionRepository';
import { SessionError } from '../features/auth/domain/errors/SessionError';
import { createVerifySession } from '../features/auth/domain/useCases/verifySession';
import { ApiFavoritesRepository } from '../features/favorites/data/repositories/ApiFavoritesRepository';
import { FavoritesError } from '../features/favorites/domain/errors/FavoritesError';
import { createFavoritesActions } from '../features/favorites/domain/useCases/createFavoritesActions';
import type { FavoritesActions } from '../features/favorites/domain/repositories/FavoritesRepository';
import { createFavoritesController } from '../features/favorites/presentation/state/createFavoritesController';
import { ApiCartRepository } from '../features/cart/data/repositories/ApiCartRepository';
import { CartError } from '../features/cart/domain/errors/CartError';
import { createCartActions, type CartActions } from '../features/cart/domain/useCases/cartActions';
import { createCartController } from '../features/cart/presentation/state/createCartController';
import { ApiProfileRepository } from '../features/profile/data/repositories/ApiProfileRepository';
import { ProfileError } from '../features/profile/domain/errors/ProfileError';
import { createProfileActions, type ProfileActions } from '../features/profile/domain/useCases/profileActions';
import { createProfileController } from '../features/profile/presentation/state/createProfileController';

export interface ApplicationServicesOptions {
  environment?: Environment;
  fetch?: FetchImplementation;
  getAccessToken?: AccessTokenProvider;
}

/** The UI receives domain operations; concrete dependencies are composed here. */
export function createApplicationServices(options: ApplicationServicesOptions = {}) {
  const environment = options.environment ?? readEnvironment();
  const httpClient = new HttpClient({
    baseUrl: environment.apiUrl,
    isDevelopment: environment.isDevelopment,
    requestTimeoutMs: environment.requestTimeoutMs,
    fetch: options.fetch,
    getAccessToken: options.getAccessToken,
  });
  const registerUser = createRegisterUser(new ApiRegistrationRepository(httpClient));
  const loginUser = createLoginUser(new ApiLoginRepository(httpClient));
  return Object.freeze({ environment, httpClient, registerUser, loginUser });
}

/** Lazy API composition: an empty store never needs environment configuration or HTTP. */
function createApplicationAuthRuntime(options: Omit<ApplicationServicesOptions, 'getAccessToken'> = {}) {
  let action: LoginUserAction | undefined;
  const verifySession = createVerifySession(new ApiSessionRepository((token) => {
    try {
      const environment = options.environment ?? readEnvironment();
      // This candidate is used only to validate /me; the running session is still anonymous.
      return new HttpClient({
        baseUrl: environment.apiUrl,
        isDevelopment: environment.isDevelopment,
        requestTimeoutMs: environment.requestTimeoutMs,
        fetch: options.fetch,
        getAccessToken: () => token,
      });
    } catch {
      throw new SessionError('La comprobación de sesión no está disponible en este momento. Inténtalo más tarde.', 'configuration');
    }
  }));
  const runtime = createAuthSession(async (form, requestOptions) => {
    if (!action) {
      try {
        action = createApplicationServices({ ...options, getAccessToken: runtime.getAccessToken }).loginUser;
      } catch {
        throw new LoginError('El acceso no está disponible en este momento. Inténtalo más tarde.', 'configuration');
      }
    }
    return action(form, requestOptions);
  }, createSessionTokenStore(), verifySession);
  return runtime;
}

export function createApplicationAuthSession(options: Omit<ApplicationServicesOptions, 'getAccessToken'> = {}) {
  return createApplicationAuthRuntime(options).session;
}

/** The public session and personal collections share one private credential source. */
export function createApplicationRuntime(options: Omit<ApplicationServicesOptions, 'getAccessToken'> = {}) {
  const auth = createApplicationAuthRuntime(options);
  let actions: FavoritesActions | undefined;
  function favoritesActions(): FavoritesActions {
    if (!actions) {
      try {
        const environment = options.environment ?? readEnvironment();
        const client = new HttpClient({
          baseUrl: environment.apiUrl,
          isDevelopment: environment.isDevelopment,
          requestTimeoutMs: environment.requestTimeoutMs,
          fetch: options.fetch,
          getAccessToken: auth.getAccessToken,
        });
        actions = createFavoritesActions(new ApiFavoritesRepository(client));
      } catch {
        throw new FavoritesError('Favoritos no está disponible en este momento. Inténtalo más tarde.', 'configuration');
      }
    }
    return actions;
  }
  const favorites = createFavoritesController(auth.authorizationSession, {
    list: async (requestOptions) => favoritesActions().list(requestOptions),
    add: async (id, requestOptions) => favoritesActions().add(id, requestOptions),
    remove: async (id, requestOptions) => favoritesActions().remove(id, requestOptions),
  });
  let cartActions: CartActions | undefined;
  function getCartActions(): CartActions {
    if (!cartActions) {
      try {
        const environment = options.environment ?? readEnvironment();
        cartActions = createCartActions(new ApiCartRepository(new HttpClient({
          baseUrl: environment.apiUrl, isDevelopment: environment.isDevelopment,
          requestTimeoutMs: environment.requestTimeoutMs, fetch: options.fetch,
          getAccessToken: auth.getAccessToken,
        })));
      } catch {
        throw new CartError('La bolsa no está disponible en este momento. Inténtalo más tarde.', 'configuration');
      }
    }
    return cartActions;
  }
  const cart = createCartController(auth.authorizationSession, {
    list: async (requestOptions) => getCartActions().list(requestOptions),
    add: async (id, quantity, requestOptions) => getCartActions().add(id, quantity, requestOptions),
    updateQuantity: async (id, quantity, requestOptions) => getCartActions().updateQuantity(id, quantity, requestOptions),
    remove: async (id, requestOptions) => getCartActions().remove(id, requestOptions),
  });
  let profileActions: ProfileActions | undefined;
  function getProfileActions(): ProfileActions {
    if (!profileActions) {
      try {
        const environment = options.environment ?? readEnvironment();
        profileActions = createProfileActions(new ApiProfileRepository(new HttpClient({
          baseUrl: environment.apiUrl, isDevelopment: environment.isDevelopment,
          requestTimeoutMs: environment.requestTimeoutMs, fetch: options.fetch,
          getAccessToken: auth.getAccessToken,
        })));
      } catch {
        throw new ProfileError('El perfil no está disponible en este momento. Inténtalo más tarde.', 'configuration');
      }
    }
    return profileActions;
  }
  const profile = createProfileController(auth.session, {
    get: async (requestOptions) => getProfileActions().get(requestOptions),
    update: async (draft, requestOptions) => getProfileActions().update(draft, requestOptions),
  }, auth.updatePublicUser);
  // No transport or credential is exposed to the React tree.
  return Object.freeze({ session: auth.session, favorites, cart, profile });
}

/** Defer configuration until submission so navigation never depends on the API. */
export function createRegistrationAction(options: ApplicationServicesOptions = {}): RegisterUser {
  let action: RegisterUser | undefined;
  return async (form, requestOptions) => {
    if (!action) {
      try {
        action = createApplicationServices(options).registerUser;
      } catch {
        throw new RegistrationError('El registro no está disponible en este momento. Inténtalo más tarde.', 'configuration');
      }
    }
    return action(form, requestOptions);
  };
}
