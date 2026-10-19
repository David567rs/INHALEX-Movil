import type { ProductLine } from '../../domain/models/ProductLine';
import type { ProductLinesRepository } from '../../domain/repositories/ProductLinesRepository';

/** Existing line IDs and names, supplied locally only for the visual review. */
const previewLines: readonly ProductLine[] = Object.freeze([
  Object.freeze({ id: 'linea-insomnio', name: 'Línea insomnio' }),
  Object.freeze({ id: 'linea-ansiedad-estres', name: 'Línea ansiedad y estrés' }),
  Object.freeze({ id: 'linea-resfriado', name: 'Línea resfriado' }),
  Object.freeze({ id: 'linea-verde', name: 'Línea verde' }),
  Object.freeze({ id: 'linea-estimulante', name: 'Línea estimulante' }),
]);

export class PreviewProductLinesRepository implements ProductLinesRepository {
  list(): readonly ProductLine[] {
    return previewLines;
  }
}
