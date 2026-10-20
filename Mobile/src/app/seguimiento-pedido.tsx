import { useLocalSearchParams } from 'expo-router';
import { OrderTrackingScreen } from '@/features/orderTracking/presentation/screens/OrderTrackingScreen';

export default function OrderTrackingPreviewRoute() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  // Multiple IDs are an invalid selection, never an instruction to choose one silently.
  const orderId = id === undefined ? null : typeof id === 'string' ? id : 'invalid-selection';
  return <OrderTrackingScreen orderId={orderId} />;
}
