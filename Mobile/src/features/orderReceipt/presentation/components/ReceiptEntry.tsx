import { router } from 'expo-router';
import { AccountMenuItem } from '@/shared/components/AccountMenuItem';

export function ReceiptEntry() {
  return <AccountMenuItem icon="cube-outline" title="Confirmación de recepción"
    hint="Revisa el diseño con un pedido de ejemplo."
    accessibilityLabel="Abrir Confirmación de recepción"
    onPress={() => router.push('/confirmacion-recepcion')} />;
}
