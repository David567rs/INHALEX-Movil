export type OrderHistoryStatus = 'pending_review' | 'confirmed' | 'cancelled' | 'completed';

export type OrderHistorySummary = Readonly<{
  id: string;
  reference: string;
  status: OrderHistoryStatus;
  currency: 'MXN';
  unitCount: number;
  subtotal: number;
  createdAt: string;
}>;

export type OrderHistoryPage = Readonly<{
  orders: readonly OrderHistorySummary[];
  nextCursor: string | null;
}>;

export type OrderHistoryItem = Readonly<{
  productId: string;
  productName: string;
  presentation: string;
  image: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  currency: 'MXN';
}>;

export type OrderHistoryAddress = Readonly<{
  label: string;
  recipientName: string;
  phone: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  neighborhood: string;
  municipality: string;
  state: string;
  postalCode: string;
  references: string;
}>;

export type OrderHistoryDetail = OrderHistorySummary & Readonly<{
  items: readonly OrderHistoryItem[];
  shippingAddress: OrderHistoryAddress | null;
}>;
