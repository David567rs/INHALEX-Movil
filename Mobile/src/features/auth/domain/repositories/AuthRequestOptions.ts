export interface AuthRequestOptions {
  signal?: AbortSignal;
  onWaitingForApi?: (waiting: boolean) => void;
}
