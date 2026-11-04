import { LocalReviewPreviewRepository } from '../features/reviews/data/repositories/LocalReviewPreviewRepository';
import { createReadReviewPreview, type ReadReviewPreview } from '../features/reviews/domain/useCases/readReviewPreview';

export function createReviewPreviewAction(): ReadReviewPreview {
  return createReadReviewPreview(new LocalReviewPreviewRepository());
}
