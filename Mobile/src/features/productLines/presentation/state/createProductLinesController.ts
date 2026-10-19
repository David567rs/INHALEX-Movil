import { ProductLinesError } from '../../domain/errors/ProductLinesError';
import type { ProductLine } from '../../domain/models/ProductLine';
import type { ListProductLines } from '../../domain/useCases/listProductLines';

export interface ProductLinesState {
  readonly status: 'loading' | 'ready' | 'error';
  readonly lines: readonly ProductLine[];
  readonly selectedId: string | null;
  readonly refreshing: boolean;
  readonly error: string | null;
}

export function createProductLinesController(listLines: ListProductLines) {
  let state: ProductLinesState = { status: 'loading', lines: [], selectedId: null, refreshing: false, error: null };
  const listeners = new Set<() => void>();
  let active = false;
  let generation = 0;
  let pending: AbortController | null = null;
  const publish = (patch: Partial<ProductLinesState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };

  async function refresh(): Promise<void> {
    if (!active || pending) return;
    const controller = new AbortController();
    pending = controller;
    const requestId = ++generation;
    publish({ status: state.lines.length ? 'ready' : 'loading', refreshing: state.lines.length > 0, error: null });
    try {
      const lines = await listLines({ signal: controller.signal });
      if (!active || generation !== requestId || controller.signal.aborted) return;
      publish({ status: 'ready', lines,
        selectedId: lines.some((line) => line.id === state.selectedId) ? state.selectedId : null,
        refreshing: false, error: null });
    } catch (error) {
      if (!active || generation !== requestId || controller.signal.aborted) return;
      publish({ status: state.lines.length ? 'ready' : 'error', refreshing: false,
        error: error instanceof ProductLinesError ? error.message : 'No pudimos cargar las líneas. Inténtalo de nuevo.' });
    } finally {
      if (requestId === generation) pending = null;
    }
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start() { if (active) return; active = true; void refresh(); },
    stop() { active = false; generation++; pending?.abort(); pending = null; state = { ...state, refreshing: false }; },
    refresh,
    selectLine(id: string) { if (active && state.lines.some((line) => line.id === id)) publish({ selectedId: id }); },
  };
}
