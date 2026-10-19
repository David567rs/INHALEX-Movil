import { CartError } from '../errors/CartError';
import type { CartActions, CartRepository, CartRequestOptions } from '../repositories/CartRepository';
import { isCartProductId, isCartQuantity } from '../validation/cartInput';

export type { CartActions } from '../repositories/CartRepository';

function cancelled(): CartError {
  return new CartError('Se canceló la operación de la bolsa.', 'cancelled');
}

function productId(value: string): string {
  if (!isCartProductId(value)) {
    throw new CartError('Este producto no es válido. Vuelve al catálogo y elige otro aroma.', 'invalid-request');
  }
  return value.toLowerCase();
}

function quantity(value: number): number {
  if (!isCartQuantity(value)) {
    throw new CartError('Elige una cantidad entera entre 1 y 25.', 'invalid-request');
  }
  return value;
}

export function createCartActions(repository: CartRepository): CartActions {
  async function perform<T>(operation: () => Promise<T>, options?: CartRequestOptions): Promise<T> {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const result = await operation();
      if (options?.signal?.aborted) throw cancelled();
      return result;
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      if (error instanceof CartError) throw error;
      throw new CartError('No pudimos completar la operación de la bolsa. Inténtalo de nuevo más tarde.', 'server');
    }
  }

  return {
    list: (options) => perform(() => repository.list(options), options),
    add: (id, amount, options) => perform(() => repository.add(productId(id), quantity(amount), options), options),
    updateQuantity: (id, amount, options) => perform(() => repository.updateQuantity(productId(id), quantity(amount), options), options),
    remove: (id, options) => perform(() => repository.remove(productId(id), options), options),
  };
}
