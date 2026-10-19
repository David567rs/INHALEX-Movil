import type { ProductLine } from '../models/ProductLine';

export type ProductLinesRequestOptions = { signal?: AbortSignal };

export interface ProductLinesRepository {
  list(options?: ProductLinesRequestOptions): Promise<readonly ProductLine[]>;
}
