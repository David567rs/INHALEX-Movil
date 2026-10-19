import { ProductLinesError } from '../../domain/errors/ProductLinesError';
import type { ProductLine } from '../../domain/models/ProductLine';

function invalidResponse(): ProductLinesError {
  return new ProductLinesError('No pudimos cargar las líneas en este momento. Inténtalo de nuevo más tarde.', 'invalid-response');
}

/** Public IDs are dynamic slugs. The backend permits leading/trailing hyphens. */
export function mapProductLines(payload: unknown): readonly ProductLine[] {
  if (!Array.isArray(payload)) throw invalidResponse();
  const ids = new Set<string>();
  return payload.map((entry) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) throw invalidResponse();
    const item = entry as Record<string, unknown>;
    if (typeof item.id !== 'string' || !/^[a-z0-9-]+$/.test(item.id)
      || typeof item.name !== 'string' || !item.name.trim()
      || !Number.isSafeInteger(item.count) || (item.count as number) < 0
      || ids.has(item.id)) throw invalidResponse();
    ids.add(item.id);
    return { id: item.id, name: item.name, count: item.count as number };
  });
}
