import { LocalOrderTrackingPreviewRepository } from '../features/orderTrackingPreview/data/repositories/LocalOrderTrackingPreviewRepository';
import { loadOrderTrackingPreview } from '../features/orderTrackingPreview/domain/useCases/loadOrderTrackingPreview';

export function createOrderTrackingPreviewAction() {
  return loadOrderTrackingPreview(new LocalOrderTrackingPreviewRepository());
}
