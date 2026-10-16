import type { SecureStoreOptions } from 'expo-secure-store';
import type { SessionTokenStore } from '../../domain/storage/SessionTokenStore';

export type SecureSessionStorage = {
  setItemAsync(key: string, value: string, options?: SecureStoreOptions): Promise<void>;
  deleteItemAsync(key: string, options?: SecureStoreOptions): Promise<void>;
};

export const SESSION_TOKEN_KEY = 'inhalex.auth.access-token';

/** Writes only the validated access token. This adapter has no session restoration operation. */
export class SecureSessionTokenStore implements SessionTokenStore {
  private readonly storage: SecureSessionStorage;
  private readonly options: Readonly<SecureStoreOptions>;

  constructor(storage: SecureSessionStorage, options: Readonly<SecureStoreOptions>) {
    this.storage = storage;
    this.options = Object.freeze({ ...options });
  }

  async set(token: string): Promise<void> {
    await this.storage.setItemAsync(SESSION_TOKEN_KEY, token, this.options);
  }

  async clear(): Promise<void> {
    await this.storage.deleteItemAsync(SESSION_TOKEN_KEY, this.options);
  }
}
