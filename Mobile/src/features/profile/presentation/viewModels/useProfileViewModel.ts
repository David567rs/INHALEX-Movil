import { useRef, useState } from 'react';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';
import { useProfile } from '../context/ProfileProvider';

export function useProfileViewModel() {
  const profile = useProfile();
  const session = useAuthSession();
  const signInPending = useRef(false);
  const [openingSignIn, setOpeningSignIn] = useState(false);
  const busy = profile.status === 'checking' || profile.status === 'loading';
  const fullName = profile.profile
    ? profile.profile.displayName ?? `${profile.profile.firstName} ${profile.profile.lastName}`.trim() : '';
  const initials = profile.profile?.displayName
    ? fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
    : profile.profile ? `${profile.profile.firstName[0] ?? ''}${profile.profile.lastName[0] ?? ''}`.toUpperCase() : '';
  const needsProfileDetails = profile.profile !== null
    && (!profile.profile.firstName || !profile.profile.lastName || !profile.profile.phone);

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

  return { ...profile, fullName, initials, needsProfileDetails, busy, openingSignIn, prepareSignIn, restoreSession: session.restore,
    canRefresh: !busy && !profile.refreshing && !profile.saving,
    canEdit: profile.profile !== null && !busy && !profile.refreshing && !profile.saving && !profile.requiresRefresh,
    canSave: profile.mode === 'edit' && profile.draft !== null && !busy && !profile.refreshing && !profile.saving && !profile.requiresRefresh,
  };
}
