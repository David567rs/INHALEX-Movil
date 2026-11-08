import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { ProfileEntry } from '@/features/profile/presentation/components/ProfileEntry';
import { AddressesEntry } from '@/features/shippingAddresses/presentation/components/AddressesEntry';
import { OrderHistoryEntry } from '@/features/orderHistory/presentation/components/OrderHistoryEntry';
import { OrderTrackingEntry } from '@/features/orderTracking/presentation/components/OrderTrackingEntry';
import { NoticesEntry } from '@/features/notices/presentation/components/NoticesEntry';
import { ReviewsEntry } from '@/features/reviews/presentation/components/ReviewsEntry';

export function AccountMenu() {
  return <View style={styles.menu}>
    <Text accessibilityRole="header" style={styles.heading}>Tu información</Text>
    <View style={styles.group}>
      <ProfileEntry />
      <View style={styles.divider} />
      <AddressesEntry />
    </View>
    <Text accessibilityRole="header" style={styles.heading}>Tus pedidos y novedades</Text>
    <View style={styles.group}>
      <OrderHistoryEntry />
      <View style={styles.divider} />
      <OrderTrackingEntry />
      <View style={styles.divider} />
      <NoticesEntry />
      <View style={styles.divider} />
      <ReviewsEntry />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  menu: { marginTop: 6 },
  heading: { color: colors.textMuted, fontSize: 12, fontWeight: '600', lineHeight: 19, marginBottom: 9, marginTop: 22, paddingHorizontal: 4 },
  group: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  divider: { backgroundColor: colors.border, height: StyleSheet.hairlineWidth, marginLeft: 68, marginRight: 16 },
});
