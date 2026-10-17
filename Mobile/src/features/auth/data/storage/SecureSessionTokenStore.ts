import type { SecureStoreOptions } from 'expo-secure-store';
import type { SessionTokenStore } from '../../domain/storage/SessionTokenStore';

export type SecureSessionStorage = {
  getItemAsync(key: string, options?: SecureStoreOptions): Promise<string | null>;
  setItemAsync(key: string, value: string, options?: SecureStoreOptions): Promise<void>;
  deleteItemAsync(key: string, options?: SecureStoreOptions): Promise<void>;
};

export const SESSION_TOKEN_KEY = 'inhalex.auth.access-token';

/** Private storage boundary for the access token; it does not interpret or cache credentials. */
export class SecureSessionTokenStore implements SessionTokenStore {
  private readonly storage: SecureSessionStorage;
  private readonly options: Readonly<SecureStoreOptions>;

  constructor(storage: SecureSessionStorage, options: Readonly<SecureStoreOptions>) {
    this.storage = storage;
    this.options = Object.freeze({ ...options });
  }

  async get(): Promise<string | null> {
    return await this.storage.getItemAsync(SESSION_TOKEN_KEY, this.options);
  }

  async set(token: string): Promise<void> {
    await this.storage.setItemAsync(SESSION_TOKEN_KEY, token, this.options);
  }

  async clear(): Promise<void> {
    await this.storage.deleteItemAsync(SESSION_TOKEN_KEY, this.options);
  }
}
