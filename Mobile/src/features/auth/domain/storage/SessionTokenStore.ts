/** Private credential boundary. Presentation never reads a token from this store. */
export interface SessionTokenStore {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
}
