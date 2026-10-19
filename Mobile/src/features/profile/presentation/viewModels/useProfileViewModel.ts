import { useRef, useState } from 'react';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';
import { useProfile } from '../context/ProfileProvider';

export function useProfileViewModel() {
  const profile = useProfile();
  const session = useAuthSession();
  const signInPending = useRef(false);
  const [openingSignIn, setOpeningSignIn] = useState(false);
  const busy = profile.status === 'checking' || profile.status === 'loading';
  const fullName = profile.profile ? `${profile.profile.firstName} ${profile.profile.lastName}` : '';
  const initials = profile.profile ? `${profile.profile.firstName[0] ?? ''}${profile.profile.lastName[0] ?? ''}`.toUpperCase() : '';

  async function prepareSignIn() {
    if (signInPending.current) return false;
    signInPending.current = true;
    setOpeningSignIn(true);
    try {
      if (profile.status === 'session-expired') await session.signOut();
    } catch { /* The existing authentication flow retains any secure-storage warning. */ }
    finally { signInPending.current = false; setOpeningSignIn(false); }
    return true;
  }

  return { ...profile, fullName, initials, busy, openingSignIn, prepareSignIn, restoreSession: session.restore,
    canRefresh: !busy && !profile.refreshing && !profile.saving,
    canEdit: profile.profile !== null && !busy && !profile.refreshing && !profile.saving && !profile.requiresRefresh,
    canSave: profile.mode === 'edit' && profile.draft !== null && !busy && !profile.refreshing && !profile.saving && !profile.requiresRefresh,
  };
}
