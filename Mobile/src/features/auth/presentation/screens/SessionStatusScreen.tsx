import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AppScreen } from '@/shared/components/AppScreen';
import { BackButton } from '@/shared/components/ScreenHeader';
import { LoadingState, ScreenState } from '@/shared/components/ScreenFeedback';

interface SessionStatusScreenProps {
  checking: boolean;
  message: string | null;
  onRetry?: () => Promise<void>;
  onSignOut?: () => Promise<void>;
  onBack?: () => void;
}

/** Presents restoration state without ever receiving a stored credential. */
export function SessionStatusScreen({ checking, message, onRetry, onSignOut, onBack }: SessionStatusScreenProps) {
  return (
    <AppScreen title="Cuenta" eyebrow="Un momento para ti" includeBottomInset action={onBack ? <BackButton onPress={onBack} /> : undefined}>
      {checking ? <LoadingState label="Comprobando tu sesión" message="Estamos verificando tu acceso a INHALEX." />
        : <ScreenState title="Retomemos con calma" icon="cloud-offline-outline"
            message={message ?? 'No pudimos comprobar tu sesión. Puedes reintentar o iniciar sesión de nuevo.'}
            actionLabel="Reintentar" onAction={onRetry} />}
      <View style={styles.actions}>
        {!checking ? <Pressable accessibilityRole="button" onPress={() => router.push('/sign-in')} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}><Text style={styles.secondaryText}>Iniciar sesión</Text></Pressable> : null}
        {onSignOut ? <Pressable accessibilityRole="button" onPress={onSignOut} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}><Text style={styles.secondaryText}>Cerrar sesión</Text></Pressable> : null}
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/(tabs)')} style={({ pressed }) => [styles.link, pressed && styles.pressed]}><Text style={styles.secondaryText}>Volver al inicio</Text></Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 12, marginTop: 24 },
  secondary: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 15, borderWidth: 1, justifyContent: 'center', minHeight: 52, padding: 14 },
  secondaryText: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
  link: { alignItems: 'center', justifyContent: 'center', minHeight: 48, padding: 12 },
  pressed: { opacity: 0.75 },
});
