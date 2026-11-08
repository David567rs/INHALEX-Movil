import { mapCatalogImage } from '../../../catalog/data/mappers/mapCatalogPage';
import { ReviewsError } from '../../domain/errors/ReviewsError';
import type { ProductReview, ReviewCollection, ReviewInput, ReviewableProduct } from '../../domain/models/Review';

export function invalidReviewsResponse(): ReviewsError {
  return new ReviewsError('No pudimos confirmar los datos de tus reseñas. Actualiza la lista e inténtalo de nuevo.', 'invalid-response');
}

const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
const id = (value: unknown): value is string => typeof value === 'string' && value.length === 24 && /^[a-f\d]{24}$/i.test(value);
const text = (value: unknown, max: number, empty = false, multiline = false): value is string => typeof value === 'string'
  && value.length <= max && value === value.trim() && (empty || value.length > 0)
  && ![...value].some((character) => {
    const code = character.charCodeAt(0);
    return code < 32 && !(multiline && (code === 9 || code === 10 || code === 13)) || code >= 127 && code <= 159;
  });

function date(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || value.length !== 24 || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) throw invalidReviewsResponse();
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString() !== value) throw invalidReviewsResponse();
  return value;
}

export function mapProductReview(payload: unknown): ProductReview {
  if (!record(payload) || !id(payload.id) || !id(payload.productId) || !id(payload.orderId)
    || !text(payload.userName, 120) || !text(payload.productName, 120) || !text(payload.productSlug, 300, true)
    || !text(payload.orderReference, 80) || !Number.isInteger(payload.rating) || (payload.rating as number) < 1 || (payload.rating as number) > 5
    || !text(payload.comment, 700, false, true) || payload.comment.length < 4
    || !['published', 'hidden'].includes(payload.status as string)) throw invalidReviewsResponse();
  return Object.freeze({
    id: payload.id.toLowerCase(), productId: payload.productId.toLowerCase(), orderId: payload.orderId.toLowerCase(),
    userName: payload.userName, productName: payload.productName, productSlug: payload.productSlug,
    productImage: mapCatalogImage(payload.productImage), orderReference: payload.orderReference,
    rating: payload.rating as number, comment: payload.comment, status: payload.status as ProductReview['status'], createdAt: date(payload.createdAt),
  });
}

function mapReviewableProduct(payload: unknown, completed: boolean): ReviewableProduct {
  if (!record(payload) || !id(payload.productId) || !id(payload.orderId) || !text(payload.productName, 120)
    || !text(payload.productSlug, 300, true) || !text(payload.orderReference, 80) || !text(payload.presentation, 160, true)) throw invalidReviewsResponse();
  const review = payload.review === undefined || payload.review === null ? null : mapProductReview(payload.review);
  if (completed !== (review !== null) || review && review.productId !== payload.productId.toLowerCase()) throw invalidReviewsResponse();
  // A repeat purchase can produce a newer eligible order than the order used by an existing review.
  return Object.freeze({ productId: payload.productId.toLowerCase(), orderId: payload.orderId.toLowerCase(), productName: payload.productName,
    productSlug: payload.productSlug, productImage: mapCatalogImage(payload.productImage), orderReference: payload.orderReference,
    presentation: payload.presentation, purchasedAt: date(payload.purchasedAt), review });
}

export function mapReviewCollection(payload: unknown): ReviewCollection {
  if (!record(payload) || !Array.isArray(payload.pending) || !Array.isArray(payload.completed)
    || payload.pending.length + payload.completed.length > 600) throw invalidReviewsResponse();
  const pending = payload.pending.map((item) => mapReviewableProduct(item, false));
  const completed = payload.completed.map((item) => mapReviewableProduct(item, true));
  const all = [...pending, ...completed];
  if (new Set(all.map((item) => item.productId)).size !== all.length
    || new Set(completed.map((item) => item.review!.id)).size !== completed.length) throw invalidReviewsResponse();
  // Preserve server order: products are deduplicated from the thirty latest completed orders.
  return Object.freeze({ pending: Object.freeze(pending), completed: Object.freeze(completed) });
}

export function mapPublishedReview(payload: unknown, expected: ReviewInput): ProductReview {
  const review = mapProductReview(payload);
  if (review.productId !== expected.productId || review.orderId !== expected.orderId || review.rating !== expected.rating
    || review.comment !== expected.comment || review.status !== 'published') throw invalidReviewsResponse();
  return review;
}
