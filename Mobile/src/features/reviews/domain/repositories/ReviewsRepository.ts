import type { ProductReview, ReviewCollection, ReviewInput } from '../models/Review';

export interface ReviewsRequestOptions { signal?: AbortSignal }

export interface ReviewsRepository {
  list(options?: ReviewsRequestOptions): Promise<ReviewCollection>;
  publish(input: ReviewInput, options?: ReviewsRequestOptions): Promise<ProductReview>;
}

export type ReviewsActions = ReviewsRepository;
