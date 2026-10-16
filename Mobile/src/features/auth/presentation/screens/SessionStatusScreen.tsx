import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AppScreen, ModuleCard } from '@/shared/components/AppScreen';

interface SessionStatusScreenProps {
  checking: boolean;
  message: string | null;
  onRetry?: () => Promise<void>;
  onSignOut?: () => Promise<void>;
}

/** Presents restoration state without ever receiving a stored credential. */
export function SessionStatusScreen({ checking, message, onRetry, onSignOut }: SessionStatusScreenProps) {
  return (
    <AppScreen title="Cuenta" eyebrow="Un momento para ti">
      <View accessibilityLiveRegion="polite" accessibilityState={{ busy: checking }}>
        <ModuleCard
          icon={checking ? <ActivityIndicator accessibilityLabel="Comprobando sesión" color={colors.primary} size="large" /> : <Ionicons accessible={false} name="cloud-offline-outline" size={29} color={colors.primary} />}
          title={checking ? 'Comprobando tu sesión' : 'Retomemos con calma'}
          description={checking ? 'Estamos verificando tu acceso a INHALEX.' : (message ?? 'No pudimos comprobar tu sesión. Puedes reintentar o iniciar sesión de nuevo.')}
        />
      </View>
      <View style={styles.actions}>
        {!checking && onRetry ? <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text style={styles.primaryText}>Reintentar</Text></Pressable> : null}
        {!checking ? <Pressable accessibilityRole="button" onPress={() => router.push('/sign-in')} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}><Text style={styles.secondaryText}>Iniciar sesión</Text></Pressable> : null}
        {onSignOut ? <Pressable accessibilityRole="button" onPress={onSignOut} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}><Text style={styles.secondaryText}>Cerrar sesión</Text></Pressable> : null}
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/(tabs)')} style={({ pressed }) => [styles.link, pressed && styles.pressed]}><Text style={styles.secondaryText}>Volver al inicio</Text></Pressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  actions: { gap: 12, marginTop: 24 },
  primary: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 15, justifyContent: 'center', minHeight: 52, padding: 14 },
  primaryText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  secondary: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 15, borderWidth: 1, justifyContent: 'center', minHeight: 52, padding: 14 },
  secondaryText: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
  link: { alignItems: 'center', justifyContent: 'center', minHeight: 48, padding: 12 },
  pressed: { opacity: 0.75 },
});
