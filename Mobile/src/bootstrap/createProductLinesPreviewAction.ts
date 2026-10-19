import { PreviewProductLinesRepository } from '../features/productLines/data/repositories/PreviewProductLinesRepository';
import { createListProductLines } from '../features/productLines/domain/useCases/listProductLines';

/** The design stage deliberately uses local content; no API is composed here. */
export function createProductLinesPreviewAction() {
  return createListProductLines(new PreviewProductLinesRepository());
}
