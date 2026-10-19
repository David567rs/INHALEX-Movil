import { useEffect, useState, useSyncExternalStore } from 'react';
import type { ListProductLines } from '../../domain/useCases/listProductLines';
import { createProductLinesController } from '../state/createProductLinesController';

export function useProductLinesViewModel(listLines: ListProductLines) {
  const [controller] = useState(() => createProductLinesController(listLines));
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useEffect(() => { controller.start(); return controller.stop; }, [controller]);

  const items = state.lines.map((line, index) => ({
    ...line,
    title: line.name.replace(/^L[ií]nea\s+/i, '').replace(/^./, (letter) => letter.toUpperCase()),
    number: String(index + 1).padStart(2, '0'),
    selected: line.id === state.selectedId,
  }));

  return { ...state, items, selectedLine: state.lines.find((line) => line.id === state.selectedId) ?? null,
    selectLine: controller.selectLine, refresh: controller.refresh };
}
