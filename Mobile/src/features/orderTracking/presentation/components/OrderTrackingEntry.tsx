import { router } from 'expo-router';
import { AccountMenuItem } from '@/shared/components/AccountMenuItem';

export function OrderTrackingEntry() {
  return <AccountMenuItem icon="git-branch-outline" title="Seguimiento del pedido"
    hint="Revisa el estado de tus pedidos" accessibilityLabel="Ver seguimiento del pedido"
    onPress={() => router.push('/seguimiento-pedido')} />;
}
