import { router } from 'expo-router';
import { AccountMenuItem } from '@/shared/components/AccountMenuItem';

export function AddressesEntry() {
  return <AccountMenuItem icon="location-outline" title="Direcciones de envío"
    hint="Guarda y organiza tus destinos" accessibilityLabel="Ver direcciones de envío"
    onPress={() => router.push('/direcciones-envio')} />;
}
