import { createContext, useContext, useEffect, type PropsWithChildren } from 'react';
import type { ReviewsController } from '../state/createReviewsController';

const ReviewsContext = createContext<ReviewsController | null>(null);
export function ReviewsProvider({ controller, children }: PropsWithChildren<{ controller: ReviewsController }>) {
  useEffect(() => { controller.start(); return controller.stop; }, [controller]);
  return <ReviewsContext.Provider value={controller}>{children}</ReviewsContext.Provider>;
}
export function useReviewsController() {
  const controller = useContext(ReviewsContext);
  if (!controller) throw new Error('ReviewsProvider is required.');
  return controller;
}
