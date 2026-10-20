import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';
import { useOrderCreationController } from '../context/OrderCreationProvider';

export function useOrderCreationViewModel() {
  const controller = useOrderCreationController();
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const session = useAuthSession();
  const [openingSignIn, setOpeningSignIn] = useState(false);
  const signInPending = useRef(false);
  useFocusEffect(useCallback(() => { controller.open(); return controller.close; }, [controller]));
  const currency = state.receipt?.currency ?? state.quote?.currency ?? state.context?.cart.currency ?? 'MXN';
  const formatter = useMemo(() => new Intl.NumberFormat('es-MX', { style: 'currency', currency }), [currency]);
  const format = (amount: number) => `${formatter.format(amount)} ${currency}`;
  const items = useMemo(() => (state.quote?.items ?? []).map((item) => ({ ...item,
    unitPriceLabel: `${formatter.format(item.unitPrice)} ${currency}`,
    lineTotalLabel: `${formatter.format(item.subtotal)} ${currency}`,
  })), [state.quote, formatter, currency]);
  const addresses = useMemo(() => (state.context?.addresses ?? []).map((address) => ({ ...address,
    addressLine: `${address.street} ${address.exteriorNumber}${address.interiorNumber ? `, Int. ${address.interiorNumber}` : ''}, ${address.neighborhood}`,
    locationLine: `${address.municipality}, ${address.state} · C.P. ${address.postalCode}`,
  })), [state.context]);
  const busy = state.loading || state.confirming || state.recovering;
  const canEdit = state.status === 'ready' && !busy && !state.uncertain && !state.receipt && !state.cleanupPending;
  const selectedAddress = addresses.find((address) => address.id === state.selectedAddressId) ?? null;

  async function prepareSignIn() {
    if (signInPending.current) return false;
    signInPending.current = true; setOpeningSignIn(true);
    try { if (state.status === 'expired') await session.signOut(); }
    catch { /* Authentication retains any secure-storage warning. */ }
    finally { signInPending.current = false; setOpeningSignIn(false); }
    return true;
  }

  return { ...state, items, addresses, selectedAddress, currency, busy, canEdit, openingSignIn,
    itemCount: items.length, unitCount: state.quote?.totalItems ?? 0,
    subtotalLabel: format(state.quote?.subtotal ?? 0),
    receiptSubtotalLabel: state.receipt ? format(state.receipt.subtotal) : null,
    canConfirm: canEdit && !state.requiresRefresh && !!state.quote?.canConfirmOrder && !!selectedAddress && !!state.contact,
    selectAddress: controller.selectAddress, editContact: controller.editContact,
    refresh: controller.refresh, confirm: controller.confirm, retryConfirmation: controller.retryConfirmation,
    reconcileCart: controller.reconcileCart, restoreSession: session.restore, prepareSignIn,
  };
}
