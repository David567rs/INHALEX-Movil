import { SecureOrderAttemptStore } from './SecureOrderAttemptStore';

/** Web recovery is ephemeral; no localStorage, sessionStorage or browser persistence. */
export class MemoryOrderAttemptStore extends SecureOrderAttemptStore {
  constructor() {
    const values = new Map<string, string>();
    super({
      getItemAsync: async (key) => values.get(key) ?? null,
      setItemAsync: async (key, value) => { values.set(key, value); },
      deleteItemAsync: async (key) => { values.delete(key); },
    }, {});
  }
}
