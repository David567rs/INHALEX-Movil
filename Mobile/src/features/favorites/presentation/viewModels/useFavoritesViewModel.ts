import { useMemo, useRef, useState } from 'react';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';
import { useFavorites } from '../context/FavoritesProvider';

export type FavoriteProductViewModel = Readonly<{
  id: string;
  name: string;
  aromaNote: string;
  priceLabel: string;
  image: string | null;
  inStock: boolean;
  pending: boolean;
}>;

export function useFavoritesViewModel() {
  const favorites = useFavorites();
  const session = useAuthSession();
  const [openingSignIn, setOpeningSignIn] = useState(false);
  const signInPending = useRef(false);
  const products = useMemo<readonly FavoriteProductViewModel[]>(() => favorites.products.map((product) => ({
    id: product.id,
    name: product.name,
    aromaNote: product.aromas.length ? product.aromas.join(' · ') : product.description,
    priceLabel: `${new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: product.currency,
    }).format(product.price)} ${product.currency}`,
    image: product.image,
    inStock: product.inStock,
    pending: favorites.pendingProductIds.includes(product.id),
  })), [favorites.products, favorites.pendingProductIds]);
  const count = products.length;

  async function prepareSignIn() {
    if (signInPending.current) return false;
    signInPending.current = true;
    setOpeningSignIn(true);
    try {
      if (favorites.status === 'session-expired') await session.signOut();
    } catch {
      // Sign-out has already cleared the public user; Login displays any storage warning.
    } finally {
      signInPending.current = false;
      setOpeningSignIn(false);
    }
    return true;
  }

  return {
    ...favorites,
    products,
    count,
    countLabel: `${count} ${count === 1 ? 'aroma guardado' : 'aromas guardados'}`,
    busy: favorites.status === 'checking' || favorites.status === 'loading',
    canMutate: favorites.loaded && favorites.status === 'ready' && !favorites.refreshing,
    canRefresh: !favorites.refreshing && favorites.pendingProductIds.length === 0,
    restoreSession: session.restore,
    prepareSignIn,
    openingSignIn,
  };
}
