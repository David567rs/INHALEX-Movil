import type { ReceiptOrder } from '../models/OrderReceipt';

export interface ReceiptRequestOptions { signal?: AbortSignal }

export interface OrderReceiptRepository {
  list(options?: ReceiptRequestOptions): Promise<readonly ReceiptOrder[]>;
  confirm(orderId: string, options?: ReceiptRequestOptions): Promise<ReceiptOrder>;
}

export type OrderReceiptActions = OrderReceiptRepository;
