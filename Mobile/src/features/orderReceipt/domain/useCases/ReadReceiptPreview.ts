import type { ReceiptPreviewScene } from '../models/ReceiptPreview';
import type { ReceiptPreviewRepository } from '../repositories/ReceiptPreviewRepository';

export class ReadReceiptPreview {
  constructor(private readonly repository: ReceiptPreviewRepository) {}

  execute(scene: ReceiptPreviewScene) {
    return this.repository.getExample(scene);
  }
}
