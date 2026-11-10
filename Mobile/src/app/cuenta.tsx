import { router } from 'expo-router';
import { AccountScreen } from '@/features/auth/presentation/screens/AccountScreen';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';
import { AccountMenu } from '@/features/shell/presentation/components/AccountMenu';

export default function AccountRoute() {
  const session = useAuthSession();
  const goBack = () => router.canGoBack() ? router.back() : router.replace('/(tabs)/mas');
  return <AccountScreen user={session.user} signOut={session.signOut} status={session.status} message={session.message} restore={session.restore} onBack={goBack}>
    <AccountMenu />
  </AccountScreen>;
}
