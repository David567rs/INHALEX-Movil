import type { OrderConfirmInput, OrderItemInput, OrderReceipt } from '../models/OrderCreation';

/** Private recovery record; it never contains an access token. */
export type OrderAttempt = Readonly<{
  version: 1;
  accountId: string;
  key: string;
  input: OrderConfirmInput;
  phase: 'pending' | 'confirmed';
  receipt: OrderReceipt | null;
  normalizedItems: readonly OrderItemInput[] | null;
}>;

export interface OrderAttemptStore {
  get(accountId: string): Promise<OrderAttempt | null>;
  set(accountId: string, attempt: OrderAttempt): Promise<void>;
  clear(accountId: string): Promise<void>;
}
