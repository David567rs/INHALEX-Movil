import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient } from '../../../../core/network/HttpClient';
import { ReviewsError } from '../../domain/errors/ReviewsError';
import type { ProductReview, ReviewCollection, ReviewInput } from '../../domain/models/Review';
import type { ReviewsRepository, ReviewsRequestOptions } from '../../domain/repositories/ReviewsRepository';
import { normalizeReviewInput } from '../../domain/useCases/reviewsActions';
import { invalidReviewsResponse, mapPublishedReview, mapReviewCollection } from '../mappers/mapReviews';

function cancelled(): ReviewsError { return new ReviewsError('Se canceló la operación de reseñas.', 'cancelled'); }

function mapError(error: unknown): ReviewsError {
  if (error instanceof ReviewsError) return error;
  if (error instanceof ApiError) {
    if (error.kind === 'cancelled') return cancelled();
    if (error.kind === 'invalid-response') return invalidReviewsResponse();
    if (error.kind === 'invalid-request') return new ReviewsError('Las reseñas no están disponibles en este momento.', 'configuration');
    if (error.kind === 'network') return new ReviewsError('No pudimos conectar con INHALEX. Revisa tu conexión e inténtalo de nuevo.', 'network');
    if (error.kind === 'timeout') return new ReviewsError('Las reseñas tardaron demasiado en responder. Inténtalo de nuevo.', 'timeout');
    if (error.status === 401) return new ReviewsError('Tu sesión ya no es válida. Inicia sesión para consultar tus reseñas.', 'unauthorized');
    if (error.status === 403) return new ReviewsError('No pudimos acceder a tus reseñas en este momento.', 'forbidden');
    if (error.status === 404) return new ReviewsError('El producto ya no está disponible para reseñar. Actualiza la lista.', 'not-found');
    if (error.status === 409) return new ReviewsError('Ya existe una reseña para este producto. Actualiza la lista para consultarla.', 'conflict');
    if (error.status === 400 || error.status === 422) return new ReviewsError('No pudimos publicar la reseña. Revisa los datos y actualiza los productos disponibles.', 'invalid-request');
    if (error.status === 429) return new ReviewsError('Espera un momento antes de volver a intentar la operación.', 'rate-limit');
    if (error.status !== null && error.status >= 500) return new ReviewsError('Las reseñas no están disponibles por el momento. Inténtalo más tarde.', 'server');
  }
  return new ReviewsError('No pudimos completar la operación de reseñas. Inténtalo de nuevo.', 'unknown');
}

export class ApiReviewsRepository implements ReviewsRepository {
  constructor(private readonly httpClient: HttpClient) {}

  list(options?: ReviewsRequestOptions): Promise<ReviewCollection> {
    return this.request('/reviews/me/eligible', 'GET', mapReviewCollection, options);
  }

  async publish(input: ReviewInput, options?: ReviewsRequestOptions): Promise<ProductReview> {
    if (options?.signal?.aborted) throw cancelled();
    const normalized = normalizeReviewInput(input);
    return this.request('/reviews', 'POST', (payload) => mapPublishedReview(payload, normalized), options, normalized);
  }

  private async request<T>(path: string, method: 'GET' | 'POST', parse: (payload: unknown) => T,
    options?: ReviewsRequestOptions, body?: ReviewInput): Promise<T> {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const payload = await this.httpClient.request(path, { method, authenticated: true, signal: options?.signal, body });
      if (options?.signal?.aborted) throw cancelled();
      return parse(payload);
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      throw mapError(error);
    }
  }
}
