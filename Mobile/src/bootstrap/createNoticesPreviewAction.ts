import { LocalNoticesPreviewRepository } from '../features/notices/data/repositories/LocalNoticesPreviewRepository';
import { createLoadNoticesPreview, type LoadNoticesPreview } from '../features/notices/domain/useCases/loadNoticesPreview';

export function createNoticesPreviewAction(): LoadNoticesPreview {
  return createLoadNoticesPreview(new LocalNoticesPreviewRepository());
}
