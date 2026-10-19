import { useRef, useState } from 'react';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';
import { MAX_SHIPPING_ADDRESSES } from '../../domain/validation/shippingAddressValidation';
import { useShippingAddresses } from '../context/ShippingAddressesProvider';

export function useShippingAddressesViewModel() {
  const addresses = useShippingAddresses();
  const session = useAuthSession();
  const signInPending = useRef(false);
  const [openingSignIn, setOpeningSignIn] = useState(false);
  const busy = addresses.status === 'checking' || addresses.loading || addresses.refreshing || addresses.saving;
  const ready = addresses.status === 'ready' && !busy && addresses.addresses !== null;

  async function prepareSignIn() {
    if (signInPending.current) return false;
    signInPending.current = true;
    setOpeningSignIn(true);
    try {
      if (addresses.status === 'expired') await session.signOut();
    } catch { /* Existing authentication state retains any secure-storage deletion warning. */ }
    finally { signInPending.current = false; setOpeningSignIn(false); }
    return true;
  }

  return { ...addresses, busy, openingSignIn, prepareSignIn, restoreSession: session.restore,
    canRefresh: addresses.status === 'ready' && !busy,
    canCreate: ready && !addresses.requiresRefresh && (addresses.addresses?.length ?? 0) < MAX_SHIPPING_ADDRESSES,
    canSave: ready && !addresses.requiresRefresh && addresses.mode !== 'list' && addresses.draft !== null
      && (addresses.mode !== 'create' || (addresses.addresses?.length ?? 0) < MAX_SHIPPING_ADDRESSES)
      && (addresses.mode !== 'edit' || !!addresses.addresses?.some((address) => address.id === addresses.editingId)),
  };
}
