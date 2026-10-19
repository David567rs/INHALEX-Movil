import type { CatalogProduct } from '../../../catalog/domain/models/Catalog';

export interface FavoritesRequestOptions {
  signal?: AbortSignal;
}

export interface FavoritesActions {
  list(options?: FavoritesRequestOptions): Promise<readonly CatalogProduct[]>;
  add(id: string, options?: FavoritesRequestOptions): Promise<void>;
  remove(id: string, options?: FavoritesRequestOptions): Promise<void>;
}

export interface FavoritesRepository {
  list(options?: FavoritesRequestOptions): Promise<readonly CatalogProduct[]>;
  add(id: string, options?: FavoritesRequestOptions): Promise<void>;
  remove(id: string, options?: FavoritesRequestOptions): Promise<void>;
}
