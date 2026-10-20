import { OrderHistoryError } from '../errors/OrderHistoryError';
import type {
  OrderHistoryActions, OrderHistoryRepository, OrderHistoryRequestOptions,
} from '../repositories/OrderHistoryRepository';

export type { OrderHistoryActions } from '../repositories/OrderHistoryRepository';

export function normalizeOrderHistoryId(value: unknown): string {
  if (typeof value !== 'string' || value.length !== 24 || !/^[a-f\d]{24}$/i.test(value)) {
    throw new OrderHistoryError('El pedido no es válido. Actualiza tu historial e inténtalo de nuevo.', 'invalid-request');
  }
  return value.toLowerCase();
}

export function normalizeOrderHistoryCursor(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.length === 0 || value.length > 256
    || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new OrderHistoryError('No pudimos continuar el historial. Actualiza la lista e inténtalo de nuevo.', 'invalid-request');
  }
  return value;
}

function cancelled(): OrderHistoryError {
  return new OrderHistoryError('Se canceló la consulta del historial.', 'cancelled');
}

export function createOrderHistoryActions(repository: OrderHistoryRepository): OrderHistoryActions {
  async function perform<T>(operation: () => Promise<T>, options?: OrderHistoryRequestOptions): Promise<T> {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const result = await operation();
      if (options?.signal?.aborted) throw cancelled();
      return result;
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      if (error instanceof OrderHistoryError) throw error;
      throw new OrderHistoryError('No pudimos consultar tu historial. Inténtalo de nuevo más tarde.', 'unknown');
    }
  }

  return {
    list: (cursor, options) => perform(() => repository.list(normalizeOrderHistoryCursor(cursor), options), options),
    get: (id, options) => perform(() => repository.get(normalizeOrderHistoryId(id), options), options),
  };
}
