import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AppScreen, ModuleCard } from '@/shared/components/AppScreen';
import { PreparationScreen } from '@/features/shell/presentation/screens/PreparationScreen';
import type { LoginUser } from '../../domain/models/Login';
import type { AuthSession, AuthSessionState } from '../../domain/session/AuthSession';
import { useAccountViewModel } from '../viewModels/useAccountViewModel';
import { SessionStatusScreen } from './SessionStatusScreen';

/** Current-session confirmation; editing the profile is a separate activity. */
export function AccountScreen({ user, signOut, status, message, restore }: {
  user: LoginUser | null;
  signOut: AuthSession['signOut'];
  status: AuthSessionState['status'];
  message: string | null;
  restore: AuthSession['restore'];
}) {
  const viewModel = useAccountViewModel(signOut);
  if (status === 'checking' || status === 'recovery-error') return <SessionStatusScreen checking={status === 'checking'} message={message} onRetry={restore} onSignOut={viewModel.logout} />;
  if (!user) return <PreparationScreen section="cuenta" notice={viewModel.message ?? message} retry={viewModel.message ? viewModel.logout : undefined} isRetrying={viewModel.isSigningOut} />;

  return (
    <AppScreen title="Cuenta" eyebrow="Un momento para ti">
      <View accessibilityLiveRegion="polite" style={styles.status}>
        <Ionicons accessible={false} name="checkmark-circle-outline" size={18} color={colors.primaryDark} />
        <Text style={styles.statusText}>Sesión iniciada</Text>
      </View>
      <ModuleCard
        icon={<Ionicons accessible={false} name="person-outline" size={29} color={colors.primary} />}
        title={`Hola, ${user.firstName}`}
        description="Qué bueno tenerte de vuelta en INHALEX."
      />
      <Text selectable style={styles.email}>{user.email}</Text>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: viewModel.isSigningOut, busy: viewModel.isSigningOut }} disabled={viewModel.isSigningOut} onPress={viewModel.logout} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        {viewModel.isSigningOut ? <ActivityIndicator color={colors.primaryDark} /> : <Ionicons accessible={false} name="log-out-outline" size={20} color={colors.primaryDark} />}
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </Pressable>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  status: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.surfaceSoft, borderRadius: 14, flexDirection: 'row', gap: 7, marginBottom: 18, padding: 12 },
  statusText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  email: { color: colors.textMuted, fontSize: 14, lineHeight: 22, marginTop: 18, textAlign: 'center' },
  button: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 24, minHeight: 52, padding: 14 },
  buttonText: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
