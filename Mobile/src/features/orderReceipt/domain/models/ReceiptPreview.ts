/** Design examples only. This is not the transport model for a real order. */
export type ReceiptPreviewScene = 'pending' | 'confirmed' | 'issue' | 'empty';

export type ReceiptPreview = Readonly<{
  reference: string;
  completedOn: string;
  confirmedOn: string | null;
  receiptStatus: 'pending' | 'confirmed' | 'issue_reported';
  items: readonly Readonly<{
    id: string;
    name: string;
    imageKey: 'lavanda' | 'menta';
    quantity: number;
    subtotal: number;
  }>[];
  unitCount: number;
  subtotal: number;
}>;
