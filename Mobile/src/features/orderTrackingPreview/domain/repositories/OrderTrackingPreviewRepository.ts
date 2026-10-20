import type { OrderTrackingPreview, OrderTrackingPreviewScenario } from '../models/OrderTrackingPreview';

/** Local design compositions only; this contract does not access a customer order. */
export interface OrderTrackingPreviewRepository {
  load(scenario: OrderTrackingPreviewScenario): OrderTrackingPreview;
}
