import type { Cart } from '../../../cart/domain/models/Cart';
import type { OrderConfirmation, OrderConfirmInput, OrderContext, OrderItemInput, OrderQuote } from '../models/OrderCreation';

export interface OrderCreationRequestOptions { signal?: AbortSignal }
export interface OrderCreationActions {
  load(options?: OrderCreationRequestOptions): Promise<OrderContext>;
  preview(items: readonly OrderItemInput[], options?: OrderCreationRequestOptions): Promise<OrderQuote>;
  confirm(input: OrderConfirmInput, idempotencyKey: string, options?: OrderCreationRequestOptions): Promise<OrderConfirmation>;
  readCart(options?: OrderCreationRequestOptions): Promise<Cart>;
  clearCart(options?: OrderCreationRequestOptions): Promise<Cart>;
}
export type OrderCreationRepository = OrderCreationActions;
