import { ProductLinesError } from '../errors/ProductLinesError';
import type { ProductLine } from '../models/ProductLine';
import type { ProductLinesRepository, ProductLinesRequestOptions } from '../repositories/ProductLinesRepository';

export type ListProductLines = (options?: ProductLinesRequestOptions) => Promise<readonly ProductLine[]>;

function cancelled(): ProductLinesError {
  return new ProductLinesError('Se canceló la carga de las líneas.', 'cancelled');
}

export function createListProductLines(repository: ProductLinesRepository): ListProductLines {
  return async (options) => {
    if (options?.signal?.aborted) throw cancelled();
    try {
      const result = await repository.list(options);
      if (options?.signal?.aborted) throw cancelled();
      return result;
    } catch (error) {
      if (options?.signal?.aborted) throw cancelled();
      if (error instanceof ProductLinesError) throw error;
      throw new ProductLinesError('No pudimos cargar las líneas. Inténtalo de nuevo más tarde.', 'unknown');
    }
  };
}
