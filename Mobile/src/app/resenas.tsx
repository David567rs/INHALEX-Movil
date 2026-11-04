import { useState } from 'react';
import { createReviewPreviewAction } from '@/bootstrap/createReviewPreviewAction';
import { ReviewPreviewScreen } from '@/features/reviews/presentation/screens/ReviewPreviewScreen';

export default function ReviewsRoute() {
  const [action] = useState(() => createReviewPreviewAction());
  return <ReviewPreviewScreen action={action} />;
}
