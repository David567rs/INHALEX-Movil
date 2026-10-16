import { AccountScreen } from '@/features/auth/presentation/screens/AccountScreen';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';

export default function AccountRoute() {
  const { user, signOut } = useAuthSession();
  return <AccountScreen user={user} signOut={signOut} />;
}
