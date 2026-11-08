import type { MoreContent } from '../../domain/models/MoreContent';
import type { MoreRepository } from '../../domain/repositories/MoreRepository';
import { moreContent } from '../content/moreContent';

/** Design stage: bundled editorial content, no HTTP or changes to customer data. */
export class LocalMoreRepository implements MoreRepository {
  async getContent(): Promise<MoreContent> {
    return moreContent;
  }
}
