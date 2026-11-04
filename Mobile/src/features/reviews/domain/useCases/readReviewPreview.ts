import type { ReviewPreview } from '../models/ReviewPreview';
import type { ReviewPreviewRepository } from '../repositories/ReviewPreviewRepository';

export type ReadReviewPreview = () => ReviewPreview;

export function createReadReviewPreview(repository: ReviewPreviewRepository): ReadReviewPreview {
  return () => repository.getPreview();
}
