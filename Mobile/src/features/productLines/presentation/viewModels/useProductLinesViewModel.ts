import { useState } from 'react';
import type { ListProductLines } from '../../domain/useCases/listProductLines';

export function useProductLinesViewModel(listLines: ListProductLines) {
  const [lines] = useState(() => listLines());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const items = lines.map((line, index) => ({
    ...line,
    title: line.name.replace(/^Línea\s+/i, '').replace(/^./, (letter) => letter.toUpperCase()),
    number: String(index + 1).padStart(2, '0'),
    selected: line.id === selectedId,
  }));

  function selectLine(id: string) {
    if (lines.some((line) => line.id === id)) setSelectedId(id);
  }

  return { items, selectedLine: lines.find((line) => line.id === selectedId) ?? null, selectLine };
}
