import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { Reveal } from '@/shared/components/Motion';
import { AuthBackdrop } from './AuthBackdrop';

interface AuthScaffoldProps extends PropsWithChildren {
  title: string;
  subtitle?: string;
  footer?: ReactNode;
}

/** Visual scaffold recovered from the original minimal registration layout. */
export function AuthScaffold({ title, subtitle, footer, children }: AuthScaffoldProps) {
  const { height, width, fontScale } = useWindowDimensions();
  const compact = height < 700 || width < 360 || fontScale > 1.25;

  function returnToAccount() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/cuenta');
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
      <AuthBackdrop compact={compact} mirrored />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={[styles.content, compact && styles.compactContent]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.shell}>
            <Pressable
              accessibilityLabel="Volver a Cuenta"
              accessibilityRole="button"
              onPress={returnToAccount}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <Ionicons accessible={false} name="arrow-back" color={colors.primaryDark} size={20} />
              <Text style={styles.backLabel}>Volver</Text>
            </Pressable>

            <Reveal style={styles.brand}>
              <Image
                accessibilityLabel="INHALEX, el respiro que alivia"
                source={require('../../../../../assets/home/brand.png')}
                resizeMode="contain"
                style={[styles.logo, compact && styles.compactLogo]}
              />
            </Reveal>

            <Reveal delay={70} style={[styles.card, compact && styles.compactCard]}>
              <Text accessibilityRole="header" style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              {children}
            </Reveal>

            {footer ? <Reveal delay={120} style={styles.footer}>{footer}</Reveal> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background, overflow: 'hidden' },
  flex: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingBottom: 30, paddingTop: 12 },
  compactContent: { paddingHorizontal: 16, paddingBottom: 24, paddingTop: 8 },
  shell: { alignSelf: 'center', maxWidth: 420, width: '100%' },
  backButton: { alignItems: 'center', alignSelf: 'flex-start', borderRadius: 14, flexDirection: 'row', gap: 7, minHeight: 44, paddingHorizontal: 10 },
  backLabel: { color: colors.primaryDark, fontSize: 13, fontWeight: '600' },
  pressed: { backgroundColor: colors.surfaceSoft },
  brand: { alignItems: 'center', marginBottom: 24, marginTop: 6 },
  logo: { height: 86, maxWidth: 252, width: '100%' },
  compactLogo: { height: 76, maxWidth: 230 },
  card: {
    backgroundColor: colors.surface,
    borderColor: '#E7EEE5',
    borderRadius: 28,
    borderWidth: 1,
    padding: 26,
    ...Platform.select({
      web: { boxShadow: '0 12px 28px rgba(18, 53, 31, 0.045)' },
      default: { shadowColor: colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.045, shadowRadius: 18, elevation: 2 },
    }),
  },
  compactCard: { padding: 20 },
  title: { color: colors.primaryDark, fontSize: 28, fontWeight: '700', letterSpacing: -0.65, textAlign: 'center' },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 26, marginTop: 8, textAlign: 'center' },
  footer: { marginTop: 18 },
});
