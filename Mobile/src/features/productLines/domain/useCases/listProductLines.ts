import type { ProductLine } from '../models/ProductLine';
import type { ProductLinesRepository } from '../repositories/ProductLinesRepository';

export type ListProductLines = () => readonly ProductLine[];

export function createListProductLines(repository: ProductLinesRepository): ListProductLines {
  return () => repository.list();
}
