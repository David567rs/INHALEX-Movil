import type { AuthSession, AuthSessionState } from '../../../auth/domain/session/AuthSession';
import { ReviewsError } from '../../domain/errors/ReviewsError';
import type { ProductReview, ReviewableProduct, ReviewCollection } from '../../domain/models/Review';
import type { ReviewsActions } from '../../domain/repositories/ReviewsRepository';
import { validateReviewDraft } from '../../domain/useCases/reviewsActions';

export type ReviewsState = Readonly<{
  status: 'checking' | 'anonymous' | 'recovery-error' | 'loading' | 'ready' | 'error' | 'session-expired';
  /** null means no successful collection read, never an empty collection. */
  collection: ReviewCollection | null;
  selectedProductId: string | null;
  rating: number;
  comment: string;
  fieldErrors: Readonly<{ rating?: string; comment?: string }>;
  refreshing: boolean;
  publishing: boolean;
  requiresRefresh: boolean;
  error: string | null;
  publishError: string | null;
  notice: string | null;
}>;

function initialState(auth: AuthSessionState): ReviewsState {
  return Object.freeze({
    status: auth.status === 'authenticated' ? (auth.user ? 'loading' : 'anonymous') : auth.status,
    collection: null, selectedProductId: null, rating: 0, comment: '', fieldErrors: Object.freeze({}),
    refreshing: false, publishing: false, requiresRefresh: false,
    error: auth.message, publishError: null, notice: null,
  });
}
function publicReview(review: ProductReview): ProductReview {
  return Object.freeze({ id: review.id, userName: review.userName, productId: review.productId,
    productName: review.productName, productSlug: review.productSlug, productImage: review.productImage,
    orderId: review.orderId, orderReference: review.orderReference, rating: review.rating,
    comment: review.comment, status: review.status, createdAt: review.createdAt });
}
function publicProduct(item: ReviewableProduct): ReviewableProduct {
  return Object.freeze({ orderId: item.orderId, orderReference: item.orderReference, productId: item.productId,
    productName: item.productName, productSlug: item.productSlug, productImage: item.productImage,
    presentation: item.presentation, purchasedAt: item.purchasedAt,
    review: item.review ? publicReview(item.review) : null });
}
const clearedDraft = () => ({ selectedProductId: null, rating: 0, comment: '', fieldErrors: Object.freeze({}) });

