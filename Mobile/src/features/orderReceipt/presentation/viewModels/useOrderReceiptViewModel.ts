import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';
import { canConfirmReceipt } from '../../domain/useCases/orderReceiptActions';
import { useOrderReceiptController } from '../context/OrderReceiptProvider';

const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
const moneyFormatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
export const formatReceiptDate = (value: string | null) => value ? dateFormatter.format(new Date(value)) : 'Fecha no disponible';
export const formatReceiptPrice = (value: number) => `${moneyFormatter.format(value)} MXN`;

export function useOrderReceiptViewModel() {
  const controller = useOrderReceiptController();
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const session = useAuthSession();
  const [dialogOrderId, setDialogOrderId] = useState<string | null>(null);
  const [openingSignIn, setOpeningSignIn] = useState(false);
  const signInPending = useRef(false);
  useFocusEffect(useCallback(() => {
    const current = controller.getSnapshot();
    if (current.orders && !current.refreshing && !current.confirming) void controller.refresh();
    return () => { setDialogOrderId(null); controller.selectOrder(null); };
  }, [controller]));
  const busy = state.status === 'loading' || state.refreshing || state.confirming;
  const order = state.orders?.find((item) => item.id === state.selectedOrderId) ?? null;
  const canConfirm = !busy && state.status === 'ready' && !state.requiresRefresh && !!order && canConfirmReceipt(order);
  async function prepareSignIn() {
    if (signInPending.current) return false;
    signInPending.current = true; setOpeningSignIn(true);
    try { if (state.status === 'session-expired') await session.signOut(); }
    catch { /* The auth session retains its storage warning. */ }
    finally { signInPending.current = false; setOpeningSignIn(false); }
    return true;
  }
  return {
    ...state, busy, order, canConfirm, openingSignIn,
    canRefresh: !busy && (state.status === 'ready' || state.status === 'error'),
    canSelect: !busy && state.status === 'ready' && !state.requiresRefresh,
    dialogOpen: canConfirm && order.id === dialogOrderId,
    openDialog() { if (canConfirm) setDialogOrderId(order.id); },
    closeDialog() { setDialogOrderId(null); },
    confirmReceipt() {
      if (!canConfirm || dialogOrderId !== order.id) return;
      setDialogOrderId(null);
      void controller.confirmReceipt();
    },
    selectOrder(id: string | null) { setDialogOrderId(null); controller.selectOrder(id); },
    refresh: controller.refresh, prepareSignIn, restoreSession: session.restore,
  };
}
