import type { CatalogPage } from '../models/Catalog';

export type CatalogListInput = { page: number; limit: number };
export type CatalogRequestOptions = { signal?: AbortSignal };

export interface CatalogRepository {
  list(input: CatalogListInput, options?: CatalogRequestOptions): Promise<CatalogPage>;
}
