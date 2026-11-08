import type { ReceiptPreview, ReceiptPreviewScene } from '../models/ReceiptPreview';

/** Read-only contract: the design stage cannot persist or confirm orders. */
export interface ReceiptPreviewRepository {
  getExample(scene: ReceiptPreviewScene): ReceiptPreview | null;
}
