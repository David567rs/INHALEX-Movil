import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { createMoreAction } from '@/bootstrap/createMoreAction';
import { MoreInformationScreen } from '@/features/more/presentation/screens/MoreInformationScreen';

export default function MoreInformationRoute() {
  const { section } = useLocalSearchParams<{ section?: string | string[] }>();
  const [loadContent] = useState(() => createMoreAction());
  return <MoreInformationScreen section={Array.isArray(section) ? section[0] ?? '' : section ?? ''} loadContent={loadContent} />;
}
