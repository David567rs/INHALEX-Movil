import type { NoticesPreview, NoticesPreviewScene } from '../models/NoticePreview';
import type { NoticesPreviewRepository } from '../repositories/NoticesPreviewRepository';

export type LoadNoticesPreview = (scene: NoticesPreviewScene) => NoticesPreview;

export function createLoadNoticesPreview(repository: NoticesPreviewRepository): LoadNoticesPreview {
  return (scene) => repository.load(scene);
}
