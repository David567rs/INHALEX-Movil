import { router } from 'expo-router';
import { AccountMenuItem } from '@/shared/components/AccountMenuItem';

export function NoticesEntry() {
  return <AccountMenuItem icon="notifications-outline" title="Avisos"
    hint="Novedades de tus pedidos y tu cuenta" accessibilityLabel="Ver avisos de mi cuenta"
    onPress={() => router.push('/avisos')} />;
}
