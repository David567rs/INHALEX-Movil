import type { MoreContent } from '../models/MoreContent';

/** Public information; no account or credential is required. */
export interface MoreRepository {
  getContent(): Promise<MoreContent>;
}
