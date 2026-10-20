import type { AuthSession, AuthSessionState } from '../../../auth/domain/session/AuthSession';
import { OrderHistoryError } from '../../domain/errors/OrderHistoryError';
import type { OrderHistoryDetail, OrderHistorySummary } from '../../domain/models/OrderHistory';
import type { OrderHistoryActions } from '../../domain/repositories/OrderHistoryRepository';

export interface OrderHistoryState {
  readonly status: 'checking' | 'anonymous' | 'recovery-error' | 'loading' | 'ready' | 'error' | 'session-expired';
  /** null means no successful list response; [] is a confirmed empty history. */
  readonly orders: readonly OrderHistorySummary[] | null;
  readonly refreshing: boolean;
  readonly loadingMore: boolean;
  readonly nextCursor: string | null;
  readonly selectedOrderId: string | null;
  readonly detail: OrderHistoryDetail | null;
  readonly detailLoading: boolean;
  readonly error: string | null;
  readonly loadMoreError: string | null;
  readonly detailError: string | null;
}

function initialState(auth: AuthSessionState): OrderHistoryState {
  return Object.freeze({
    status: auth.status === 'authenticated' ? (auth.user ? 'loading' : 'anonymous') : auth.status,
    orders: null, refreshing: false, loadingMore: false, nextCursor: null,
    selectedOrderId: null, detail: null, detailLoading: false,
    error: auth.message, loadMoreError: null, detailError: null,
  });
}

function expiredState(auth: AuthSessionState): OrderHistoryState {
  return Object.freeze({ ...initialState(auth), status: 'session-expired',
    error: 'Tu sesión ya no es válida. Inicia sesión de nuevo para consultar tus pedidos.' });
}

function publicSummary(order: OrderHistorySummary): OrderHistorySummary {
  return Object.freeze({ id: order.id, reference: order.reference, status: order.status,
    currency: order.currency, unitCount: order.unitCount, subtotal: order.subtotal, createdAt: order.createdAt });
}

function confirmedOrders(orders: readonly OrderHistorySummary[]): readonly OrderHistorySummary[] {
  return Object.freeze([...new Map(orders.map((order) => [order.id, publicSummary(order)])).values()]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt)
      || (left.id < right.id ? 1 : left.id > right.id ? -1 : 0)));
}

function publicDetail(order: OrderHistoryDetail): OrderHistoryDetail {
  const address = order.shippingAddress;
  return Object.freeze({ ...publicSummary(order),
    items: Object.freeze(order.items.map((item) => Object.freeze({ productId: item.productId,
      productName: item.productName, presentation: item.presentation, image: item.image,
      quantity: item.quantity, unitPrice: item.unitPrice, subtotal: item.subtotal, currency: item.currency }))),
    shippingAddress: address ? Object.freeze({ label: address.label, recipientName: address.recipientName,
      phone: address.phone, street: address.street, exteriorNumber: address.exteriorNumber,
      interiorNumber: address.interiorNumber, neighborhood: address.neighborhood,
      municipality: address.municipality, state: address.state, postalCode: address.postalCode,
      references: address.references }) : null,
  });
}

const safeError = (error: unknown, fallback: string) => error instanceof OrderHistoryError ? error.message : fallback;

