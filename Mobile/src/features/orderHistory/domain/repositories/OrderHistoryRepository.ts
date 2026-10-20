import type { OrderHistoryDetail, OrderHistoryPage } from '../models/OrderHistory';

export interface OrderHistoryRequestOptions {
  signal?: AbortSignal;
}

export interface OrderHistoryRepository {
  list(cursor?: string, options?: OrderHistoryRequestOptions): Promise<OrderHistoryPage>;
  get(id: string, options?: OrderHistoryRequestOptions): Promise<OrderHistoryDetail>;
}

export type OrderHistoryActions = OrderHistoryRepository;
