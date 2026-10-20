import type { OrderTracking } from '../models/OrderTracking';

export interface OrderTrackingRequestOptions {
  signal?: AbortSignal;
}

export interface OrderTrackingRepository {
  get(id: string, options?: OrderTrackingRequestOptions): Promise<OrderTracking>;
}

export type OrderTrackingActions = OrderTrackingRepository;
