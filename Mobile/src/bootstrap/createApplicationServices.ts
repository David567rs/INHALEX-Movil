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

/** One current session per app run. Configuration stays lazy; no startup restore. */
export function createApplicationAuthSession(options: Omit<ApplicationServicesOptions, 'getAccessToken'> = {}) {
  let action: LoginUserAction | undefined;
  const runtime = createAuthSession(async (form, requestOptions) => {
    if (!action) {
      try {
        action = createApplicationServices({ ...options, getAccessToken: runtime.getAccessToken }).loginUser;
      } catch {
        throw new LoginError('El acceso no está disponible en este momento. Inténtalo más tarde.', 'configuration');
      }
    }
    return action(form, requestOptions);
  }, createSessionTokenStore());
  return runtime.session;
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
