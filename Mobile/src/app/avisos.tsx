import { useState } from 'react';
import { createNoticesPreviewAction } from '@/bootstrap/createNoticesPreviewAction';
import { NoticesPreviewScreen } from '@/features/notices/presentation/screens/NoticesPreviewScreen';

export default function NoticesRoute() {
  const [action] = useState(() => createNoticesPreviewAction());
  return <NoticesPreviewScreen action={action} />;
}
