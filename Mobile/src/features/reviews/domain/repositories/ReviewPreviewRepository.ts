import type { ReviewPreview } from '../models/ReviewPreview';

/** Read-only product example for the review design. */
export interface ReviewPreviewRepository {
  getPreview(): ReviewPreview;
}
