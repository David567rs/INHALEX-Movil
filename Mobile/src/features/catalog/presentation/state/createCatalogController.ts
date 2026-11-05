import { CatalogError } from '../../domain/errors/CatalogError';
import type { CatalogProduct } from '../../domain/models/Catalog';
import { CATALOG_SEARCH_MAX_LENGTH, type ListCatalog } from '../../domain/useCases/listCatalog';

export interface CatalogState {
  readonly status: 'loading' | 'ready' | 'error';
  readonly products: readonly CatalogProduct[];
  readonly total: number;
  readonly page: number;
  readonly totalPages: number;
  readonly refreshing: boolean;
  readonly loadingMore: boolean;
  readonly error: string | null;
  readonly moreError: string | null;
  readonly searchQuery: string;
  readonly appliedQuery: string;
}

const safeError = (error: unknown) => error instanceof CatalogError
  ? error.message : 'No pudimos cargar el catálogo. Inténtalo de nuevo.';

/** ViewModel state independent of React: only the most recent request can publish. */
export function createCatalogController(listCatalog: ListCatalog) {
  let state: CatalogState = {
    status: 'loading', products: [], total: 0, page: 0, totalPages: 1,
    refreshing: false, loadingMore: false, error: null, moreError: null,
    searchQuery: '', appliedQuery: '',
  };
  const listeners = new Set<() => void>();
  let active = false;
  let generation = 0;
  let pending: AbortController | null = null;
  const publish = (patch: Partial<CatalogState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };

  async function load(firstPage: boolean): Promise<void> {
    if (!active || (pending && (firstPage ? !state.loadingMore : true))) return;
    if (!firstPage && (state.status !== 'ready' || state.page >= state.totalPages)) return;
    pending?.abort();
    const controller = new AbortController();
    pending = controller;
    const requestId = ++generation;
    const page = firstPage ? 1 : state.page + 1;
    publish(firstPage
      ? { status: state.products.length ? 'ready' : 'loading', refreshing: state.products.length > 0, loadingMore: false, error: null, moreError: null }
      : { loadingMore: true, moreError: null });
    try {
      const result = await listCatalog({ page, limit: 20,
        ...(state.appliedQuery ? { search: state.appliedQuery } : {}),
      }, { signal: controller.signal });
      if (!active || requestId !== generation || controller.signal.aborted) return;
      // A changing collection can invalidate a later page. Restart once at page 1.
      if (!firstPage && result.page > result.totalPages) {
        pending = null;
        await load(true);
        return;
      }
      const products = firstPage ? result.items : [...new Map(
        [...state.products, ...result.items].map((product) => [product.id, product]),
      ).values()];
      publish({ status: 'ready', products, total: result.total, page: result.page,
        totalPages: result.totalPages, refreshing: false, loadingMore: false, error: null, moreError: null });
    } catch (error) {
      if (!active || requestId !== generation || controller.signal.aborted) return;
      publish(firstPage
        ? { status: state.products.length ? 'ready' : 'error', refreshing: false, loadingMore: false, error: safeError(error) }
        : { loadingMore: false, moreError: safeError(error) });
    } finally {
      if (requestId === generation) pending = null;
    }
  }

  function applySearch(query: string): Promise<void> {
    if (!active) return Promise.resolve();
    if (query !== state.appliedQuery) {
      // A new term owns a fresh collection: never merge late pages from another search.
      generation++;
      pending?.abort();
      pending = null;
      publish({ appliedQuery: query, products: [], total: 0, page: 0, totalPages: 1,
        status: 'loading', refreshing: false, loadingMore: false, error: null, moreError: null });
    }
    return load(true);
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start() { if (active) return; active = true; void load(true); },
    stop() {
      active = false;
      generation++;
      pending?.abort();
      pending = null;
      state = { ...state, refreshing: false, loadingMore: false };
    },
    refresh: () => load(true),
    loadMore: () => load(false),
    setSearchQuery(query: string) {
      if (typeof query !== 'string' || query === state.searchQuery) return;
      publish({ searchQuery: query.slice(0, CATALOG_SEARCH_MAX_LENGTH) });
      if (!query.trim() && state.appliedQuery) void applySearch('');
    },
    submitSearch: () => applySearch(state.searchQuery.trim()),
    clearSearch() {
      publish({ searchQuery: '' });
      return applySearch('');
    },
  };
}
