import { Redirect } from 'expo-router';
import { NoticesEmptyQaScreen } from '@/features/notices/testing/NoticesEmptyQaScreen';

export default function NoticesEmptyQaRoute() {
  return __DEV__ ? <NoticesEmptyQaScreen /> : <Redirect href="/avisos" />;
}
