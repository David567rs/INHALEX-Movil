import type { AuthSession, AuthSessionState } from '../../auth/domain/session/AuthSession';
import { OrderReceiptError } from '../domain/errors/OrderReceiptError';
import type { ReceiptOrder } from '../domain/models/OrderReceipt';
import type { OrderReceiptRepository, ReceiptRequestOptions } from '../domain/repositories/OrderReceiptRepository';
import { buildOrderReceiptActions } from '../domain/useCases/orderReceiptActions';
import { createOrderReceiptController } from '../presentation/state/createOrderReceiptController';

export type ReceiptFailureSnapshot = Readonly<{
  online: boolean;
  confirmAttempts: number;
  confirmedReceipts: number;
  reads: number;
}>;

/** Isolated, disposable fixture. No HTTP, storage, credentials or application session. */
export function createReceiptFailureScenario() {
  let disposed = false;
  let snapshot: ReceiptFailureSnapshot = Object.freeze({ online: true, confirmAttempts: 0, confirmedReceipts: 0, reads: 0 });
  const listeners = new Set<() => void>();
  const auth: AuthSessionState = Object.freeze({
    status: 'authenticated', message: null,
    user: Object.freeze({ id: '000000000000000000000091', firstName: 'Demo', lastName: 'Recepción', email: 'demo@example.test', phone: '5500000000' }),
  });
  const authSession: AuthSession = Object.freeze({
    getSnapshot: () => auth,
    subscribe: () => () => {},
    restore: async () => {},
    signIn: async () => auth.user!,
    signOut: async () => {},
  });
  let order: ReceiptOrder = Object.freeze({
    id: '000000000000000000000092', reference: 'DEMO-RECEPCION-01', status: 'completed', receiptStatus: 'pending',
    completedAt: '2026-11-08T12:00:00.000Z', confirmedAt: null, totalItems: 2, subtotal: 120, currency: 'MXN',
    items: Object.freeze([Object.freeze({
      id: '000000000000000000000093', productId: '000000000000000000000093', name: 'Lavanda de demostración',
      imageUrl: null, presentation: '10 ml', quantity: 2, unitPrice: 60, subtotal: 120,
    })]),
  });
  function publish(patch: Partial<ReceiptFailureSnapshot>) {
    if (disposed) return;
    snapshot = Object.freeze({ ...snapshot, ...patch });
    for (const listener of [...listeners]) {
      if (disposed) break;
      try { listener(); } catch { /* A diagnostic observer cannot change the simulated operation. */ }
    }
  }
  function assertActive(options?: ReceiptRequestOptions) {
    if (disposed || options?.signal?.aborted) throw new OrderReceiptError('Se canceló la prueba de recepción.', 'cancelled');
  }
  function offlineError() {
    return new OrderReceiptError('Conexión interrumpida en la prueba. Restablece la conexión y verifica la recepción.', 'network');
  }
  const repository: OrderReceiptRepository = {
    async list(options) {
      await Promise.resolve();
      assertActive(options);
      publish({ reads: snapshot.reads + 1 });
      assertActive(options);
      if (!snapshot.online) throw offlineError();
      return Object.freeze([order]);
    },
    async confirm(orderId, options) {
      await Promise.resolve();
      assertActive(options);
      if (orderId !== order.id) throw new OrderReceiptError('Selecciona el pedido de demostración.', 'not-found');
      const firstAttempt = snapshot.confirmAttempts === 0;
      const attempts = snapshot.confirmAttempts + 1;
      if (firstAttempt || !snapshot.online) {
        publish({ online: false, confirmAttempts: attempts });
        assertActive(options);
        throw offlineError();
      }
      if (order.receiptStatus !== 'confirmed') {
        order = Object.freeze({ ...order, receiptStatus: 'confirmed', confirmedAt: '2026-11-08T12:05:00.000Z' });
      }
      publish({ confirmAttempts: attempts, confirmedReceipts: 1 });
      assertActive(options);
      return order;
    },
  };
  const liveController = createOrderReceiptController(authSession, buildOrderReceiptActions(repository));
  const controller = Object.freeze({
    ...liveController,
    start() { if (!disposed) liveController.start(); },
  });
  return Object.freeze({
    controller,
    authSession,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      if (!disposed) listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    restoreConnection() {
      if (!disposed && !snapshot.online) publish({ online: true });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      liveController.stop();
      listeners.clear();
    },
  });
}

export type ReceiptFailureScenario = ReturnType<typeof createReceiptFailureScenario>;
