import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';
import type { NoticeType } from '../../domain/models/Notice';
import { useNoticesController } from '../context/NoticesProvider';

export type NoticesFilter = 'all' | 'unread';
const date = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
const typeLabels: Record<NoticeType, string> = {
  order: 'Tu pedido', review: 'Reseñas', promotion: 'Novedades', system: 'Tu cuenta', report: 'Información',
};
export const formatNoticeDate = (value: string | null) => value ? date.format(new Date(value)) : 'Fecha no disponible';
export const noticeTypeLabel = (type: NoticeType) => typeLabels[type];

export function useNoticesViewModel() {
  const controller = useNoticesController();
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const session = useAuthSession();
  const [filter, setFilter] = useState<NoticesFilter>('all');
  const [openingSignIn, setOpeningSignIn] = useState(false);
  const signInPending = useRef(false);
  useFocusEffect(useCallback(() => {
    const current = controller.getSnapshot();
    if (current.items !== null && !current.refreshing && !current.markingReadId) void controller.refresh();
    return () => controller.selectNotice(null);
  }, [controller]));
  const all = state.items ?? [];
  const items = all.filter((notice) => filter === 'all' || notice.readAt === null);
  const selectedNotice = all.find((notice) => notice.id === state.selectedNoticeId) ?? null;
  const busy = state.status === 'loading' || state.refreshing || state.markingReadId !== null;
  function selectFilter(next: NoticesFilter) {
    if (busy) return;
    setFilter(next); controller.selectNotice(null);
  }
  async function prepareSignIn() {
    if (signInPending.current) return false;
    signInPending.current = true; setOpeningSignIn(true);
    try { if (state.status === 'session-expired') await session.signOut(); }
    catch { /* Authentication keeps its storage warning. */ }
    finally { signInPending.current = false; setOpeningSignIn(false); }
    return true;
  }
  return {
    ...state, items, selectedNotice, filter, busy, openingSignIn,
    loadedUnreadCount: all.filter((notice) => notice.readAt === null).length,
    totalLoaded: all.length,
    isEmpty: state.items !== null && all.length === 0,
    isFilterEmpty: state.items !== null && all.length > 0 && items.length === 0,
    canRefresh: !busy && (state.status === 'ready' || state.status === 'error'),
    canMarkRead: !busy && state.status === 'ready' && !!selectedNotice && selectedNotice.readAt === null,
    refresh: controller.refresh, selectFilter, selectNotice: controller.selectNotice,
    markSelectedRead: controller.markSelectedRead, prepareSignIn, restoreSession: session.restore,
  };
}
