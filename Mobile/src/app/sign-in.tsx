import { LoginScreen } from '@/features/auth/presentation/screens/LoginScreen';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';
import { SessionStatusScreen } from '@/features/auth/presentation/screens/SessionStatusScreen';

export default function SignInRoute() {
  const { user, signIn, status, message, restore } = useAuthSession();
  useFocusEffect(useCallback(() => {
    if (user && status !== 'checking') router.dismissTo('/cuenta');
  }, [user, status]));
  if (status === 'checking') return <SessionStatusScreen checking message={null} />;
  if (user) return null;
  return <LoginScreen signIn={signIn} sessionMessage={message} retrySession={status === 'recovery-error' ? restore : undefined} />;
}
