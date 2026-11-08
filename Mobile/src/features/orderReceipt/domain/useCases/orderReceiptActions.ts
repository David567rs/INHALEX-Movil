import { OrderReceiptError } from '../errors/OrderReceiptError';
import type { ReceiptOrder } from '../models/OrderReceipt';
import type { OrderReceiptActions, OrderReceiptRepository, ReceiptRequestOptions } from '../repositories/OrderReceiptRepository';

export type { OrderReceiptActions } from '../repositories/OrderReceiptRepository';

export function normalizeReceiptOrderId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f\d]{24}$/i.test(value)) {
    throw new OrderReceiptError('Selecciona un pedido disponible para confirmar su recepción.', 'invalid-request');
  }
  return value.toLowerCase();
}

export function canConfirmReceipt(order: ReceiptOrder | null | undefined): boolean {
  return order?.status === 'completed' && order.receiptStatus === 'pending';
}

/** An explicit confirmation invokes the repository once; recovery reads never repeat the write. */
export function buildOrderReceiptActions(repository: OrderReceiptRepository): OrderReceiptActions {
  const cancelled = () => new OrderReceiptError('Se canceló la operación de recepción.', 'cancelled');
  async function perform<T>(operation: () => Promise<T>, options?: ReceiptRequestOptions): Promise<T> {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const result = await operation();
      if (options?.signal?.aborted) throw cancelled();
      return result;
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      if (error instanceof OrderReceiptError) throw error;
      throw new OrderReceiptError('No pudimos completar la operación de recepción. Inténtalo de nuevo.', 'unknown');
    }
  }
  return {
    list: (options) => perform(() => repository.list(options), options),
    confirm: (orderId, options) => perform(() => repository.confirm(normalizeReceiptOrderId(orderId), options), options),
  };
}
