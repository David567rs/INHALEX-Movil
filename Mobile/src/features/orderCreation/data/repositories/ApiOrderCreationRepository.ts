import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient } from '../../../../core/network/HttpClient';
import { mapCart } from '../../../cart/data/mappers/mapCart';
import type { Cart } from '../../../cart/domain/models/Cart';
import type { CartRepository } from '../../../cart/domain/repositories/CartRepository';
import type { ProfileRepository } from '../../../profile/domain/repositories/ProfileRepository';
import type { ShippingAddressRepository } from '../../../shippingAddresses/domain/repositories/ShippingAddressRepository';
import { OrderCreationError } from '../../domain/errors/OrderCreationError';
import type { OrderConfirmation, OrderConfirmInput, OrderContext, OrderItemInput, OrderQuote } from '../../domain/models/OrderCreation';
import type { OrderCreationRepository, OrderCreationRequestOptions } from '../../domain/repositories/OrderCreationRepository';
import { isOrderIdempotencyKey, normalizeOrderConfirmInput, normalizeOrderItems } from '../../domain/validation/orderCreationValidation';
import { invalidOrderResponse, mapOrderConfirmation, mapOrderQuote } from '../mappers/mapOrderCreation';

export interface OrderCreationSources {
  cart: Pick<CartRepository, 'list'>;
  addresses: Pick<ShippingAddressRepository, 'list'>;
  profile: Pick<ProfileRepository, 'get'>;
}

function mapError(error: unknown): OrderCreationError {
  if (error instanceof OrderCreationError) return error;
  const kind = error !== null && typeof error === 'object' && 'kind' in error ? error.kind : undefined;
  if (error instanceof ApiError) {
    if (error.status === 401) return new OrderCreationError('Tu sesión ya no es válida. Inicia sesión de nuevo.', 'unauthorized');
    if (error.status === 409) return new OrderCreationError('Cambió la disponibilidad. Actualiza el resumen antes de confirmar.', 'conflict');
    if (error.status === 400 || error.status === 422) return new OrderCreationError('Revisa los datos del pedido y actualiza el resumen.', 'invalid-request');
    if (error.status !== null && error.status >= 500) return new OrderCreationError('No pudimos conectar con INHALEX. Revisa el estado del pedido antes de continuar.', 'network');
  }
  if (kind === 'unauthorized') return new OrderCreationError('Tu sesión ya no es válida. Inicia sesión de nuevo.', 'unauthorized');
  if (kind === 'cancelled') return new OrderCreationError('Se canceló la operación del pedido.', 'cancelled');
  if (kind === 'network') return new OrderCreationError('No pudimos conectar con INHALEX. Revisa tu conexión.', 'network');
  if (kind === 'timeout') return new OrderCreationError('El pedido tardó demasiado en responder. Revisa su estado antes de continuar.', 'timeout');
  if (kind === 'invalid-response') return invalidOrderResponse();
  if (kind === 'configuration' || error instanceof ApiError && kind === 'invalid-request') {
    return new OrderCreationError('Los pedidos no están disponibles en este momento.', 'configuration');
  }
  return new OrderCreationError('No pudimos completar la operación del pedido. Inténtalo más tarde.', 'server');
}

export class ApiOrderCreationRepository implements OrderCreationRepository {
  constructor(private readonly httpClient: HttpClient, private readonly sources: OrderCreationSources) {}

  load(options?: OrderCreationRequestOptions): Promise<OrderContext> {
    return this.perform(async () => {
      const [cart, addresses, profile] = await Promise.all([
        this.sources.cart.list(options), this.sources.addresses.list(options), this.sources.profile.get(options),
      ]);
      return Object.freeze({ cart, addresses, profile });
    }, options);
  }

  preview(items: readonly OrderItemInput[], options?: OrderCreationRequestOptions): Promise<OrderQuote> {
    return this.perform(async () => {
      const normalized = normalizeOrderItems(items);
      const payload = await this.httpClient.request('/orders/draft/preview', {
        method: 'POST', body: { items: normalized }, authenticated: true, signal: options?.signal,
      });
      return mapOrderQuote(payload, normalized);
    }, options);
  }

  confirm(input: OrderConfirmInput, idempotencyKey: string, options?: OrderCreationRequestOptions): Promise<OrderConfirmation> {
    return this.perform(async () => {
      const values = normalizeOrderConfirmInput(input);
      if (!isOrderIdempotencyKey(idempotencyKey)) throw new OrderCreationError('No pudimos preparar una confirmación segura.', 'invalid-request');
      const payload = await this.httpClient.request('/orders/confirm', {
        method: 'POST', body: values, idempotencyKey, authenticated: true, signal: options?.signal,
      });
      return mapOrderConfirmation(payload, values.items);
    }, options);
  }

  readCart(options?: OrderCreationRequestOptions): Promise<Cart> {
    return this.perform(() => this.sources.cart.list(options), options);
  }

  clearCart(options?: OrderCreationRequestOptions): Promise<Cart> {
    return this.perform(async () => {
      let cart: Cart;
      try {
        cart = mapCart(await this.httpClient.request('/cart', { method: 'DELETE', authenticated: true, signal: options?.signal }));
      } catch (error) { throw mapError(error); }
      if (cart.items.length || cart.totalItems !== 0 || cart.subtotal !== 0) throw invalidOrderResponse();
      return cart;
    }, options);
  }

  private async perform<T>(operation: () => Promise<T>, options?: OrderCreationRequestOptions): Promise<T> {
    if (options?.signal?.aborted) throw mapError({ kind: 'cancelled' });
    try {
      const result = await operation();
      if (options?.signal?.aborted) throw mapError({ kind: 'cancelled' });
      return result;
    } catch (error) {
      if (options?.signal?.aborted) throw mapError({ kind: 'cancelled' });
      throw mapError(error);
    }
  }
}
