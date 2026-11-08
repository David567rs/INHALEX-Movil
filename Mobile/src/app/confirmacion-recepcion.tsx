import { useState } from 'react';
import { createReceiptPreview } from '@/bootstrap/createReceiptPreview';
import { ReceiptPreviewScreen } from '@/features/orderReceipt/presentation/screens/ReceiptPreviewScreen';

export default function ReceiptRoute() {
  const [readPreview] = useState(createReceiptPreview);
  return <ReceiptPreviewScreen readPreview={readPreview} />;
}
