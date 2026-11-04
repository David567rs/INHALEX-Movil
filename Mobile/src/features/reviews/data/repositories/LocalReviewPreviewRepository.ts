import type { ReviewPreview } from '../../domain/models/ReviewPreview';
import type { ReviewPreviewRepository } from '../../domain/repositories/ReviewPreviewRepository';

/** Synthetic design example; this does not identify an actual selected product. */
const preview: ReviewPreview = Object.freeze({ productName: 'Lavanda (ejemplo)' });

export class LocalReviewPreviewRepository implements ReviewPreviewRepository {
  getPreview(): ReviewPreview {
    return preview;
  }
}
