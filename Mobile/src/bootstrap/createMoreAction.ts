import { readEnvironment, type Environment } from '../core/config/environment';
import { HttpClient, type FetchImplementation } from '../core/network/HttpClient';
import { ApiMoreRepository } from '../features/more/data/repositories/ApiMoreRepository';
import { createLoadMoreContent } from '../features/more/domain/useCases/loadMoreContent';

export function createMoreAction(options: { environment?: Environment; fetch?: FetchImplementation } = {}) {
  let client: HttpClient | undefined;
  return createLoadMoreContent(new ApiMoreRepository(() => {
    if (!client) {
      const environment = options.environment ?? readEnvironment();
      client = new HttpClient({ baseUrl: environment.apiUrl, isDevelopment: environment.isDevelopment,
        requestTimeoutMs: environment.requestTimeoutMs, fetch: options.fetch });
    }
    return client;
  }));
}
