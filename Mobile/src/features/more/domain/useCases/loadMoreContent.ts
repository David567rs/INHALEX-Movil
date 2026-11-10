import type { MoreContentResult } from '../models/MoreContentResult';
import type { MoreRepository } from '../repositories/MoreRepository';

export type LoadMoreContent = () => Promise<MoreContentResult>;

export function createLoadMoreContent(repository: MoreRepository): LoadMoreContent {
  return () => repository.getContent();
}
