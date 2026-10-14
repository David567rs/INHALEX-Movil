import { readEnvironment } from '../core/config/environment';
import type { Environment } from '../core/config/environment';
import { HttpClient } from '../core/network/HttpClient';
import type { AccessTokenProvider, FetchImplementation } from '../core/network/HttpClient';

export interface ApplicationServicesOptions {
  environment?: Environment;
  fetch?: FetchImplementation;
  getAccessToken?: AccessTokenProvider;
}

/** Future repository factories belong here; the UI will receive domain contracts. */
export function createApplicationServices(options: ApplicationServicesOptions = {}) {
  const environment = options.environment ?? readEnvironment();
  const httpClient = new HttpClient({
    baseUrl: environment.apiUrl,
    isDevelopment: environment.isDevelopment,
    requestTimeoutMs: environment.requestTimeoutMs,
    fetch: options.fetch,
    getAccessToken: options.getAccessToken,
  });
  return Object.freeze({ environment, httpClient });
}
