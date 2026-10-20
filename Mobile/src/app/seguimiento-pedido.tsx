import { useState } from 'react';
import { createOrderTrackingPreviewAction } from '@/bootstrap/createOrderTrackingPreviewAction';
import { OrderTrackingPreviewScreen } from '@/features/orderTrackingPreview/presentation/screens/OrderTrackingPreviewScreen';

export default function OrderTrackingPreviewRoute() {
  const [loadPreview] = useState(() => createOrderTrackingPreviewAction());
  return <OrderTrackingPreviewScreen loadPreview={loadPreview} />;
}
