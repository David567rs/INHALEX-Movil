import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient } from '../../../../core/network/HttpClient';
import { NoticesError } from '../../domain/errors/NoticesError';
import type { Notice, NoticeInbox } from '../../domain/models/Notice';
import type { NoticesRepository, NoticesRequestOptions } from '../../domain/repositories/NoticesRepository';
import { normalizeNoticeId } from '../../domain/useCases/noticesActions';
import { invalidNoticesResponse, mapNoticeInbox, mapReadNotice } from '../mappers/mapNotices';

function cancelled(): NoticesError {
  return new NoticesError('Se canceló la consulta de avisos.', 'cancelled');
}

function mapError(error: unknown, markingRead: boolean): NoticesError {
  if (error instanceof NoticesError) return error;
  if (error instanceof ApiError) {
    if (error.kind === 'cancelled') return cancelled();
    if (error.kind === 'invalid-response') return invalidNoticesResponse();
    if (error.kind === 'invalid-request') return new NoticesError('La bandeja de avisos no está disponible en este momento.', 'configuration');
    if (error.kind === 'network') return new NoticesError('No pudimos conectar con INHALEX. Revisa tu conexión e inténtalo de nuevo.', 'network');
    if (error.kind === 'timeout') return new NoticesError('Los avisos tardaron demasiado en responder. Inténtalo de nuevo.', 'timeout');
    if (error.status === 401) return new NoticesError('Tu sesión ya no es válida. Inicia sesión para consultar tus avisos.', 'unauthorized');
    if (error.status === 403) return new NoticesError('No pudimos acceder a tus avisos en este momento.', 'forbidden');
    if (error.status === 404 || markingRead && error.status === 400) {
      return new NoticesError('Ese aviso ya no está disponible. Actualiza tu bandeja.', 'not-found');
    }
    if (error.status === 400 || error.status === 422) return new NoticesError('No pudimos completar la consulta de avisos. Actualiza la bandeja.', 'invalid-request');
    if (error.status === 429) return new NoticesError('Espera un momento antes de volver a consultar tus avisos.', 'rate-limit');
    if (error.status !== null && error.status >= 500) return new NoticesError('Los avisos no están disponibles por el momento. Inténtalo más tarde.', 'server');
  }
  return new NoticesError('No pudimos completar la operación de avisos. Inténtalo de nuevo.', 'unknown');
}

export class ApiNoticesRepository implements NoticesRepository {
  constructor(private readonly httpClient: HttpClient) {}

  list(options?: NoticesRequestOptions): Promise<NoticeInbox> {
    return this.request('/notifications/me', 'GET', mapNoticeInbox, options);
  }

  async markRead(id: string, options?: NoticesRequestOptions): Promise<Notice> {
    if (options?.signal?.aborted) throw cancelled();
    const target = normalizeNoticeId(id);
    return this.request(`/notifications/me/${target}/read`, 'PATCH', (payload) => mapReadNotice(payload, target), options);
  }

  private async request<T>(path: string, method: 'GET' | 'PATCH', parse: (payload: unknown) => T,
    options?: NoticesRequestOptions): Promise<T> {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const payload = await this.httpClient.request(path, { method, authenticated: true, signal: options?.signal });
      if (options?.signal?.aborted) throw cancelled();
      return parse(payload);
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      throw mapError(error, method === 'PATCH');
    }
  }
}
