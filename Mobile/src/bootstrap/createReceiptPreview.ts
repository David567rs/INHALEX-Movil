import { LocalReceiptPreviewRepository } from '@/features/orderReceipt/data/repositories/LocalReceiptPreviewRepository';
import { ReadReceiptPreview } from '@/features/orderReceipt/domain/useCases/ReadReceiptPreview';

export function createReceiptPreview() {
  return new ReadReceiptPreview(new LocalReceiptPreviewRepository());
}
