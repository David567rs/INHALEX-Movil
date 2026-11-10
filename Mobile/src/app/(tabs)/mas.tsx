import { useState } from 'react';
import { createMoreAction } from '@/bootstrap/createMoreAction';
import { MoreScreen } from '@/features/more/presentation/screens/MoreScreen';

export default function MoreRoute() {
  const [loadContent] = useState(() => createMoreAction());
  return <MoreScreen loadContent={loadContent} />;
}
