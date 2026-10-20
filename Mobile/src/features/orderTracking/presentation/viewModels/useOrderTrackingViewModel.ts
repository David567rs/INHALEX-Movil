import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';
import { useOrderTrackingController } from '../context/OrderTrackingProvider';
import { trackingTimeline, trackingStatusLabel } from '../state/trackingTimeline';
import { trackingRouteState } from '../state/trackingRouteState';

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
export const formatTrackingPrice = (amount: number) => `${money.format(amount)} MXN`;
export { formatTrackingDate, trackingStatusLabel, trackingTimeline, type OrderTrackingStep } from '../state/trackingTimeline';

export function useOrderTrackingViewModel(orderId: string | null) {
  const controller = useOrderTrackingController();
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const state = trackingRouteState(snapshot, orderId);
  const session = useAuthSession();
  const [openingSignIn, setOpeningSignIn] = useState(false);
  const signInPending = useRef(false);
  useFocusEffect(useCallback(() => {
    const current = controller.getSnapshot();
    if (current.selectedOrderId === orderId && current.order && !current.refreshing) void controller.refresh();
    else void controller.selectOrder(orderId);
    return () => { void controller.selectOrder(null); };
  }, [controller, orderId]));
  async function prepareSignIn() {
    if (signInPending.current) return false;
    signInPending.current = true; setOpeningSignIn(true);
    try { if (state.status === 'session-expired') await session.signOut(); }
    catch { /* Authentication keeps any secure-storage warning. */ }
    finally { signInPending.current = false; setOpeningSignIn(false); }
    return true;
  }
  return {
    ...state, openingSignIn, busy: state.status === 'loading' || state.refreshing,
    canRefresh: !!state.selectedOrderId && !state.refreshing
      && (state.status === 'ready' || state.status === 'error' || state.status === 'not-found'),
    timeline: state.order ? trackingTimeline(state.order) : [],
    statusLabel: state.order ? trackingStatusLabel(state.order.status) : null,
    prepareSignIn, restoreSession: session.restore, refresh: controller.refresh,
  };
}
