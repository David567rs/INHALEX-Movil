import { AccountScreen } from '@/features/auth/presentation/screens/AccountScreen';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';
import { View } from 'react-native';
import { ProfileEntry } from '@/features/profile/presentation/components/ProfileEntry';
import { AddressesEntry } from '@/features/shippingAddresses/presentation/components/AddressesEntry';

export default function AccountRoute() {
  const session = useAuthSession();
  return <View style={{ flex: 1 }}>
    <AccountScreen user={session.user} signOut={session.signOut} status={session.status} message={session.message} restore={session.restore} />
    <ProfileEntry />
    <AddressesEntry />
  </View>;
}
