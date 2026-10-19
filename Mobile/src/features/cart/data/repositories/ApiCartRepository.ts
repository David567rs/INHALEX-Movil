import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient, HttpRequestOptions } from '../../../../core/network/HttpClient';
import { CartError } from '../../domain/errors/CartError';
import type { Cart } from '../../domain/models/Cart';
import type { CartRepository, CartRequestOptions } from '../../domain/repositories/CartRepository';
import { isCartProductId, isCartQuantity } from '../../domain/validation/cartInput';
import { mapCart } from '../mappers/mapCart';

function cancelled(): CartError {
  return new CartError('Se canceló la operación de la bolsa.', 'cancelled');
}

function invalidResponse(): CartError {
  return new CartError('No pudimos confirmar tu bolsa. Actualiza la lista e inténtalo de nuevo.', 'invalid-response');
}

function mapCartError(error: unknown): CartError {
  if (error instanceof CartError) return error;
  if (error instanceof ApiError) {
    if (error.kind === 'cancelled') return cancelled();
    if (error.kind === 'timeout') {
      return new CartError('La bolsa tardó demasiado en responder. Actualiza la lista antes de intentarlo otra vez.', 'timeout');
    }
    if (error.kind === 'network') {
      return new CartError('No pudimos conectar con INHALEX. Revisa tu conexión y actualiza la bolsa.', 'network');
    }
    if (error.kind === 'invalid-response') return invalidResponse();
    if (error.kind === 'invalid-request') {
      return new CartError('La bolsa no está disponible en este momento. Inténtalo más tarde.', 'configuration');
    }
    if (error.status === 401) {
      return new CartError('Tu sesión ya no es válida. Inicia sesión de nuevo para ver tu bolsa.', 'unauthorized');
    }
    if (error.status === 404) {
      return new CartError('No encontramos el producto o tu bolsa. Actualiza la lista e inténtalo de nuevo.', 'not-found');
    }
    if (error.status === 400 || error.status === 409 || error.status === 422) {
      return new CartError('No pudimos aceptar ese producto o cantidad. Actualiza la bolsa e inténtalo de nuevo.', 'invalid-request');
    }
  }
  return new CartError('No pudimos completar la operación de la bolsa. Inténtalo de nuevo más tarde.', 'server');
}

export class ApiCartRepository implements CartRepository {
  constructor(private readonly httpClient: HttpClient) {}

  list(options?: CartRequestOptions): Promise<Cart> {
    return this.request('/cart', { method: 'GET' }, options);
  }

  add(productId: string, quantity: number, options?: CartRequestOptions): Promise<Cart> {
    return this.change('POST', productId, quantity, options);
  }

  updateQuantity(productId: string, quantity: number, options?: CartRequestOptions): Promise<Cart> {
    return this.change('PATCH', productId, quantity, options);
  }

  remove(productId: string, options?: CartRequestOptions): Promise<Cart> {
    return this.change('DELETE', productId, undefined, options);
  }

  private async change(method: 'POST' | 'PATCH' | 'DELETE', productId: string, quantity: number | undefined,
    options?: CartRequestOptions): Promise<Cart> {
    if (options?.signal?.aborted) throw cancelled();
    if (!isCartProductId(productId)) {
      throw new CartError('Este producto no es válido. Vuelve al catálogo y elige otro aroma.', 'invalid-request');
    }
    if (method !== 'DELETE' && !isCartQuantity(quantity)) {
      throw new CartError('Elige una cantidad entera entre 1 y 25.', 'invalid-request');
    }
    const id = productId.toLowerCase();
    const path = method === 'POST' ? '/cart' : `/cart/${id}`;
    const body = method === 'POST' ? { productId: id, quantity }
      : method === 'PATCH' ? { quantity } : undefined;
    const cart = await this.request(path, { method, ...(body === undefined ? {} : { body }) }, options);
    const item = cart.items.find((candidate) => candidate.productId === id);
    if ((method === 'DELETE' && item) || (method === 'PATCH' && item?.quantity !== quantity)
      || (method === 'POST' && (!item || item.quantity < quantity!))) throw invalidResponse();
    return cart;
  }

  private async request(path: string, requestOptions: HttpRequestOptions, options?: CartRequestOptions): Promise<Cart> {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const payload = await this.httpClient.request(path, {
        ...requestOptions, authenticated: true, signal: options?.signal,
      });
      if (options?.signal?.aborted) throw cancelled();
      return mapCart(payload);
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      throw mapCartError(error);
    }
  }
}
