import { useMemo, useRef, useState } from 'react';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';
import { useCart } from '../context/CartProvider';

export type CartItemViewModel = Readonly<{
  id: string; name: string; aromaNote: string; image: string | null;
  quantity: number; unitPriceLabel: string; lineTotalLabel: string; pending: boolean;
}>;

export function useCartViewModel() {
  const cart = useCart();
  const session = useAuthSession();
  const [openingSignIn, setOpeningSignIn] = useState(false);
  const signInPending = useRef(false);
  const currency = cart.cart?.currency ?? 'MXN';
  const formatter = useMemo(() => new Intl.NumberFormat('es-MX', { style: 'currency', currency }), [currency]);
  const items = useMemo<readonly CartItemViewModel[]>(() => (cart.cart?.items ?? []).map((item) => ({
    id: item.productId, name: item.product.name, image: item.product.image,
    aromaNote: item.product.aromas.length ? item.product.aromas.join(' · ') : item.product.description,
    quantity: item.quantity,
    unitPriceLabel: `${formatter.format(item.product.price)} ${currency}`,
    lineTotalLabel: `${formatter.format(item.subtotal)} ${currency}`,
    pending: cart.pendingProductId === item.productId,
  })), [cart.cart, cart.pendingProductId, formatter, currency]);

  async function prepareSignIn() {
    if (signInPending.current) return false;
    signInPending.current = true;
    setOpeningSignIn(true);
    try {
      if (cart.status === 'session-expired') await session.signOut();
    } catch { /* Login retains the existing secure-storage warning. */ }
    finally { signInPending.current = false; setOpeningSignIn(false); }
    return true;
  }

  return { ...cart, items, currency,
    itemCount: items.length, unitCount: cart.cart?.totalItems ?? 0,
    subtotalLabel: `${formatter.format(cart.cart?.subtotal ?? 0)} ${currency}`,
    totalLabel: `${formatter.format(cart.cart?.subtotal ?? 0)} ${currency}`,
    busy: cart.status === 'checking' || cart.status === 'loading',
    canMutate: cart.loaded && cart.status === 'ready' && !cart.refreshing && cart.pendingProductId === null,
    canRefresh: !cart.refreshing && cart.pendingProductId === null,
    restoreSession: session.restore, prepareSignIn, openingSignIn,
  };
}
