import { router } from 'expo-router';
import { AccountMenuItem } from '@/shared/components/AccountMenuItem';

export function ProfileEntry() {
  return <AccountMenuItem icon="person-outline" title="Perfil del usuario"
    hint="Consulta y actualiza tus datos" accessibilityLabel="Ver perfil del usuario"
    onPress={() => router.push('/perfil-usuario')} />;
}
