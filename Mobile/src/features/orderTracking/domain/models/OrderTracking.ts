import type { OrderHistoryDetail, OrderHistoryStatus } from '../../../orderHistory/domain/models/OrderHistory';

export type OrderTrackingStatus = OrderHistoryStatus;

/** Historical values remain nullable: the current status never supplies a missing event date. */
export type OrderTracking = OrderHistoryDetail & Readonly<{
  confirmedAt: string | null;
  cancelledAt: string | null;
  completedAt: string | null;
}>;
