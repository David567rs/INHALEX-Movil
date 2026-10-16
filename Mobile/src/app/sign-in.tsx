import { LoginScreen } from '@/features/auth/presentation/screens/LoginScreen';
import { Redirect } from 'expo-router';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';

export default function SignInRoute() {
  const { user, signIn } = useAuthSession();
  if (user) return <Redirect href="/(tabs)/cuenta" />;
  return <LoginScreen signIn={signIn} />;
}
