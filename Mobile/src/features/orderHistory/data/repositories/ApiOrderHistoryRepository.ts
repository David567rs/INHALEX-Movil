import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient } from '../../../../core/network/HttpClient';
import { OrderHistoryError } from '../../domain/errors/OrderHistoryError';
import type { OrderHistoryDetail, OrderHistoryPage } from '../../domain/models/OrderHistory';
import type { OrderHistoryRepository, OrderHistoryRequestOptions } from '../../domain/repositories/OrderHistoryRepository';
import { normalizeOrderHistoryCursor, normalizeOrderHistoryId } from '../../domain/useCases/orderHistoryActions';
import { invalidOrderHistoryResponse, mapOrderHistoryDetail, mapOrderHistoryPage } from '../mappers/mapOrderHistory';

function cancelled(): OrderHistoryError {
  return new OrderHistoryError('Se canceló la consulta del historial.', 'cancelled');
}

function mapError(error: unknown): OrderHistoryError {
  if (error instanceof OrderHistoryError) return error;
  if (error instanceof ApiError) {
    if (error.kind === 'cancelled') return cancelled();
    if (error.kind === 'invalid-response') return invalidOrderHistoryResponse();
    if (error.kind === 'invalid-request') return new OrderHistoryError('El historial no está disponible en este momento.', 'configuration');
    if (error.kind === 'network') return new OrderHistoryError('No pudimos conectar con INHALEX. Revisa tu conexión y vuelve a intentarlo.', 'network');
    if (error.kind === 'timeout') return new OrderHistoryError('El historial tardó demasiado en responder. Inténtalo de nuevo.', 'timeout');
    if (error.status === 401) return new OrderHistoryError('Tu sesión ya no es válida. Inicia sesión para consultar tus pedidos.', 'unauthorized');
    if (error.status === 403) return new OrderHistoryError('No pudimos acceder a tu historial en este momento.', 'forbidden');
    if (error.status === 404) return new OrderHistoryError('No encontramos ese pedido en tu cuenta. Actualiza el historial.', 'not-found');
    if (error.status === 400 || error.status === 422) return new OrderHistoryError('No pudimos completar esa consulta. Actualiza tu historial.', 'invalid-request');
    if (error.status === 429) return new OrderHistoryError('Espera un momento antes de volver a consultar tus pedidos.', 'rate-limit');
    if (error.status !== null && error.status >= 500) return new OrderHistoryError('El historial no está disponible por el momento. Inténtalo más tarde.', 'server');
  }
  return new OrderHistoryError('No pudimos consultar tu historial. Inténtalo de nuevo más tarde.', 'unknown');
}

export class ApiOrderHistoryRepository implements OrderHistoryRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async list(cursor?: string, options?: OrderHistoryRequestOptions): Promise<OrderHistoryPage> {
    if (options?.signal?.aborted) throw cancelled();
    const position = normalizeOrderHistoryCursor(cursor);
    const path = position === undefined ? '/orders/me' : `/orders/me?cursor=${encodeURIComponent(position)}`;
    const page = await this.request(path, mapOrderHistoryPage, options);
    if (position !== undefined && page.nextCursor === position) throw invalidOrderHistoryResponse();
    return page;
  }

  async get(id: string, options?: OrderHistoryRequestOptions): Promise<OrderHistoryDetail> {
    if (options?.signal?.aborted) throw cancelled();
    const target = normalizeOrderHistoryId(id);
    return this.request(`/orders/me/${target}`, (payload) => mapOrderHistoryDetail(payload, target), options);
  }

  private async request<T>(path: string, parse: (payload: unknown) => T, options?: OrderHistoryRequestOptions): Promise<T> {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const payload = await this.httpClient.request(path, {
        method: 'GET', authenticated: true, signal: options?.signal,
      });
      if (options?.signal?.aborted) throw cancelled();
      return parse(payload);
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      throw mapError(error);
    }
  }
}
