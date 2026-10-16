import { AccountScreen } from '@/features/auth/presentation/screens/AccountScreen';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';

export default function AccountRoute() {
  const session = useAuthSession();
  return <AccountScreen user={session.user} signOut={session.signOut} status={session.status} message={session.message} restore={session.restore} />;
}
