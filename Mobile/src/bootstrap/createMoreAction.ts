import { LocalMoreRepository } from '@/features/more/data/repositories/LocalMoreRepository';
import { createLoadMoreContent } from '@/features/more/domain/useCases/loadMoreContent';

export function createMoreAction() {
  return createLoadMoreContent(new LocalMoreRepository());
}
