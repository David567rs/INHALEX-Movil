import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AppScreen } from '@/shared/components/AppScreen';
import { FeedbackBanner } from '@/shared/components/ScreenFeedback';
import { PreparationScreen } from '@/features/shell/presentation/screens/PreparationScreen';
import type { LoginUser } from '../../domain/models/Login';
import type { AuthSession, AuthSessionState } from '../../domain/session/AuthSession';
import { useAccountViewModel } from '../viewModels/useAccountViewModel';
import { SessionStatusScreen } from './SessionStatusScreen';

/** Session summary and navigation share one scroll area above the tab bar. */
export function AccountScreen({ user, signOut, status, message, restore, children }: {
  user: LoginUser | null;
  signOut: AuthSession['signOut'];
  status: AuthSessionState['status'];
  message: string | null;
  restore: AuthSession['restore'];
  children?: ReactNode;
}) {
  const viewModel = useAccountViewModel(signOut);
  if (status === 'checking' || status === 'recovery-error') return <SessionStatusScreen checking={status === 'checking'} message={message} onRetry={restore} onSignOut={viewModel.logout} />;
  if (!user) return <PreparationScreen section="cuenta" notice={viewModel.message ?? message} retry={viewModel.message ? viewModel.logout : undefined} isRetrying={viewModel.isSigningOut} />;

  return (
    <AppScreen title="Cuenta" eyebrow="Un momento para ti">
      <View style={styles.profile}>
        <View accessible={false} aria-hidden style={styles.avatar}>
          <Ionicons name="person-outline" size={27} color={colors.primaryDark} />
        </View>
        <View style={styles.profileCopy}>
          <Text accessibilityRole="header" style={styles.name}>Hola, {user.firstName || user.displayName || 'bienvenido'}</Text>
          <Text selectable style={styles.email}>{user.email}</Text>
          <View style={styles.status}>
            <Ionicons accessible={false} name="checkmark-circle-outline" size={14} color={colors.primary} />
            <Text style={styles.statusText}>Sesión iniciada</Text>
          </View>
        </View>
      </View>
      {children}
      {viewModel.message ? <FeedbackBanner message={viewModel.message} /> : null}
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: viewModel.isSigningOut, busy: viewModel.isSigningOut }} disabled={viewModel.isSigningOut} onPress={viewModel.logout} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        {viewModel.isSigningOut ? <ActivityIndicator color={colors.primaryDark} /> : <Ionicons accessible={false} name="log-out-outline" size={20} color={colors.primaryDark} />}
        <Text style={styles.buttonText}>{viewModel.isSigningOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</Text>
      </Pressable>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  profile: { alignItems: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, flexDirection: 'row', gap: 14, padding: 18 },
  avatar: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 17, height: 48, justifyContent: 'center', width: 48 },
  profileCopy: { flex: 1, minWidth: 0 },
  name: { color: colors.text, fontSize: 20, fontWeight: '700', lineHeight: 27 },
  email: { color: colors.textMuted, fontSize: 13, lineHeight: 21, marginTop: 5 },
  status: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 10 },
  statusText: { color: colors.primary, flexShrink: 1, fontSize: 11, fontWeight: '600', lineHeight: 17 },
  button: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 24, minHeight: 52, padding: 14 },
  buttonText: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
