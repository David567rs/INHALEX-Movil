import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';
import { useReviewsController } from '../context/ReviewsProvider';

const dateFormatter = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
export const formatReviewDate = (value: string | null) => value ? dateFormatter.format(new Date(value)) : 'Fecha no disponible';
export function useReviewsViewModel() {
  const controller = useReviewsController();
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const session = useAuthSession();
  const [filter, setFilter] = useState<'pending' | 'completed'>('pending');
  const [openingSignIn, setOpeningSignIn] = useState(false);
  const signInPending = useRef(false);
  useFocusEffect(useCallback(() => {
    const current = controller.getSnapshot();
    if (current.collection && !current.refreshing && !current.publishing) void controller.refresh();
    return () => controller.selectProduct(null);
  }, [controller]));
  const busy = state.status === 'loading' || state.refreshing || state.publishing;
  const selectedProduct = state.collection?.pending.find((item) => item.productId === state.selectedProductId) ?? null;
  async function prepareSignIn() {
    if (signInPending.current) return false;
    signInPending.current = true; setOpeningSignIn(true);
    try { if (state.status === 'session-expired') await session.signOut(); }
    catch { /* The session retains its storage warning. */ }
    finally { signInPending.current = false; setOpeningSignIn(false); }
    return true;
  }
  return {
    ...state, filter, busy, selectedProduct, openingSignIn,
    pending: state.collection?.pending ?? [], completed: state.collection?.completed ?? [],
    canRefresh: !busy && (state.status === 'ready' || state.status === 'error'),
    canSelectProduct: !busy && state.status === 'ready' && !state.requiresRefresh,
    canPublish: !busy && state.status === 'ready' && !!selectedProduct && !state.requiresRefresh,
    selectFilter(next: 'pending' | 'completed') {
      if (busy) return;
      setFilter(next); controller.selectProduct(null);
    },
    refresh: controller.refresh, selectProduct: controller.selectProduct,
    setRating: controller.setRating, setComment: controller.setComment, publishReview: controller.publishReview,
    prepareSignIn, restoreSession: session.restore,
  };
}
