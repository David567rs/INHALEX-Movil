import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient } from '../../../../core/network/HttpClient';
import { OrderHistoryError } from '../../../orderHistory/domain/errors/OrderHistoryError';
import { mapOrderHistoryDetail } from '../../../orderHistory/data/mappers/mapOrderHistory';
import { OrderTrackingError } from '../../domain/errors/OrderTrackingError';
import type { OrderTracking } from '../../domain/models/OrderTracking';
import type { OrderTrackingRepository, OrderTrackingRequestOptions } from '../../domain/repositories/OrderTrackingRepository';
import { normalizeOrderTrackingId } from '../../domain/useCases/orderTrackingActions';
import { invalidOrderTrackingResponse, mapOrderTracking } from '../mappers/mapOrderTracking';

function cancelled(): OrderTrackingError {
  return new OrderTrackingError('Se canceló la consulta del seguimiento.', 'cancelled');
}

function mapError(error: unknown): OrderTrackingError {
  if (error instanceof OrderTrackingError) return error;
  if (error instanceof OrderHistoryError) return invalidOrderTrackingResponse();
  if (error instanceof ApiError) {
    if (error.kind === 'cancelled') return cancelled();
    if (error.kind === 'invalid-response') return invalidOrderTrackingResponse();
    if (error.kind === 'invalid-request') return new OrderTrackingError('El seguimiento no está disponible en este momento.', 'configuration');
    if (error.kind === 'network') return new OrderTrackingError('No pudimos conectar con INHALEX. Revisa tu conexión e inténtalo de nuevo.', 'network');
    if (error.kind === 'timeout') return new OrderTrackingError('El seguimiento tardó demasiado en responder. Inténtalo de nuevo.', 'timeout');
    if (error.status === 401) return new OrderTrackingError('Tu sesión ya no es válida. Inicia sesión para consultar el seguimiento.', 'unauthorized');
    if (error.status === 403) return new OrderTrackingError('No pudimos acceder al seguimiento en este momento.', 'forbidden');
    if (error.status === 404) return new OrderTrackingError('No encontramos ese pedido en tu cuenta. Vuelve a tu historial.', 'not-found');
    if (error.status === 400 || error.status === 422) return new OrderTrackingError('No pudimos completar la consulta. Vuelve a seleccionar el pedido.', 'invalid-request');
    if (error.status === 429) return new OrderTrackingError('Espera un momento antes de volver a consultar el seguimiento.', 'rate-limit');
    if (error.status !== null && error.status >= 500) return new OrderTrackingError('El seguimiento no está disponible por el momento. Inténtalo más tarde.', 'server');
  }
  return new OrderTrackingError('No pudimos consultar el seguimiento. Inténtalo de nuevo.', 'unknown');
}

export class ApiOrderTrackingRepository implements OrderTrackingRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async get(id: string, options?: OrderTrackingRequestOptions): Promise<OrderTracking> {
    if (options?.signal?.aborted) throw cancelled();
    const target = normalizeOrderTrackingId(id);
    // Read tracking last so its status, rather than a preceding detail snapshot, is authoritative.
    const detail = await this.request(`/orders/me/${target}`, (payload) => mapOrderHistoryDetail(payload, target), options);
    return this.request(`/orders/me/${target}/tracking`, (payload) => mapOrderTracking(payload, detail), options);
  }

  private async request<T>(path: string, parse: (payload: unknown) => T, options?: OrderTrackingRequestOptions): Promise<T> {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const payload = await this.httpClient.request(path, { method: 'GET', authenticated: true, signal: options?.signal });
      if (options?.signal?.aborted) throw cancelled();
      return parse(payload);
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      throw mapError(error);
    }
  }
}
