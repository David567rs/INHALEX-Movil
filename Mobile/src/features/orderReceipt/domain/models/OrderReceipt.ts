export type ReceiptStatus = 'pending' | 'confirmed' | 'issue_reported';

export type ReceiptItem = Readonly<{
  id: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  presentation: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}>;

/** Public receipt information only; account identity and credentials stay outside this model. */
export type ReceiptOrder = Readonly<{
  id: string;
  reference: string;
  status: 'completed';
  receiptStatus: ReceiptStatus;
  completedAt: string | null;
  confirmedAt: string | null;
  items: readonly ReceiptItem[];
  totalItems: number;
  subtotal: number;
  currency: 'MXN';
}>;
