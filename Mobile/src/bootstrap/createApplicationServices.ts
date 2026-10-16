import { readEnvironment } from '../core/config/environment';
import type { Environment } from '../core/config/environment';
import { HttpClient } from '../core/network/HttpClient';
import type { AccessTokenProvider, FetchImplementation } from '../core/network/HttpClient';
import { ApiRegistrationRepository } from '../features/auth/data/repositories/ApiRegistrationRepository';
import { RegistrationError } from '../features/auth/domain/errors/RegistrationError';
import { createRegisterUser, type RegisterUser } from '../features/auth/domain/useCases/registerUser';

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
  return Object.freeze({ environment, httpClient, registerUser });
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
