import type { Cart } from '../../../cart/domain/models/Cart';
import type { Profile } from '../../../profile/domain/models/Profile';
import type { ShippingAddress } from '../../../shippingAddresses/domain/models/ShippingAddress';

export type OrderItemInput = Readonly<{ productId: string; quantity: number }>;
export type OrderContactDraft = Readonly<{
  customerName: string; customerEmail: string; customerPhone: string; notes: string;
}>;
export type OrderContactField = keyof OrderContactDraft;
export type OrderContactFieldErrors = Partial<Record<OrderContactField, string>>;
export type OrderConfirmInput = OrderContactDraft & Readonly<{
  items: readonly OrderItemInput[]; shippingAddressId: string; previewSignature: string;
}>;
export type OrderQuoteItem = Readonly<{
  productId: string; productName: string; productSlug: string; image: string | null;
  category: string; presentation: string; origin: string; unitPrice: number; currency: string;
  requestedQuantity: number; quantity: number; subtotal: number;
  fulfillment: 'available' | 'adjusted' | 'backorder' | 'manual';
  stockAvailable: number | null; reservedQuantity: number; backorderQuantity: number;
  inventoryTracked: boolean; allowBackorder: boolean; message: string | null;
}>;
export type OrderQuoteIssue = Readonly<{
  code: string; severity: 'info' | 'warning' | 'error'; productId: string | null;
  productName: string | null; title: string; description: string;
}>;
export type OrderQuote = Readonly<{
  items: readonly OrderQuoteItem[]; issues: readonly OrderQuoteIssue[];
  subtotal: number; totalItems: number; currency: string; canConfirmOrder: boolean;
  canCreateDraft: boolean; needsManualReview: boolean; signature: string;
}>;
export type OrderStatus = 'pending_review' | 'confirmed' | 'cancelled' | 'completed';
export type OrderReceipt = Readonly<{
  orderId: string; reference: string; status: OrderStatus; createdAt: string | null;
  subtotal: number; totalItems: number; currency: string;
}>;
export type OrderConfirmation = OrderQuote & OrderReceipt;
export type OrderContext = Readonly<{
  cart: Cart; addresses: readonly ShippingAddress[]; profile: Profile;
}>;
