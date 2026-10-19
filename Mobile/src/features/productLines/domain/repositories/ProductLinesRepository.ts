import type { ProductLine } from '../models/ProductLine';

export interface ProductLinesRepository {
  list(): readonly ProductLine[];
}
