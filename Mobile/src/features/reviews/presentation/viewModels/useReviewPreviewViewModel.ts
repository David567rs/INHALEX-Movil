import { useState } from 'react';
import type { ReadReviewPreview } from '../../domain/useCases/readReviewPreview';

export const REVIEW_PREVIEW_COMMENT_MAX_LENGTH = 700;

/** The rating and text are local design drafts; there is no publication action. */
export function useReviewPreviewViewModel(action: ReadReviewPreview) {
  const [preview] = useState(action);
  const [rating, setRating] = useState(0);
  const [comment, setCommentValue] = useState('');

  function setComment(value: string) {
    setCommentValue(value.slice(0, REVIEW_PREVIEW_COMMENT_MAX_LENGTH));
  }

  return { productName: preview.productName, rating, comment, setRating, setComment };
}
