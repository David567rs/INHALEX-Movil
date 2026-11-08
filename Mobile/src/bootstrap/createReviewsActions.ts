import type { HttpClient } from '../core/network/HttpClient';
import { ApiReviewsRepository } from '../features/reviews/data/repositories/ApiReviewsRepository';
import { createReviewsActions } from '../features/reviews/domain/useCases/reviewsActions';

/** Compose with the authenticated client; private credentials remain in the shared runtime. */
export function buildReviewsActions(httpClient: HttpClient) {
  return createReviewsActions(new ApiReviewsRepository(httpClient));
}
