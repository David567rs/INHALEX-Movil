import { CatalogError } from '../../../catalog/domain/errors/CatalogError';
import type { CatalogProduct } from '../../../catalog/domain/models/Catalog';
import { CATALOG_SEARCH_MAX_LENGTH, type ListCatalog } from '../../../catalog/domain/useCases/listCatalog';
import { ProductLinesError } from '../../../productLines/domain/errors/ProductLinesError';
import type { ProductLine } from '../../../productLines/domain/models/ProductLine';
import type { ListProductLines } from '../../../productLines/domain/useCases/listProductLines';

export interface HomeState {
  readonly status: 'loading' | 'ready' | 'empty' | 'error';
  readonly products: readonly CatalogProduct[];
  readonly total: number;
  readonly searchQuery: string;
  readonly appliedQuery: string;
  readonly selectedCategoryId: string;
  readonly categories: readonly ProductLine[];
  readonly categoriesLoading: boolean;
  readonly categoriesErrorMessage: string | null;
  readonly errorMessage: string | null;
  readonly refreshing: boolean;
}

/** The home screen shares public catalog use cases, without owning HTTP or session state. */
export function createHomeController(listCatalog: ListCatalog, listProductLines: ListProductLines) {
  let state: HomeState = Object.freeze({
    status: 'loading', products: [], total: 0, searchQuery: '', appliedQuery: '',
    selectedCategoryId: 'all', categories: [], categoriesLoading: false,
    categoriesErrorMessage: null, errorMessage: null, refreshing: false,
  });
  let active = false;
  let hasResult = false;
  let productsGeneration = 0;
  let categoriesGeneration = 0;
  let pendingProducts: AbortController | null = null;
  let pendingCategories: AbortController | null = null;
  let productsPromise: Promise<void> | null = null;
  let categoriesPromise: Promise<void> | null = null;
  const listeners = new Set<() => void>();

  function publish(patch: Partial<HomeState>) {
    state = Object.freeze({ ...state, ...patch });
    for (const listener of [...listeners]) {
      try { listener(); }
      catch { /* A presentation observer cannot turn a completed read into a failure. */ }
    }
  }

  function loadProducts(replace = false): Promise<void> {
    if (!active) return Promise.resolve();
    if (pendingProducts && !replace) return productsPromise ?? Promise.resolve();
    pendingProducts?.abort();
    const controller = new AbortController();
    const requestId = ++productsGeneration;
    pendingProducts = controller;
    const { appliedQuery, selectedCategoryId } = state;
    const current = () => active && productsGeneration === requestId && !controller.signal.aborted;
    const operation = Promise.resolve().then(async () => {
      try {
        if (!current()) return;
        const result = await listCatalog({ page: 1, limit: 6,
          ...(selectedCategoryId === 'all' ? {} : { category: selectedCategoryId }),
          ...(appliedQuery ? { search: appliedQuery } : {}),
        }, { signal: controller.signal });
        if (!current()) return;
        hasResult = true;
        publish({ status: result.items.length ? 'ready' : 'empty',
          products: Object.freeze([...result.items]), total: result.total,
          refreshing: false, errorMessage: null });
      } catch (error) {
        if (!current()) return;
        publish({ status: hasResult ? (state.products.length ? 'ready' : 'empty') : 'error',
          refreshing: false, errorMessage: error instanceof CatalogError
            ? error.message : 'No pudimos cargar los productos. Inténtalo de nuevo.' });
      } finally {
        if (pendingProducts === controller) { pendingProducts = null; productsPromise = null; }
      }
    });
    productsPromise = operation;
    publish({ status: hasResult ? (state.products.length ? 'ready' : 'empty') : 'loading',
      refreshing: hasResult, errorMessage: null });
    return operation;
  }

  function loadCategories(): Promise<void> {
    if (!active) return Promise.resolve();
    if (pendingCategories) return categoriesPromise ?? Promise.resolve();
    const controller = new AbortController();
    const requestId = ++categoriesGeneration;
    pendingCategories = controller;
    const current = () => active && categoriesGeneration === requestId && !controller.signal.aborted;
    const operation = Promise.resolve().then(async () => {
      try {
        if (!current()) return;
        const categories = await listProductLines({ signal: controller.signal });
        if (!current()) return;
        publish({ categories: Object.freeze([...categories]), categoriesLoading: false, categoriesErrorMessage: null });
        if (state.selectedCategoryId !== 'all' && !categories.some((category) => category.id === state.selectedCategoryId)) {
          await applyFilters(state.appliedQuery, 'all');
        }
      } catch (error) {
        if (!current()) return;
        publish({ categoriesLoading: false, categoriesErrorMessage: error instanceof ProductLinesError
          ? error.message : 'No pudimos cargar las categorías. Inténtalo de nuevo.' });
      } finally {
        if (pendingCategories === controller) { pendingCategories = null; categoriesPromise = null; }
      }
    });
    categoriesPromise = operation;
    publish({ categoriesLoading: true, categoriesErrorMessage: null });
    return operation;
  }

  function applyFilters(appliedQuery: string, selectedCategoryId: string): Promise<void> {
    if (!active) return Promise.resolve();
    const changed = appliedQuery !== state.appliedQuery || selectedCategoryId !== state.selectedCategoryId;
    if (changed) {
      pendingProducts?.abort();
      productsGeneration++;
      hasResult = false;
      // Never show products from the previous query under a newly selected category or term.
      publish({ appliedQuery, selectedCategoryId, products: [], total: 0,
        status: 'loading', refreshing: false, errorMessage: null });
    }
    return loadProducts(changed);
  }

  async function refresh(): Promise<void> {
    await Promise.all([loadProducts(), loadCategories()]);
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start(): Promise<void> {
      if (active) return Promise.all([productsPromise, categoriesPromise]).then(() => undefined);
      active = true;
      return refresh();
    },
    stop() {
      active = false;
      productsGeneration++;
      categoriesGeneration++;
      pendingProducts?.abort();
      pendingCategories?.abort();
      pendingProducts = null; pendingCategories = null;
      productsPromise = null; categoriesPromise = null;
      state = Object.freeze({ ...state, refreshing: false, categoriesLoading: false });
    },
    setSearchQuery(searchQuery: string) {
      if (typeof searchQuery === 'string' && searchQuery !== state.searchQuery) publish({ searchQuery });
    },
    submitSearch(): Promise<void> {
      const query = state.searchQuery.trim();
      if (query.length > CATALOG_SEARCH_MAX_LENGTH) {
        publish({ errorMessage: 'Usa hasta 100 caracteres para buscar un producto.' });
        return Promise.resolve();
      }
      return applyFilters(query, state.selectedCategoryId);
    },
    selectCategory(categoryId: string): Promise<void> {
      if (categoryId !== 'all' && !state.categories.some((category) => category.id === categoryId)) return Promise.resolve();
      return applyFilters(state.appliedQuery, categoryId);
    },
    resetFilters(): Promise<void> {
      publish({ searchQuery: '' });
      return applyFilters('', 'all');
    },
    refresh,
    retry: refresh,
  };
}
