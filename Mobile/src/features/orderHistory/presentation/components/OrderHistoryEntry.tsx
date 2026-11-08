import { router } from 'expo-router';
import { AccountMenuItem } from '@/shared/components/AccountMenuItem';

export function OrderHistoryEntry() {
  return <AccountMenuItem icon="receipt-outline" title="Historial de pedidos"
    hint="Consulta tus compras" accessibilityLabel="Ver historial de pedidos"
    onPress={() => router.push('/historial-pedidos')} />;
}
