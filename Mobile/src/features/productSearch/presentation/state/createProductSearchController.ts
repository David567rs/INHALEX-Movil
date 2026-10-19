import type { CatalogProduct } from '../../../catalog/domain/models/Catalog';
import { ProductSearchError } from '../../domain/errors/ProductSearchError';
import type { SearchProducts } from '../../domain/useCases/searchProducts';

export interface ProductSearchState {
  readonly query: string;
  readonly term: string | null;
  readonly status: 'idle' | 'loading' | 'ready' | 'error';
  readonly products: readonly CatalogProduct[];
  readonly total: number;
  readonly page: number;
  readonly totalPages: number;
  readonly refreshing: boolean;
  readonly loadingMore: boolean;
  readonly error: string | null;
  readonly moreError: string | null;
}

function initialState(query = ''): ProductSearchState {
  return { query, term: null, status: 'idle', products: [], total: 0, page: 0, totalPages: 1,
    refreshing: false, loadingMore: false, error: null, moreError: null };
}

const safeError = (error: unknown) => error instanceof ProductSearchError
  ? error.message : 'No pudimos buscar los productos. Inténtalo de nuevo.';

/** A typed draft never becomes a result until an explicit, successful search. */
export function createProductSearchController(searchProducts: SearchProducts) {
  let state = initialState();
  let active = false;
  let generation = 0;
  let pending: AbortController | null = null;
  const listeners = new Set<() => void>();
  function publish(patch: Partial<ProductSearchState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }
  function cancel() {
    generation++;
    pending?.abort();
    pending = null;
  }

  async function load(term: string, page: number): Promise<void> {
    if (!active) return;
    const firstPage = page === 1;
    if (!firstPage && (pending || state.status !== 'ready' || state.page >= state.totalPages)) return;
    if (firstPage && pending && !state.loadingMore && term === state.term) return;
    cancel();
    const controller = new AbortController();
    pending = controller;
    const requestId = generation;
    const retain = firstPage && state.term === term && state.products.length > 0;
    publish(firstPage
      ? { term, status: retain ? 'ready' : 'loading',
        products: retain ? state.products : [], total: retain ? state.total : 0,
        page: retain ? state.page : 0, totalPages: retain ? state.totalPages : 1,
        refreshing: retain, loadingMore: false, error: null, moreError: null }
      : { loadingMore: true, moreError: null });
    try {
      const result = await searchProducts({ term, page, limit: 20 }, { signal: controller.signal });
      if (!active || generation !== requestId || controller.signal.aborted) return;
      // A collection that shrank while paging must restart at page one.
      if (!firstPage && result.page > result.totalPages) {
        pending = null;
        await load(term, 1);
        return;
      }
      const products = firstPage ? result.items : [...new Map(
        [...state.products, ...result.items].map((product) => [product.id, product]),
      ).values()];
      publish({ term, products, total: result.total, page: result.page, totalPages: result.totalPages,
        status: 'ready', refreshing: false, loadingMore: false, error: null, moreError: null });
    } catch (error) {
      if (!active || generation !== requestId || controller.signal.aborted) return;
      publish(firstPage
        ? { status: retain ? 'ready' : 'error', refreshing: false, loadingMore: false, error: safeError(error) }
        : { loadingMore: false, moreError: safeError(error) });
    } finally {
      if (generation === requestId) pending = null;
    }
  }

  function setQuery(query: string) {
    if (state.query === query) return;
    cancel();
    publish(initialState(query));
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start() { active = true; },
    stop() {
      active = false;
      cancel();
      state = { ...state, status: state.status === 'loading' ? 'idle' : state.status,
        refreshing: false, loadingMore: false };
    },
    setQuery,
    clear: () => setQuery(''),
    search() {
      const term = state.query.trim();
      if (!term) { cancel(); publish(initialState(state.query)); return Promise.resolve(); }
      return load(term, 1);
    },
    retry: () => state.term ? load(state.term, 1) : Promise.resolve(),
    loadMore: () => state.term ? load(state.term, state.page + 1) : Promise.resolve(),
  };
}
