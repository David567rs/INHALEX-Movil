import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient } from '../../../../core/network/HttpClient';
import { OrderReceiptError } from '../../domain/errors/OrderReceiptError';
import type { ReceiptOrder } from '../../domain/models/OrderReceipt';
import type { OrderReceiptRepository, ReceiptRequestOptions } from '../../domain/repositories/OrderReceiptRepository';
import { normalizeReceiptOrderId } from '../../domain/useCases/orderReceiptActions';
import { invalidOrderReceiptResponse, mapConfirmedReceipt, mapReceiptCollection } from '../mappers/mapOrderReceipt';

function cancelled(): OrderReceiptError { return new OrderReceiptError('Se canceló la operación de recepción.', 'cancelled'); }

function mapError(error: unknown): OrderReceiptError {
  if (error instanceof OrderReceiptError) return error;
  if (error instanceof ApiError) {
    if (error.kind === 'cancelled') return cancelled();
    if (error.kind === 'invalid-response') return invalidOrderReceiptResponse();
    if (error.kind === 'invalid-request') return new OrderReceiptError('La confirmación de recepción no está disponible en este momento.', 'configuration');
    if (error.kind === 'network') return new OrderReceiptError('No pudimos conectar con INHALEX. Revisa tu conexión e inténtalo de nuevo.', 'network');
    if (error.kind === 'timeout') return new OrderReceiptError('La confirmación de recepción tardó demasiado en responder. Verifica tus pedidos antes de volver a confirmar.', 'timeout');
    if (error.status === 401) return new OrderReceiptError('Tu sesión ya no es válida. Inicia sesión para consultar tus pedidos.', 'unauthorized');
    if (error.status === 403) return new OrderReceiptError('No pudimos acceder a la recepción de tus pedidos en este momento.', 'forbidden');
    if (error.status === 404) return new OrderReceiptError('Este pedido ya no está disponible para confirmar. Actualiza la lista.', 'not-found');
    if (error.status === 409) return new OrderReceiptError('El estado de este pedido cambió. Verifica tus pedidos antes de volver a confirmar.', 'conflict');
    if (error.status === 400 || error.status === 422) return new OrderReceiptError('No pudimos confirmar la recepción. Actualiza la lista y selecciona un pedido disponible.', 'invalid-request');
    if (error.status === 429) return new OrderReceiptError('Espera un momento antes de volver a intentar la operación.', 'rate-limit');
    if (error.status !== null && error.status >= 500) return new OrderReceiptError('La confirmación de recepción no está disponible por el momento. Inténtalo más tarde.', 'server');
  }
  return new OrderReceiptError('No pudimos completar la operación de recepción. Inténtalo de nuevo.', 'unknown');
}

export class ApiOrderReceiptRepository implements OrderReceiptRepository {
  constructor(private readonly httpClient: HttpClient) {}

  list(options?: ReceiptRequestOptions): Promise<readonly ReceiptOrder[]> {
    return this.request('/orders/me/receipt-confirmations', 'GET', mapReceiptCollection, options);
  }

  async confirm(orderId: string, options?: ReceiptRequestOptions): Promise<ReceiptOrder> {
    if (options?.signal?.aborted) throw cancelled();
    const normalized = normalizeReceiptOrderId(orderId);
    return this.request(`/orders/${normalized}/receipt/confirm`, 'PATCH', (payload) => mapConfirmedReceipt(payload, normalized), options);
  }

  private async request<T>(path: string, method: 'GET' | 'PATCH', parse: (payload: unknown) => T, options?: ReceiptRequestOptions): Promise<T> {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const payload = await this.httpClient.request(path, { method, authenticated: true, signal: options?.signal });
      if (options?.signal?.aborted) throw cancelled();
      return parse(payload);
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      throw mapError(error);
    }
  }
}
