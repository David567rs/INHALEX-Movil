import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';
import { useOrderHistoryController } from '../context/OrderHistoryProvider';
import type { OrderHistoryStatus } from '../../domain/models/OrderHistory';

export type HistoryFilter = 'all' | 'in-progress' | 'completed';
const statusLabels: Record<OrderHistoryStatus, string> = {
  pending_review: 'En revisión', confirmed: 'Confirmado', cancelled: 'Cancelado', completed: 'Completado',
};
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const date = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
export const formatHistoryPrice = (amount: number) => `${money.format(amount)} MXN`;
export const formatHistoryDate = (value: string) => date.format(new Date(value));
export const historyStatusLabel = (status: OrderHistoryStatus) => statusLabels[status];

export function useOrderHistoryViewModel() {
  const controller = useOrderHistoryController();
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const session = useAuthSession();
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [openingSignIn, setOpeningSignIn] = useState(false);
  const signInPending = useRef(false);
  useFocusEffect(useCallback(() => {
    const current = controller.getSnapshot();
    if (current.orders !== null && !current.refreshing) void controller.refresh();
  }, [controller]));
  const orders = useMemo(() => (state.orders ?? []).filter((order) => filter === 'all'
    || (filter === 'completed' ? order.status === 'completed'
      : order.status === 'pending_review' || order.status === 'confirmed')), [state.orders, filter]);
  const busy = state.status === 'loading' || state.refreshing || state.loadingMore;
  function selectFilter(next: HistoryFilter) {
    if (busy) return;
    setFilter(next);
    void controller.selectOrder(null);
  }
  async function prepareSignIn() {
    if (signInPending.current) return false;
    signInPending.current = true; setOpeningSignIn(true);
    try { if (state.status === 'session-expired') await session.signOut(); }
    catch { /* The authentication module retains its storage warning. */ }
    finally { signInPending.current = false; setOpeningSignIn(false); }
    return true;
  }
  return { ...state, orders, filter, busy, openingSignIn,
    totalLoaded: state.orders?.length ?? 0,
    isEmpty: state.orders !== null && state.orders.length === 0,
    canRefresh: !busy && (state.status === 'ready' || state.status === 'error'),
    selectFilter, prepareSignIn, restoreSession: session.restore,
    refresh: controller.refresh, loadMore: controller.loadMore, retryDetail: controller.retryDetail,
    selectOrder: (id: string) => controller.selectOrder(state.selectedOrderId === id ? null : id),
  };
}
