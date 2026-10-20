import type { NoticesPreview, NoticesPreviewScene } from '../models/NoticePreview';

export interface NoticesPreviewRepository {
  load(scene: NoticesPreviewScene): NoticesPreview;
}
