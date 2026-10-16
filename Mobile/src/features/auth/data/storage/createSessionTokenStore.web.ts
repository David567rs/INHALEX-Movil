import type { SessionTokenStore } from '../../domain/storage/SessionTokenStore';

/** Web sessions stay only in the coordinator's private memory, without durable storage. */
export function createSessionTokenStore(): SessionTokenStore {
  return {
    set: () => Promise.resolve(),
    clear: () => Promise.resolve(),
  };
}
