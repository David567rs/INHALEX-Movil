import { ApiError } from '../../../../core/network/ApiError';
import type { HttpClient } from '../../../../core/network/HttpClient';
import { mapCatalogProduct } from '../../../catalog/data/mappers/mapCatalogPage';
import { CatalogError } from '../../../catalog/domain/errors/CatalogError';
import type { CatalogProduct } from '../../../catalog/domain/models/Catalog';
import { FavoritesError } from '../../domain/errors/FavoritesError';
import type { FavoritesRepository, FavoritesRequestOptions } from '../../domain/repositories/FavoritesRepository';
import { isFavoriteProductId } from '../../domain/validation/favoriteProductId';

function cancelled(): FavoritesError {
  return new FavoritesError('Se canceló la operación de favoritos.', 'cancelled');
}

function invalidResponse(): FavoritesError {
  return new FavoritesError('No pudimos confirmar tus favoritos. Inténtalo de nuevo más tarde.', 'invalid-response');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function mapFavorites(payload: unknown): readonly CatalogProduct[] {
  if (!Array.isArray(payload)) throw invalidResponse();
  const seen = new Set<string>();
  return payload.map((value) => {
    if (!isRecord(value) || !isFavoriteProductId(value._id)) throw invalidResponse();
    const id = value._id.toLowerCase();
    if (seen.has(id)) throw invalidResponse();
    seen.add(id);
    return { ...mapCatalogProduct(value), id };
  });
}

function mapFavoritesError(error: unknown): FavoritesError {
  if (error instanceof FavoritesError) return error;
  if (error instanceof CatalogError) return invalidResponse();
  if (error instanceof ApiError) {
    if (error.kind === 'cancelled') return cancelled();
    if (error.kind === 'timeout') {
      return new FavoritesError('Favoritos tardó demasiado en responder. Inténtalo de nuevo.', 'timeout');
    }
    if (error.kind === 'network') {
      return new FavoritesError('No pudimos conectar con INHALEX. Revisa tu conexión e inténtalo de nuevo.', 'network');
    }
    if (error.kind === 'invalid-response') return invalidResponse();
    if (error.kind === 'invalid-request') {
      return new FavoritesError('Favoritos no está disponible en este momento. Inténtalo más tarde.', 'configuration');
    }
    if (error.status === 401) {
      return new FavoritesError('Tu sesión ya no es válida. Inicia sesión de nuevo para ver tus favoritos.', 'unauthorized');
    }
    if (error.status === 404) {
      return new FavoritesError('No encontramos el producto o tus favoritos. Actualiza la lista e inténtalo de nuevo.', 'not-found');
    }
    if (error.status === 400 || error.status === 422) {
      return new FavoritesError('No pudimos aceptar ese producto. Actualiza la lista e inténtalo de nuevo.', 'invalid-request');
    }
  }
  return new FavoritesError('No pudimos completar la operación de favoritos. Inténtalo de nuevo más tarde.', 'server');
}

export class ApiFavoritesRepository implements FavoritesRepository {
  constructor(private readonly httpClient: HttpClient) {}

  async list(options?: FavoritesRequestOptions): Promise<readonly CatalogProduct[]> {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const payload = await this.httpClient.request('/favorites', {
        method: 'GET', authenticated: true, signal: options?.signal,
      });
      if (options?.signal?.aborted) throw cancelled();
      return mapFavorites(payload);
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      throw mapFavoritesError(error);
    }
  }

  add(id: string, options?: FavoritesRequestOptions): Promise<void> {
    return this.change('PUT', id, options);
  }

  remove(id: string, options?: FavoritesRequestOptions): Promise<void> {
    return this.change('DELETE', id, options);
  }

  private async change(method: 'PUT' | 'DELETE', id: string, options?: FavoritesRequestOptions): Promise<void> {
    if (options?.signal?.aborted) throw cancelled();
    if (!isFavoriteProductId(id)) {
      throw new FavoritesError('Este producto no es válido. Vuelve al catálogo y elige otro aroma.', 'invalid-request');
    }
    const canonicalId = id.toLowerCase();
    try {
      const payload = await this.httpClient.request(`/favorites/${canonicalId}`, {
        method, authenticated: true, signal: options?.signal,
      });
      if (options?.signal?.aborted) throw cancelled();
      if (!isRecord(payload) || !isFavoriteProductId(payload.productId)
        || payload.productId.toLowerCase() !== canonicalId) throw invalidResponse();
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      throw mapFavoritesError(error);
    }
  }
}
