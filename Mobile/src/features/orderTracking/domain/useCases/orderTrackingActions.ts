import { OrderTrackingError } from '../errors/OrderTrackingError';
import type { OrderTrackingActions, OrderTrackingRepository } from '../repositories/OrderTrackingRepository';

export type { OrderTrackingActions } from '../repositories/OrderTrackingRepository';

export function normalizeOrderTrackingId(value: unknown): string {
  if (typeof value !== 'string' || value.length !== 24 || !/^[a-f\d]{24}$/i.test(value)) {
    throw new OrderTrackingError('El pedido no es válido. Vuelve a seleccionarlo desde tu historial.', 'invalid-request');
  }
  return value.toLowerCase();
}

function cancelled(): OrderTrackingError {
  return new OrderTrackingError('Se canceló la consulta del seguimiento.', 'cancelled');
}

export function createOrderTrackingActions(repository: OrderTrackingRepository): OrderTrackingActions {
  return {
    async get(id, options) {
      if (options?.signal?.aborted) throw cancelled();
      try {
        const result = await repository.get(normalizeOrderTrackingId(id), options);
        if (options?.signal?.aborted) throw cancelled();
        return result;
      } catch (error) {
        if (options?.signal?.aborted) throw cancelled();
        if (error instanceof OrderTrackingError) throw error;
        throw new OrderTrackingError('No pudimos consultar el seguimiento. Inténtalo de nuevo.', 'unknown');
      }
    },
  };
}
