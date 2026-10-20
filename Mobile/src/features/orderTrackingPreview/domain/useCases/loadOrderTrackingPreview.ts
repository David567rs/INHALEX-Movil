import type { OrderTrackingPreview, OrderTrackingPreviewScenario } from '../models/OrderTrackingPreview';
import type { OrderTrackingPreviewRepository } from '../repositories/OrderTrackingPreviewRepository';

export type LoadOrderTrackingPreview = (scenario: OrderTrackingPreviewScenario) => OrderTrackingPreview;

export function loadOrderTrackingPreview(repository: OrderTrackingPreviewRepository): LoadOrderTrackingPreview {
  return (scenario) => repository.load(scenario);
}
