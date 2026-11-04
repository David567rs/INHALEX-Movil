import { AccountScreen } from '@/features/auth/presentation/screens/AccountScreen';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';
import { StyleSheet, View } from 'react-native';
import { ProfileEntry } from '@/features/profile/presentation/components/ProfileEntry';
import { AddressesEntry } from '@/features/shippingAddresses/presentation/components/AddressesEntry';
import { OrderHistoryEntry } from '@/features/orderHistory/presentation/components/OrderHistoryEntry';
import { OrderTrackingEntry } from '@/features/orderTracking/presentation/components/OrderTrackingEntry';
import { NoticesEntry } from '@/features/notices/presentation/components/NoticesEntry';
import { ReviewsEntry } from '@/features/reviews/presentation/components/ReviewsEntry';

export default function AccountRoute() {
  const session = useAuthSession();
  return <AccountScreen user={session.user} signOut={session.signOut} status={session.status} message={session.message} restore={session.restore}>
    <View style={styles.links}>
      <ProfileEntry />
      <AddressesEntry />
      <OrderHistoryEntry />
      <OrderTrackingEntry />
      <NoticesEntry />
      <ReviewsEntry />
    </View>
  </AccountScreen>;
}

const styles = StyleSheet.create({
  links: { marginHorizontal: -22, marginTop: 16 },
});
