import type { MoreContentResult } from '../models/MoreContentResult';

/** Public information; no account or credential is required. */
export interface MoreRepository {
  getContent(): Promise<MoreContentResult>;
}
