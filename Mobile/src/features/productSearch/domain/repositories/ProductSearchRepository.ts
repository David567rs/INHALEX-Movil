import type { CatalogPage } from '../../../catalog/domain/models/Catalog';

export type ProductSearchInput = { term: string; page: number; limit: number };
export type ProductSearchRequestOptions = { signal?: AbortSignal };

export interface ProductSearchRepository {
  search(input: ProductSearchInput, options?: ProductSearchRequestOptions): Promise<CatalogPage>;
}
