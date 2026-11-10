import type { MoreContentResult } from '../../domain/models/MoreContentResult';
import type { MoreRepository } from '../../domain/repositories/MoreRepository';
import { moreContent } from '../content/moreContent';
import { MORE_CONTENT_REVISION } from '../content/moreContentVersion';

/** Bundled public editorial fallback; never reads or writes customer data. */
export class LocalMoreRepository implements MoreRepository {
  async getContent(): Promise<MoreContentResult> {
    return { content: moreContent, source: 'bundled', revision: MORE_CONTENT_REVISION, warning: null };
  }
}
