import { router } from 'expo-router';
import { AccountMenuItem } from '@/shared/components/AccountMenuItem';

export function ReviewsEntry() {
  return <AccountMenuItem icon="star-outline" title="Reseñas"
    hint="Comparte tu opinión sobre los productos que recibiste."
    accessibilityLabel="Abrir Reseñas" onPress={() => router.push('/resenas')} />;
}
