import type { OrderAttemptStore } from '../../domain/storage/OrderAttemptStore';
import { MemoryOrderAttemptStore } from './MemoryOrderAttemptStore';

export function createOrderAttemptStore(): OrderAttemptStore {
  return new MemoryOrderAttemptStore();
}
