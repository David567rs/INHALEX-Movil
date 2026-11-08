import type { MoreContent } from '../models/MoreContent';
import type { MoreRepository } from '../repositories/MoreRepository';

export type LoadMoreContent = () => Promise<MoreContent>;

export function createLoadMoreContent(repository: MoreRepository): LoadMoreContent {
  return () => repository.getContent();
}
