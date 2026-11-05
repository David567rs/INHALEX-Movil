import { ReviewsError } from '../errors/ReviewsError';
import type { ReviewFieldErrors, ReviewInput } from '../models/Review';
import type { ReviewsActions, ReviewsRepository, ReviewsRequestOptions } from '../repositories/ReviewsRepository';

export type { ReviewsActions } from '../repositories/ReviewsRepository';

export function normalizeReviewId(value: unknown): string {
  if (typeof value !== 'string' || value.length !== 24 || !/^[a-f\d]{24}$/i.test(value)) {
    throw new ReviewsError('Selecciona un producto disponible para reseñar.', 'invalid-request');
  }
  return value.toLowerCase();
}

export function validateReviewDraft(rating: unknown, comment: unknown): ReviewFieldErrors {
  const errors: { rating?: string; comment?: string } = {};
  if (!Number.isInteger(rating) || (rating as number) < 1 || (rating as number) > 5) {
    errors.rating = 'Selecciona una calificación de 1 a 5 estrellas.';
  }
  if (typeof comment !== 'string' || comment.trim().length < 4 || comment.trim().length > 700
    || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/.test(comment)) {
    errors.comment = 'Escribe un comentario de 4 a 700 caracteres.';
  }
  return Object.freeze(errors);
}

export function normalizeReviewInput(input: ReviewInput): ReviewInput {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new ReviewsError('Revisa la calificación y el comentario antes de publicar.', 'invalid-request');
  }
  const productId = normalizeReviewId(input.productId);
  const orderId = normalizeReviewId(input.orderId);
  if (Object.keys(validateReviewDraft(input.rating, input.comment)).length) {
    throw new ReviewsError('Revisa la calificación y el comentario antes de publicar.', 'invalid-request');
  }
  return Object.freeze({ productId, orderId, rating: input.rating, comment: input.comment.trim() });
}

export function createReviewsActions(repository: ReviewsRepository): ReviewsActions {
  const cancelled = () => new ReviewsError('Se canceló la operación de reseñas.', 'cancelled');
  async function perform<T>(operation: () => Promise<T>, options?: ReviewsRequestOptions): Promise<T> {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const result = await operation();
      if (options?.signal?.aborted) throw cancelled();
      return result;
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      if (error instanceof ReviewsError) throw error;
      throw new ReviewsError('No pudimos completar la operación de reseñas. Inténtalo de nuevo.', 'unknown');
    }
  }
  return {
    list: (options) => perform(() => repository.list(options), options),
    publish: (input, options) => perform(() => repository.publish(normalizeReviewInput(input), options), options),
  };
}
