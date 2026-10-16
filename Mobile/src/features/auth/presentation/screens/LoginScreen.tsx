import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AuthScaffold } from '../components/AuthScaffold';
import { FormField } from '../components/FormField';
import { useLoginViewModel } from '../viewModels/useLoginViewModel';
import type { LoginField } from '../../domain/validation/loginValidation';
import type { AuthSession } from '../../domain/session/AuthSession';

/** Renders the ViewModel; the composition root supplies the sign-in operation. */
export function LoginScreen({ signIn, sessionMessage, retrySession }: {
  signIn: AuthSession['signIn'];
  sessionMessage?: string | null;
  retrySession?: AuthSession['restore'];
}) {
  const viewModel = useLoginViewModel(signIn);
  const emailInput = useRef<TextInput>(null);
  const passwordInput = useRef<TextInput>(null);
  const [focusRequest, setFocusRequest] = useState<{ field: LoginField } | null>(null);

  useEffect(() => {
    if (!focusRequest) return;
    const inputs = { email: emailInput, password: passwordInput };
    inputs[focusRequest.field].current?.focus();
  }, [focusRequest]);

  async function submit() {
    setFocusRequest(null);
    const pending = viewModel.submit();
    Keyboard.dismiss();
    const firstInvalidField = await pending;
    if (firstInvalidField) setFocusRequest({ field: firstInvalidField });
  }

  return (
    <AuthScaffold
      title="Bienvenido"
      subtitle="Un respiro para volver a ti."
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Aún no tienes una cuenta?</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: viewModel.isSubmitting }}
            disabled={viewModel.isSubmitting}
            onPress={() => router.replace('/register')}
            style={({ pressed }) => [styles.registerLink, pressed && styles.pressed]}
          >
            <Text style={styles.registerLabel}>Crear cuenta</Text>
          </Pressable>
        </View>
      }
    >
      {sessionMessage && !viewModel.message ? <View accessibilityLiveRegion="polite" style={styles.sessionNotice}>
        <Text style={styles.sessionNoticeLabel}>{sessionMessage}</Text>
        {retrySession ? <Pressable accessibilityRole="button" disabled={viewModel.isSubmitting} onPress={retrySession} style={styles.retrySession}><Text style={styles.registerLabel}>Reintentar sesión guardada</Text></Pressable> : null}
      </View> : null}
      <FormField
        ref={emailInput} label="Correo electrónico" icon="mail-outline" placeholder="tu@email.com"
        value={viewModel.form.email} error={viewModel.errors.email}
        editable={!viewModel.isSubmitting}
        onChangeText={(value) => viewModel.updateField('email', value)} onBlur={() => viewModel.touchField('email')}
        autoCapitalize="none" autoCorrect={false} autoComplete="username"
        textContentType="username" keyboardType="email-address"
        returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => passwordInput.current?.focus()}
      />
      <FormField
        ref={passwordInput} label="Contraseña" icon="lock-closed-outline" placeholder="Tu contraseña" isPassword
        value={viewModel.form.password} error={viewModel.errors.password}
        editable={!viewModel.isSubmitting}
        onChangeText={(value) => viewModel.updateField('password', value)} onBlur={() => viewModel.touchField('password')}
        autoComplete="current-password" textContentType="password"
        returnKeyType="done" submitBehavior="submit"
        blurOnSubmit={Platform.OS === 'web' ? false : undefined} onSubmitEditing={submit}
      />
      {viewModel.message ? (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.notice, styles.invalidNotice]}
        >
          <Ionicons accessible={false} name="alert-circle-outline" size={19} color={colors.danger} />
          <Text style={[styles.noticeLabel, { color: colors.danger }]}>
            {viewModel.message}
          </Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={viewModel.isSubmitting ? 'Iniciando sesión' : 'Iniciar sesión'}
        accessibilityState={{ disabled: viewModel.isSubmitting, busy: viewModel.isSubmitting }}
        disabled={viewModel.isSubmitting}
        onPress={submit}
        style={({ pressed }) => [styles.loginButton, (pressed || viewModel.isSubmitting) && styles.pressed]}
      >
        <Text style={styles.loginLabel}>{viewModel.isSubmitting ? 'Iniciando sesión…' : 'Iniciar sesión'}</Text>
        {viewModel.isSubmitting ? <ActivityIndicator color={colors.white} size="small" /> : <Ionicons accessible={false} name="arrow-forward" color={colors.white} size={19} />}
      </Pressable>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  sessionNotice: { backgroundColor: colors.surfaceSoft, borderRadius: 12, marginBottom: 18, padding: 12 },
  sessionNoticeLabel: { color: colors.textMuted, fontSize: 13, lineHeight: 20 },
  retrySession: { justifyContent: 'center', minHeight: 44 },
  notice: { alignItems: 'flex-start', borderRadius: 12, flexDirection: 'row', gap: 8, marginBottom: 16, padding: 12 },
  invalidNotice: { backgroundColor: colors.dangerSoft },
  noticeLabel: { flex: 1, fontSize: 13, lineHeight: 19 },
  loginButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 16, flexDirection: 'row', gap: 9, justifyContent: 'center', minHeight: 56, paddingHorizontal: 16, paddingVertical: 14 },
  loginLabel: { color: colors.white, fontSize: 16, fontWeight: '700' },
  footer: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' },
  footerText: { color: colors.textMuted, fontSize: 13 },
  registerLink: { alignItems: 'center', borderRadius: 12, justifyContent: 'center', minHeight: 44, paddingHorizontal: 8 },
  registerLabel: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
