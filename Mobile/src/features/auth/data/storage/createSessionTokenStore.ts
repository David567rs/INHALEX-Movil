import * as SecureStore from 'expo-secure-store';

import type { SessionTokenStore } from '../../domain/storage/SessionTokenStore';
import { SecureSessionTokenStore } from './SecureSessionTokenStore';

export function createSessionTokenStore(): SessionTokenStore {
  return new SecureSessionTokenStore(SecureStore, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    keychainService: 'inhalex.auth.session',
    requireAuthentication: false,
  });
}
