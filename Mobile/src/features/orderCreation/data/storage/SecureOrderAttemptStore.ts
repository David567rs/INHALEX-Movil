import type { OrderAttempt, OrderAttemptStore } from '../../domain/storage/OrderAttemptStore';
import { orderAttemptAccountId, orderAttemptStorageError, snapshotOrderAttempt } from './orderAttemptValidation';

/** Structural port keeps the shared adapter independent of the Expo runtime. */
export type OrderAttemptStorageOptions = Readonly<{
  keychainAccessible?: number;
  keychainService?: string;
  requireAuthentication?: boolean;
}>;
export interface OrderAttemptStorage {
  getItemAsync(key: string, options?: OrderAttemptStorageOptions): Promise<string | null>;
  setItemAsync(key: string, value: string, options?: OrderAttemptStorageOptions): Promise<void>;
  deleteItemAsync(key: string, options?: OrderAttemptStorageOptions): Promise<void>;
}
export const ORDER_ATTEMPT_KEY_PREFIX = 'inhalex.order.attempt.';

/** Each account's reads and writes settle in invocation order, including failed operations. */
export class SecureOrderAttemptStore implements OrderAttemptStore {
  private readonly queues = new Map<string, Promise<void>>();
  private readonly options: OrderAttemptStorageOptions;

  constructor(private readonly storage: OrderAttemptStorage, options: OrderAttemptStorageOptions) {
    this.options = Object.freeze({ ...options });
  }

  async get(accountId: string): Promise<OrderAttempt | null> {
    const account = orderAttemptAccountId(accountId);
    return this.serialize(account, async () => {
      try {
        const raw = await this.storage.getItemAsync(ORDER_ATTEMPT_KEY_PREFIX + account, this.options);
        if (raw === null) return null;
        return snapshotOrderAttempt(account, JSON.parse(raw));
      } catch { throw orderAttemptStorageError(); }
    });
  }

  async set(accountId: string, attempt: OrderAttempt): Promise<void> {
    const account = orderAttemptAccountId(accountId);
    const snapshot = snapshotOrderAttempt(account, attempt);
    const raw = JSON.stringify(snapshot);
    return this.serialize(account, async () => {
      try {
        await this.storage.setItemAsync(ORDER_ATTEMPT_KEY_PREFIX + account, raw, this.options);
      } catch { throw orderAttemptStorageError(); }
    });
  }

  async clear(accountId: string): Promise<void> {
    const account = orderAttemptAccountId(accountId);
    return this.serialize(account, async () => {
      try {
        await this.storage.deleteItemAsync(ORDER_ATTEMPT_KEY_PREFIX + account, this.options);
      } catch { throw orderAttemptStorageError(); }
    });
  }

  private serialize<T>(account: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(account) ?? Promise.resolve();
    const result = previous.then(operation);
    const settled = result.then(() => undefined, () => undefined);
    this.queues.set(account, settled);
    void settled.then(() => { if (this.queues.get(account) === settled) this.queues.delete(account); });
    return result;
  }
}
