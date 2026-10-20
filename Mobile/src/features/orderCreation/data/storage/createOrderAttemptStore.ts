import * as SecureStore from 'expo-secure-store';
import type { OrderAttemptStore } from '../../domain/storage/OrderAttemptStore';
import { SecureOrderAttemptStore } from './SecureOrderAttemptStore';

export function createOrderAttemptStore(): OrderAttemptStore {
  return new SecureOrderAttemptStore(SecureStore, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    keychainService: 'inhalex.order.attempt',
    requireAuthentication: false,
  });
}
