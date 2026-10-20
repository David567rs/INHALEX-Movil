export type OrderTrackingPreviewStatus = 'pending_review' | 'confirmed' | 'completed' | 'cancelled';
export type OrderTrackingPreviewScenario = OrderTrackingPreviewStatus | 'not-found' | 'connection-error';

export type OrderTrackingPreviewItem = Readonly<{
  id: string;
  name: string;
  presentation: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}>;

export type OrderTrackingPreviewAddress = Readonly<{
  label: string;
  recipientName: string;
  lines: readonly string[];
}>;

export type OrderTrackingPreviewStep = Readonly<{
  id: OrderTrackingPreviewStatus;
  label: string;
  description: string;
  /** No event timestamp is inferred from the creation date or current status. */
  dateLabel: string | null;
  state: 'past' | 'current' | 'upcoming';
}>;

export type OrderTrackingPreviewOrder = Readonly<{
  id: string;
  reference: string;
  status: OrderTrackingPreviewStatus;
  statusLabel: string;
  dateLabel: string;
  createdAt: string;
  currency: 'MXN';
  unitCount: number;
  subtotal: number;
  items: readonly OrderTrackingPreviewItem[];
  address: OrderTrackingPreviewAddress | null;
  timeline: readonly OrderTrackingPreviewStep[];
}>;

export type OrderTrackingPreview =
  | Readonly<{ status: 'ready'; order: OrderTrackingPreviewOrder }>
  | Readonly<{ status: 'not-found' | 'connection-error'; title: string; message: string }>;
