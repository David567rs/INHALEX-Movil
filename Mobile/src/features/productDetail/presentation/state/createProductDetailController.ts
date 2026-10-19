import { ProductDetailError } from '../../domain/errors/ProductDetailError';
import type { ProductDetail } from '../../domain/models/ProductDetail';
import type { GetProductDetail } from '../../domain/useCases/getProductDetail';

export interface ProductDetailState {
  readonly status: 'loading' | 'ready' | 'not-found' | 'error';
  readonly product: ProductDetail | null;
  readonly refreshing: boolean;
  readonly error: string | null;
}

/** Each route owns its controller. Stopped or superseded requests cannot publish. */
export function createProductDetailController(productId: string, getProduct: GetProductDetail) {
  let state: ProductDetailState = { status: 'loading', product: null, refreshing: false, error: null };
  const listeners = new Set<() => void>();
  let active = false;
  let generation = 0;
  let pending: AbortController | null = null;
  function publish(patch: Partial<ProductDetailState>) {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  }

  async function load(): Promise<void> {
    if (!active || pending) return;
    const request = new AbortController();
    pending = request;
    const requestId = ++generation;
    publish({ status: state.product ? 'ready' : 'loading', refreshing: state.product !== null, error: null });
    try {
      const product = await getProduct(productId, { signal: request.signal });
      if (!active || requestId !== generation || request.signal.aborted) return;
      publish({ status: 'ready', product, refreshing: false, error: null });
    } catch (error) {
      if (!active || requestId !== generation || request.signal.aborted) return;
      const known = error instanceof ProductDetailError;
      const notFound = known && error.kind === 'not-found';
      const retainProduct = state.product !== null && known
        && (error.kind === 'network' || error.kind === 'timeout' || error.kind === 'server');
      publish({
        status: notFound ? 'not-found' : retainProduct ? 'ready' : 'error',
        product: retainProduct ? state.product : null,
        refreshing: false,
        error: known ? error.message : 'No pudimos cargar el producto. Inténtalo de nuevo.',
      });
    } finally {
      if (requestId === generation) pending = null;
    }
  }

  return {
    getSnapshot: () => state,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start() { if (active) return; active = true; void load(); },
    stop() {
      active = false;
      generation++;
      pending?.abort();
      pending = null;
      state = { ...state, refreshing: false };
    },
    refresh: load,
  };
}
