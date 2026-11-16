import { ApiError } from '../../../core/network/ApiError';
import type { HttpClient } from '../../../core/network/HttpClient';
import type { AuthRequestOptions } from '../domain/repositories/AuthRequestOptions';

export type WaitForAuthApi = (options?: AuthRequestOptions) => Promise<void>;

const WAIT_LIMIT_MS = 90_000;
const PROBE_TIMEOUT_MS = 8_000;
const PROBE_INTERVAL_MS = 3_000;
const READY_TTL_MS = 60_000;
const STARTUP_STATUSES = new Set([502, 503, 504]);

export class AuthApiUnavailableError extends Error {}

function cancelled(): ApiError {
  return new ApiError('Se canceló la conexión con INHALEX.', 'cancelled');
}

function pause(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(cancelled());
      return;
    }

    const cancel = () => {
      clearTimeout(timer);
      reject(cancelled());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', cancel);
      resolve();
    }, ms);

    signal?.addEventListener('abort', cancel, { once: true });
  });
}

function canRetryProbe(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return error.kind === 'timeout' || error.kind === 'network'
    || (error.kind === 'http' && error.status !== null && STARTUP_STATUSES.has(error.status))
    // The proxy can return an HTML startup page without indicating failure in the HTTP status.
    || (error.kind === 'invalid-response' && error.status === 200);
}

/** Wait for the deployed API before sending credentials or asking it to send an email. */
export function createAuthApiReadiness(client: Pick<HttpClient, 'request'>): WaitForAuthApi {
  let lastReadyAt: number | undefined;

  return async ({ signal, onWaitingForApi } = {}) => {
    if (signal?.aborted) throw cancelled();
    const startedAt = performance.now();
    if (lastReadyAt !== undefined && startedAt - lastReadyAt < READY_TTL_MS) return;

    const deadline = startedAt + WAIT_LIMIT_MS;
    onWaitingForApi?.(true);

    try {
      while (performance.now() < deadline) {
        const remainingMs = Math.ceil(deadline - performance.now());
        if (remainingMs <= 0) break;

        let health: unknown;
        try {
          health = await client.request('/health', {
            authenticated: false,
            timeoutMs: Math.min(PROBE_TIMEOUT_MS, remainingMs),
            signal,
          });
        } catch (error) {
          if (error instanceof ApiError && error.kind === 'cancelled') throw error;
          if (!canRetryProbe(error)) throw new AuthApiUnavailableError();
        }

        if (signal?.aborted) throw cancelled();
        if (performance.now() >= deadline) break;
        if (health && typeof health === 'object' && 'status' in health && health.status === 'ok') {
          lastReadyAt = performance.now();
          return;
        }

        const delayMs = Math.min(PROBE_INTERVAL_MS, deadline - performance.now());
        if (delayMs > 0) await pause(delayMs, signal);
      }

      throw new AuthApiUnavailableError();
    } finally {
      onWaitingForApi?.(false);
    }
  };
}