/** Read-only module: private authorization identity guards every asynchronous result. */
export function createOrderHistoryController(session: AuthSession, actions: OrderHistoryActions) {
  let visibleAuth = session.getSnapshot();
  let state = initialState(visibleAuth);
  let hiddenAuth: AuthSessionState | null = null;
  let hiddenState: OrderHistoryState | null = null;
  let active = false;
  let generation = 0;
  let observedSession: AuthSessionState | null = null;
  let expiredSession: AuthSessionState | null = null;
  let unsubscribeSession: (() => void) | null = null;
  let pendingList: AbortController | null = null;
  let pendingDetail: AbortController | null = null;
  let pendingDetailId: string | null = null;
  const consumedCursors = new Set<string>();
  const listeners = new Set<() => void>();

  function publish(patch: Partial<OrderHistoryState>) {
    state = Object.freeze({ ...state, ...patch });
    if (observedSession) visibleAuth = observedSession;
    for (const listener of [...listeners]) {
      try { listener(); }
      catch { /* Presentation observers cannot change a confirmed response. */ }
    }
  }

  function cancelDetail() {
    pendingDetail?.abort();
    pendingDetail = null;
    pendingDetailId = null;
  }

  function cancelOperations() {
    generation++;
    pendingList?.abort();
    pendingList = null;
    cancelDetail();
  }

  function available() {
    return active && observedSession?.status === 'authenticated' && !!observedSession.user
      && session.getSnapshot() === observedSession && observedSession !== expiredSession;
  }

  function current(auth: AuthSessionState, requestId: number, controller: AbortController) {
    return available() && generation === requestId && !controller.signal.aborted && observedSession === auth;
  }

  function expireSession(auth: AuthSessionState) {
    expiredSession = auth;
    cancelOperations();
    consumedCursors.clear();
    publish(expiredState(auth));
  }

  async function fetchDetail(id: string): Promise<void> {
    const auth = observedSession;
    if (!available() || !auth || state.selectedOrderId !== id || !state.orders?.some((order) => order.id === id)) return;
    if (pendingDetail && pendingDetailId === id) return;
    cancelDetail();
    const controller = new AbortController();
    const requestId = generation;
    pendingDetail = controller;
    pendingDetailId = id;
    publish({ detailLoading: true, detailError: null });
    const detailIsCurrent = () => current(auth, requestId, controller)
      && pendingDetail === controller && state.selectedOrderId === id;
    try {
      if (!detailIsCurrent()) return;
      const result = await actions.get(id, { signal: controller.signal });
      if (!detailIsCurrent()) return;
      if (result.id !== id) throw new OrderHistoryError('No pudimos confirmar el pedido seleccionado. Inténtalo de nuevo.', 'invalid-response');
      const detail = publicDetail(result);
      pendingDetail = null;
      pendingDetailId = null;
      publish({ detail, detailLoading: false, detailError: null });
    } catch (error) {
      if (!detailIsCurrent()) return;
      if (error instanceof OrderHistoryError && error.kind === 'unauthorized') { expireSession(auth); return; }
      pendingDetail = null;
      pendingDetailId = null;
      publish({ detailLoading: false,
        detailError: safeError(error, 'No pudimos cargar el resumen de tu pedido. Inténtalo de nuevo.') });
    } finally {
      if (pendingDetail === controller) { pendingDetail = null; pendingDetailId = null; }
    }
  }

  async function refresh(): Promise<void> {
    const auth = observedSession;
    if (!available() || !auth || (pendingList && !state.loadingMore)) return;
    cancelOperations();
    const controller = new AbortController();
    const requestId = generation;
    pendingList = controller;
    publish({ status: state.orders === null ? 'loading' : 'ready', refreshing: state.orders !== null,
      loadingMore: false, detailLoading: false, error: null, loadMoreError: null });
    const listIsCurrent = () => current(auth, requestId, controller) && pendingList === controller;
    try {
      if (!listIsCurrent()) return;
      const result = await actions.list(undefined, { signal: controller.signal });
      if (!listIsCurrent()) return;
      const orders = confirmedOrders(result.orders);
      const selectedOrderId = orders.some((order) => order.id === state.selectedOrderId) ? state.selectedOrderId : null;
      consumedCursors.clear();
      pendingList = null;
      publish({ status: 'ready', orders, nextCursor: result.nextCursor, refreshing: false,
        error: null, selectedOrderId, detail: null, detailError: null });
      // Re-read a selected receipt after a fresh list so status or amounts never contradict it.
      if (selectedOrderId && current(auth, requestId, controller) && state.selectedOrderId === selectedOrderId) {
        await fetchDetail(selectedOrderId);
      }
    } catch (error) {
      if (!listIsCurrent()) return;
      if (error instanceof OrderHistoryError && error.kind === 'unauthorized') { expireSession(auth); return; }
      pendingList = null;
      publish({ status: state.orders === null ? 'error' : 'ready', refreshing: false,
        error: safeError(error, 'No pudimos cargar tus pedidos. Inténtalo de nuevo.'),
        detailError: state.selectedOrderId && !state.detail && !state.detailError
          ? 'No pudimos actualizar el resumen del pedido. Inténtalo de nuevo.' : state.detailError });
    } finally {
      if (pendingList === controller) pendingList = null;
    }
  }

  async function loadMore(): Promise<void> {
    const auth = observedSession;
    const cursor = state.nextCursor;
    if (!available() || !auth || pendingList || !cursor || state.orders === null || state.status !== 'ready') return;
    const controller = new AbortController();
    const requestId = generation;
    pendingList = controller;
    publish({ loadingMore: true, loadMoreError: null });
    const listIsCurrent = () => current(auth, requestId, controller) && pendingList === controller;
    try {
      if (!listIsCurrent()) return;
      const result = await actions.list(cursor, { signal: controller.signal });
      if (!listIsCurrent()) return;
      if (result.nextCursor && (result.nextCursor === cursor || consumedCursors.has(result.nextCursor))) {
        throw new OrderHistoryError('No pudimos continuar el historial. Actualiza tus pedidos antes de intentarlo de nuevo.', 'invalid-response');
      }
      const ids = new Set(state.orders!.map((order) => order.id));
      const orders = confirmedOrders([...state.orders!, ...result.orders.filter((order) => !ids.has(order.id))]);
      consumedCursors.add(cursor);
      pendingList = null;
      publish({ orders, nextCursor: result.nextCursor, loadingMore: false, loadMoreError: null });
    } catch (error) {
      if (!listIsCurrent()) return;
      if (error instanceof OrderHistoryError && error.kind === 'unauthorized') { expireSession(auth); return; }
      pendingList = null;
      publish({ loadingMore: false,
        loadMoreError: safeError(error, 'No pudimos cargar más pedidos. Inténtalo de nuevo.') });
    } finally {
      if (pendingList === controller) pendingList = null;
    }
  }

  function synchronizeSession() {
    const auth = session.getSnapshot();
    if (!active || observedSession === auth) return;
    cancelOperations();
    consumedCursors.clear();
    observedSession = auth;
    if (auth === expiredSession) { publish(expiredState(auth)); return; }
    expiredSession = null;
    publish(initialState(auth));
    if (auth.status === 'authenticated' && auth.user) void refresh();
  }

  return {
    getSnapshot(): OrderHistoryState {
      const auth = session.getSnapshot();
      if (auth === visibleAuth) return state;
      // Hide the former owner's data even before a delayed session notification is delivered.
      if (hiddenAuth !== auth || !hiddenState) {
        hiddenAuth = auth;
        hiddenState = auth === expiredSession ? expiredState(auth) : initialState(auth);
      }
      return hiddenState;
    },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    start() {
      if (active) return;
      active = true;
      unsubscribeSession = session.subscribe(synchronizeSession);
      synchronizeSession();
    },
    stop() {
      if (!active) return;
      active = false;
      unsubscribeSession?.(); unsubscribeSession = null;
      cancelOperations(); consumedCursors.clear(); observedSession = null;
      visibleAuth = session.getSnapshot();
      state = visibleAuth === expiredSession ? expiredState(visibleAuth) : initialState(visibleAuth);
    },
    refresh,
    loadMore,
    async selectOrder(id: string | null): Promise<void> {
      if (!available() || pendingList && !state.loadingMore) return;
      if (id !== null && !state.orders?.some((order) => order.id === id)) return;
      if (id === state.selectedOrderId) return;
      cancelDetail();
      publish({ selectedOrderId: id, detail: null, detailLoading: false, detailError: null });
      if (id !== null) await fetchDetail(id);
    },
    retryDetail: () => state.selectedOrderId && !pendingList ? fetchDetail(state.selectedOrderId) : Promise.resolve(),
  };
}

export type OrderHistoryController = ReturnType<typeof createOrderHistoryController>;