export function createReviewsController(session: AuthSession, actions: ReviewsActions) {
  let visibleAuth = session.getSnapshot();
  let state = initialState(visibleAuth);
  let observedAuth: AuthSessionState | null = null;
  let expiredAuth: AuthSessionState | null = null;
  let hiddenAuth: AuthSessionState | null = null;
  let hiddenState: ReviewsState | null = null;
  let active = false;
  let generation = 0;
  let pending: AbortController | null = null;
  let unsubscribe: (() => void) | null = null;
  let uncertainProductId: string | null = null;
  // A stale GET must not offer a second publication after an acknowledged POST.
  const confirmed = new Map<string, ReviewableProduct>();
  const listeners = new Set<() => void>();

  function publish(patch: Partial<ReviewsState>) {
    state = Object.freeze({ ...state, ...patch });
    if (observedAuth) visibleAuth = observedAuth;
    for (const listener of [...listeners]) {
      try { listener(); } catch { /* Observers cannot turn a confirmed write into a failure. */ }
    }
  }
  function cancel() { generation++; pending?.abort(); pending = null; }
  function available() {
    return active && observedAuth?.status === 'authenticated' && !!observedAuth.user
      && observedAuth === session.getSnapshot() && observedAuth !== expiredAuth;
  }
  function current(auth: AuthSessionState, requestId: number, request: AbortController) {
    return available() && observedAuth === auth && generation === requestId
      && pending === request && !request.signal.aborted;
  }
  function expiredState(auth: AuthSessionState): ReviewsState {
    return Object.freeze({ ...initialState(auth), status: 'session-expired',
      error: 'Tu sesión ya no es válida. Inicia sesión para consultar tus reseñas.' });
  }
  function authorizationFailure(error: unknown, auth: AuthSessionState) {
    if (!(error instanceof ReviewsError)) return false;
    if (error.kind !== 'unauthorized' && error.kind !== 'forbidden') return false;
    cancel(); uncertainProductId = null; confirmed.clear();
    if (error.kind === 'unauthorized') {
      expiredAuth = auth; publish(expiredState(auth));
    } else {
      publish({ ...initialState(auth), status: 'error', error: error.message, requiresRefresh: true });
    }
    return true;
  }
  function collectionSnapshot(collection: ReviewCollection): ReviewCollection {
    const completed = new Map(collection.completed.map((item) => [item.productId, publicProduct(item)]));
    for (const [id, item] of confirmed) {
      if (!completed.has(id)) completed.set(id, item);
    }
    const awaiting = new Map(collection.pending.filter((item) => !completed.has(item.productId))
      .map((item) => [item.productId, publicProduct(item)]));
    return Object.freeze({ pending: Object.freeze([...awaiting.values()]), completed: Object.freeze([...completed.values()]) });
  }
  function applyCollection(collection: ReviewCollection) {
    const snapshot = collectionSnapshot(collection);
    const recovered = uncertainProductId !== null
      && snapshot.completed.some((item) => item.productId === uncertainProductId && item.review !== null);
    const keepDraft = state.selectedProductId !== null
      && snapshot.pending.some((item) => item.productId === state.selectedProductId);
    uncertainProductId = null;
    publish({ status: 'ready', collection: snapshot, refreshing: false, publishing: false,
      requiresRefresh: false, error: null, publishError: null,
      ...(keepDraft ? {} : clearedDraft()),
      notice: recovered ? 'Esta reseña ya está registrada.' : state.notice });
  }
  async function refresh(): Promise<void> {
    const auth = observedAuth;
    if (!available() || !auth || pending) return;
    const request = new AbortController();
    const requestId = generation;
    pending = request;
    publish({ status: state.collection === null ? 'loading' : 'ready', refreshing: state.collection !== null,
      error: null });
    try {
      if (!current(auth, requestId, request)) return;
      const result = await actions.list({ signal: request.signal });
      if (!current(auth, requestId, request)) return;
      pending = null; applyCollection(result);
    } catch (error) {
      if (!current(auth, requestId, request)) return;
      if (authorizationFailure(error, auth)) return;
      pending = null;
      publish({ status: state.collection === null ? 'error' : 'ready', refreshing: false, requiresRefresh: true,
        error: error instanceof ReviewsError ? error.message : 'No pudimos cargar tus reseñas. Inténtalo de nuevo.' });
    } finally { if (pending === request) pending = null; }
  }
  async function publishReview(): Promise<void> {
    const auth = observedAuth;
    const product = state.collection?.pending.find((item) => item.productId === state.selectedProductId);
    if (!available() || !auth || pending || !product || state.status !== 'ready' || state.requiresRefresh) return;
    const fieldErrors = validateReviewDraft(state.rating, state.comment);
    if (Object.keys(fieldErrors).length > 0) {
      publish({ fieldErrors: Object.freeze({ ...fieldErrors }), publishError: 'Revisa los campos indicados.', notice: null });
      return;
    }
    const input = { productId: product.productId, orderId: product.orderId, rating: state.rating, comment: state.comment.trim() };
    const request = new AbortController();
    const requestId = generation;
    pending = request;
    publish({ publishing: true, fieldErrors: Object.freeze({}), publishError: null, notice: null, error: null });
    try {
      if (!current(auth, requestId, request)) return;
      const result = await actions.publish(input, { signal: request.signal });
      if (!current(auth, requestId, request)) return;
      if (result.productId !== product.productId || result.orderId !== product.orderId) {
        throw new ReviewsError('No pudimos confirmar la reseña enviada. Actualiza antes de intentarlo de nuevo.', 'invalid-response');
      }
      const registered = publicProduct({ ...product, review: result });
      confirmed.set(product.productId, registered);
      uncertainProductId = null;
      const collection = collectionSnapshot({ pending: state.collection!.pending,
        completed: [registered, ...state.collection!.completed.filter((item) => item.productId !== product.productId)] });
      pending = null;
      publish({ collection, ...clearedDraft(), publishing: false, requiresRefresh: false, publishError: null,
        notice: result.status === 'published' ? 'Tu reseña se publicó correctamente.' : 'Tu reseña se guardó correctamente.' });
    } catch (error) {
      if (!current(auth, requestId, request)) return;
      if (authorizationFailure(error, auth)) return;
      pending = null;
      uncertainProductId = product.productId;
      publish({ publishing: false, requiresRefresh: true,
        publishError: error instanceof ReviewsError ? error.message : 'No pudimos confirmar la publicación. Actualiza antes de intentarlo de nuevo.' });
      // A conflict is an existing review, never a successful new publication.
      if (error instanceof ReviewsError && error.kind === 'conflict') await refresh();
    } finally { if (pending === request) pending = null; }
  }
  function synchronize() {
    const auth = session.getSnapshot();
    if (!active || observedAuth === auth) return;
    cancel(); observedAuth = auth; uncertainProductId = null; confirmed.clear();
    if (auth === expiredAuth) { publish(expiredState(auth)); return; }
    expiredAuth = null; publish(initialState(auth));
    if (available()) void refresh();
  }
  return {
    getSnapshot(): ReviewsState {
      const auth = session.getSnapshot();
      if (auth === visibleAuth) return state;
      if (hiddenAuth !== auth || !hiddenState) {
        hiddenAuth = auth; hiddenState = auth === expiredAuth ? expiredState(auth) : initialState(auth);
      }
      return hiddenState;
    },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start() {
      if (active) return;
      active = true; unsubscribe = session.subscribe(synchronize); synchronize();
    },
    stop() {
      if (!active) return;
      active = false; unsubscribe?.(); unsubscribe = null; cancel(); observedAuth = null;
      uncertainProductId = null; confirmed.clear(); visibleAuth = session.getSnapshot();
      state = visibleAuth === expiredAuth ? expiredState(visibleAuth) : initialState(visibleAuth);
    },
    refresh, publishReview,
    selectProduct(id: string | null) {
      if (!available() || pending || state.requiresRefresh && id !== null || state.status !== 'ready'
        || id !== null && !state.collection?.pending.some((item) => item.productId === id)) return;
      if (id === state.selectedProductId) return;
      publish({ ...clearedDraft(), selectedProductId: id, publishError: null, notice: null });
    },
    setRating(rating: number) {
      if (!available() || pending || !state.selectedProductId || !Number.isInteger(rating) || rating < 0 || rating > 5) return;
      publish({ rating, fieldErrors: Object.freeze({ ...state.fieldErrors, rating: undefined }), publishError: null, notice: null });
    },
    setComment(comment: string) {
      if (!available() || pending || !state.selectedProductId || typeof comment !== 'string') return;
      publish({ comment: comment.slice(0, 700), fieldErrors: Object.freeze({ ...state.fieldErrors, comment: undefined }), publishError: null, notice: null });
    },
  };
}

export type ReviewsController = ReturnType<typeof createReviewsController>;
