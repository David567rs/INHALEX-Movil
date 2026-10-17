import { LoginScreen } from '@/features/auth/presentation/screens/LoginScreen';
import { Redirect } from 'expo-router';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';
import { SessionStatusScreen } from '@/features/auth/presentation/screens/SessionStatusScreen';

export default function SignInRoute() {
  const { user, signIn, status, message, restore } = useAuthSession();
  if (status === 'checking') return <SessionStatusScreen checking message={null} />;
  if (user) return <Redirect href="/(tabs)/cuenta" />;
  return <LoginScreen signIn={signIn} sessionMessage={message} retrySession={status === 'recovery-error' ? restore : undefined} />;
}
