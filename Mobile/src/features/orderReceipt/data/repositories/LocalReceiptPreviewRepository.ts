import type { ReceiptPreview, ReceiptPreviewScene } from '../../domain/models/ReceiptPreview';
import type { ReceiptPreviewRepository } from '../../domain/repositories/ReceiptPreviewRepository';

/** Fictitious values, recreated on every read; no HTTP, session or storage. */
export class LocalReceiptPreviewRepository implements ReceiptPreviewRepository {
  getExample(scene: ReceiptPreviewScene): ReceiptPreview | null {
    if (scene === 'empty') return null;
    return {
      reference: 'DEMO-008',
      completedOn: '8 nov 2026',
      confirmedOn: scene === 'confirmed' ? '8 nov 2026' : null,
      receiptStatus: scene === 'issue' ? 'issue_reported' : scene,
      items: [
        { id: 'demo-lavanda', name: 'Lavanda', imageKey: 'lavanda', quantity: 1, subtotal: 60 },
        { id: 'demo-menta', name: 'Menta', imageKey: 'menta', quantity: 2, subtotal: 120 },
      ],
      unitCount: 3,
      subtotal: 180,
    };
  }
}
