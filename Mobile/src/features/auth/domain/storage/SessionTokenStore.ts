/** Write-only credential boundary. Restoring a saved session is a separate operation. */
export interface SessionTokenStore {
  set(token: string): Promise<void>;
  clear(): Promise<void>;
}
