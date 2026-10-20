import { OrderCreationError } from '../errors/OrderCreationError';
import type { OrderCreationActions, OrderCreationRepository, OrderCreationRequestOptions } from '../repositories/OrderCreationRepository';
import { isOrderIdempotencyKey, normalizeOrderConfirmInput, normalizeOrderItems } from '../validation/orderCreationValidation';

export type { OrderCreationActions } from '../repositories/OrderCreationRepository';

export function createOrderCreationActions(repository: OrderCreationRepository): OrderCreationActions {
  async function perform<T>(operation: () => Promise<T>, options?: OrderCreationRequestOptions): Promise<T> {
    const cancelled = () => new OrderCreationError('Se canceló la operación del pedido.', 'cancelled');
    if (options?.signal?.aborted) throw cancelled();
    try {
      const result = await operation();
      if (options?.signal?.aborted) throw cancelled();
      return result;
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      if (error instanceof OrderCreationError) throw error;
      throw new OrderCreationError('No pudimos completar la operación del pedido. Inténtalo de nuevo más tarde.', 'server');
    }
  }
  return {
    load: (options) => perform(() => repository.load(options), options),
    preview: (items, options) => perform(() => repository.preview(normalizeOrderItems(items), options), options),
    confirm: (input, key, options) => perform(() => {
      if (!isOrderIdempotencyKey(key)) throw new OrderCreationError('No pudimos preparar una confirmación segura.', 'invalid-request');
      return repository.confirm(normalizeOrderConfirmInput(input), key, options);
    }, options),
    readCart: (options) => perform(() => repository.readCart(options), options),
    clearCart: (options) => perform(() => repository.clearCart(options), options),
  };
}
