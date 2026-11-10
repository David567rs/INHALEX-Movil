import type { MoreContent } from './MoreContent';

export interface MoreContentResult {
  readonly content: MoreContent;
  readonly source: 'remote' | 'bundled' | 'memory';
  readonly revision: string;
  /** Public information remains readable when its latest version cannot be verified. */
  readonly warning: string | null;
}
