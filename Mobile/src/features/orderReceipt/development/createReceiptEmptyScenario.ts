import type { AuthSession, AuthSessionState } from '../../auth/domain/session/AuthSession';
import { OrderReceiptError } from '../domain/errors/OrderReceiptError';
import type { ReceiptOrder } from '../domain/models/OrderReceipt';
import type { OrderReceiptRepository, ReceiptRequestOptions } from '../domain/repositories/OrderReceiptRepository';
import { buildOrderReceiptActions } from '../domain/useCases/orderReceiptActions';
import { createOrderReceiptController } from '../presentation/state/createOrderReceiptController';

/** Disposable empty collection, independent of HTTP, storage and the application's session. */
export function createReceiptEmptyScenario() {
  let disposed = false;
  let reads = 0;
  let confirmAttempts = 0;
  const orders: readonly ReceiptOrder[] = Object.freeze([]);
  const auth: AuthSessionState = Object.freeze({
    status: 'authenticated', message: null,
    user: Object.freeze({
      id: '000000000000000000000091', firstName: 'Demo', lastName: 'Recepción',
      email: 'demo@example.test', phone: '5500000000',
    }),
  });
  const authSession: AuthSession = Object.freeze({
    getSnapshot: () => auth,
    subscribe: () => () => {},
    restore: async () => {},
    signIn: async () => auth.user!,
    signOut: async () => {},
  });
  function assertActive(options?: ReceiptRequestOptions) {
    if (disposed || options?.signal?.aborted) {
      throw new OrderReceiptError('Se canceló la prueba de recepción.', 'cancelled');
    }
  }
  const repository: OrderReceiptRepository = {
    async list(options) {
      assertActive(options);
      reads++;
      // Keep an asynchronous boundary so leaving the screen can cancel an in-flight read.
      await Promise.resolve();
      assertActive(options);
      return orders;
    },
    async confirm(_orderId, options) {
      assertActive(options);
      confirmAttempts++;
      throw new OrderReceiptError('No hay pedidos en esta prueba vacía.', 'not-found');
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
    getDiagnostics: () => Object.freeze({ reads, confirmAttempts }),
    dispose() {
      if (disposed) return;
      disposed = true;
      liveController.stop();
    },
  });
}

export type ReceiptEmptyScenario = ReturnType<typeof createReceiptEmptyScenario>;
