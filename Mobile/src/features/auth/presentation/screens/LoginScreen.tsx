import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AuthScaffold } from '../components/AuthScaffold';
import { FormField } from '../components/FormField';
import { useLoginViewModel } from '../viewModels/useLoginViewModel';
import type { LoginField } from '../../domain/validation/loginValidation';

/** Renders local validation state; credential verification belongs to the API stage. */
export function LoginScreen() {
  const viewModel = useLoginViewModel();
  const emailInput = useRef<TextInput>(null);
  const passwordInput = useRef<TextInput>(null);
  const [focusRequest, setFocusRequest] = useState<{ field: LoginField } | null>(null);

  useEffect(() => {
    if (!focusRequest) return;
    const inputs = { email: emailInput, password: passwordInput };
    inputs[focusRequest.field].current?.focus();
  }, [focusRequest]);

  function validateForm() {
    const firstInvalidField = viewModel.validateForm();
    if (firstInvalidField) setFocusRequest({ field: firstInvalidField });
    else {
      setFocusRequest(null);
      Keyboard.dismiss();
    }
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
            onPress={() => router.replace('/register')}
            style={({ pressed }) => [styles.registerLink, pressed && styles.pressed]}
          >
            <Text style={styles.registerLabel}>Crear cuenta</Text>
          </Pressable>
        </View>
      }
    >
      <FormField
        ref={emailInput} label="Correo electrónico" icon="mail-outline" placeholder="tu@email.com"
        value={viewModel.form.email} error={viewModel.errors.email}
        onChangeText={(value) => viewModel.updateField('email', value)} onBlur={() => viewModel.touchField('email')}
        autoCapitalize="none" autoCorrect={false} autoComplete="username"
        textContentType="username" keyboardType="email-address"
        returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => passwordInput.current?.focus()}
      />
      <FormField
        ref={passwordInput} label="Contraseña" icon="lock-closed-outline" placeholder="Tu contraseña" isPassword
        value={viewModel.form.password} error={viewModel.errors.password}
        onChangeText={(value) => viewModel.updateField('password', value)} onBlur={() => viewModel.touchField('password')}
        autoComplete="current-password" textContentType="password"
        returnKeyType="done" submitBehavior="submit"
        blurOnSubmit={Platform.OS === 'web' ? false : undefined} onSubmitEditing={validateForm}
      />
      {viewModel.validationResult ? (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.notice, viewModel.validationResult === 'valid' ? styles.validNotice : styles.invalidNotice]}
        >
          <Ionicons accessible={false} name={viewModel.validationResult === 'valid' ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={19} color={viewModel.validationResult === 'valid' ? colors.success : colors.danger} />
          <Text style={[styles.noticeLabel, { color: viewModel.validationResult === 'valid' ? colors.success : colors.danger }]}>
            {viewModel.validationResult === 'valid' ? 'Los campos cumplen el formato requerido.' : 'Revisa los campos señalados.'}
          </Text>
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Validar datos"
        onPress={validateForm}
        style={({ pressed }) => [styles.loginButton, pressed && styles.pressed]}
      >
        <Text style={styles.loginLabel}>Validar datos</Text>
        <Ionicons accessible={false} name="checkmark" color={colors.white} size={19} />
      </Pressable>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  notice: { alignItems: 'flex-start', borderRadius: 12, flexDirection: 'row', gap: 8, marginBottom: 16, padding: 12 },
  validNotice: { backgroundColor: colors.surfaceSoft },
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
