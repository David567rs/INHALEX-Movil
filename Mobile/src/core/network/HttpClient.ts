import { resolveApiUrl } from '../config/resolveApiUrl';
import { ApiError } from './ApiError';

export type FetchImplementation = (url: string, init: RequestInit) => Promise<Response>;
export type AccessTokenProvider = () => string | null | undefined
  | Promise<string | null | undefined>;

export interface HttpClientOptions {
  baseUrl: string;
  isDevelopment?: boolean;
  requestTimeoutMs?: number;
  fetch?: FetchImplementation;
  getAccessToken?: AccessTokenProvider;
}

export interface HttpRequestOptions<T = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  authenticated?: boolean;
  /** A data adapter can validate its DTO and return the mapped result. */
  parse?: (payload: unknown) => T;
}

function waitWithAbort<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new Error('Request aborted'));
    if (signal.aborted) {
      // Observe rejection even if the caller cancelled before this operation began.
      operation.catch(() => undefined);
      onAbort();
      return;
    }
    signal.addEventListener('abort', onAbort, { once: true });
    operation.then(
      (value) => { signal.removeEventListener('abort', onAbort); resolve(value); },
      (error: unknown) => { signal.removeEventListener('abort', onAbort); reject(error); },
    );
  });
}

function fallbackForStatus(status: number): string {
  if (status === 401) return 'Tu sesión no es válida. Inicia sesión para continuar.';
  if (status === 403) return 'No tienes permiso para realizar esta operación.';
  if (status >= 500) return 'INHALEX no pudo completar la solicitud. Intenta de nuevo más tarde.';
  return 'No se pudo completar la solicitud.';
}

function messageFromPayload(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object' || !('message' in payload)) return fallback;
  const value = payload.message;
  if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 1_000);
  if (Array.isArray(value) && value.length > 0
    && value.every((item) => typeof item === 'string' && item.trim())) {
    return value.join('. ').slice(0, 1_000);
  }
  return fallback;
}

function requestUrl(baseUrl: string, path: string): string {
  try {
    const pathname = decodeURIComponent(path.split('?')[0]);
    if (!path.startsWith('/') || path.startsWith('//') || /[\\#\r\n]/.test(path)
      || pathname.includes('\\') || pathname.startsWith('//')
      || pathname.split('/').some((part) => part === '.' || part === '..')) throw new Error();
    const url = new URL(`${baseUrl}${path}`);
    if (url.origin !== new URL(baseUrl).origin) throw new Error();
    return url.toString();
  } catch {
    throw new ApiError('La ruta de la API no es válida.', 'invalid-request');
  }
}

/** Transport only. Domain models and repositories do not depend on this class. */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImplementation: FetchImplementation;
  private readonly getAccessToken?: AccessTokenProvider;

  constructor(options: HttpClientOptions) {
    this.baseUrl = resolveApiUrl(options.baseUrl, {
      isDevelopment: options.isDevelopment ?? false,
      platform: 'transport',
    }).apiUrl;
    this.timeoutMs = options.requestTimeoutMs ?? 15_000;
    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs <= 0) {
      throw new ApiError('El tiempo máximo de la solicitud debe ser un entero positivo.', 'invalid-request');
    }
    this.fetchImplementation = options.fetch ?? ((url, init) => globalThis.fetch(url, init));
    this.getAccessToken = options.getAccessToken;
  }

  async request<T = unknown>(path: string, options: HttpRequestOptions<T> = {}): Promise<T> {
    const url = requestUrl(this.baseUrl, path);
    const hasBody = options.body !== undefined;
    const method = options.method ?? 'GET';
    let body: string | undefined;
    try {
      if (hasBody && method === 'GET') throw new Error();
      if (hasBody) {
        body = JSON.stringify(options.body);
        if (body === undefined) throw new Error();
      }
    } catch {
      throw new ApiError('La solicitud contiene un cuerpo JSON no válido.', 'invalid-request');
    }

    const controller = new AbortController();
    let timedOut = false;
    const cancel = () => controller.abort();
    if (options.signal?.aborted) controller.abort();
    else options.signal?.addEventListener('abort', cancel, { once: true });
    const timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, this.timeoutMs);

    try {
      if (controller.signal.aborted) throw new Error('Request aborted');
      const token = options.authenticated === false || !this.getAccessToken
        ? undefined
        : await waitWithAbort(Promise.resolve(this.getAccessToken()), controller.signal);
      if (token !== undefined && token !== null && (typeof token !== 'string' || /\s/.test(token))) {
        throw new ApiError('La sesión no contiene un token válido.', 'invalid-request');
      }
      if (controller.signal.aborted) throw new Error('Request aborted');

      const response = await waitWithAbort(this.fetchImplementation(url, {
        method,
        headers: {
          Accept: 'application/json',
          ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body,
        signal: controller.signal,
        // Request redirect blocking from the selected transport. Expo 57 uses expo/fetch
        // by default; the opt-in React Native polyfill ignores this option.
        redirect: 'error',
        credentials: 'omit',
      }), controller.signal);

      // Validate the received result as well. This check happens after the request;
      // it cannot prevent credentials already sent by a transport that followed a redirect.
      if (response.url) {
        let validOrigin = false;
        try { validOrigin = new URL(response.url).origin === new URL(url).origin; }
        catch { /* Reject malformed transport metadata without echoing its value. */ }
        if (!validOrigin) {
          throw new ApiError('La API respondió desde un origen no esperado.', 'invalid-response', response.status);
        }
      }

      const isJson = /^application\/(?:[\w.+-]+\+)?json(?:\s*;|$)/i
        .test(response.headers.get('content-type') ?? '');
      if (!response.ok) {
        let payload: unknown;
        if (isJson) {
          try { payload = await waitWithAbort(response.json(), controller.signal); }
          catch (error) { if (controller.signal.aborted) throw error; }
        }
        const fallback = fallbackForStatus(response.status);
        const message = response.status === 401 || response.status === 403 || response.status >= 500
          ? fallback : messageFromPayload(payload, fallback);
        throw new ApiError(message, 'http', response.status);
      }
      if (response.status === 204) return undefined as T;
      if (!isJson) {
        throw new ApiError('La API devolvió una respuesta que no es JSON.', 'invalid-response', response.status);
      }

      let payload: unknown;
      try { payload = await waitWithAbort(response.json(), controller.signal); }
      catch (error) {
        if (controller.signal.aborted) throw error;
        throw new ApiError('La API devolvió JSON no válido.', 'invalid-response', response.status);
      }
      if (!options.parse) return payload as T;
      try { return options.parse(payload); }
      catch {
        throw new ApiError('La respuesta de la API no tiene el formato esperado.', 'invalid-response', response.status);
      }
    } catch (error) {
      if (controller.signal.aborted) {
        throw new ApiError(
          timedOut ? 'La solicitud tardó demasiado. Intenta de nuevo.' : 'La solicitud fue cancelada.',
          timedOut ? 'timeout' : 'cancelled', null, error,
        );
      }
      if (error instanceof ApiError) throw error;
      throw new ApiError('No se pudo conectar con INHALEX. Revisa tu conexión e intenta de nuevo.', 'network', null, error);
    } finally {
      clearTimeout(timeoutId);
      options.signal?.removeEventListener('abort', cancel);
    }
  }
}
