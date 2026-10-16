import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AuthScaffold } from '../components/AuthScaffold';
import { FormField } from '../components/FormField';
import { PasswordRequirements } from '../components/PasswordRequirements';
import { useRegisterViewModel } from '../viewModels/useRegisterViewModel';
import type { RegistrationField } from '../../domain/validation/registrationValidation';
import type { RegisterUser } from '../../domain/useCases/registerUser';

/** Renders state and delegates registration to the ViewModel. */
export function RegisterScreen({ registerUser }: { registerUser: RegisterUser }) {
  const viewModel = useRegisterViewModel(registerUser);
  const firstNameInput = useRef<TextInput>(null);
  const lastNameInput = useRef<TextInput>(null);
  const emailInput = useRef<TextInput>(null);
  const phoneInput = useRef<TextInput>(null);
  const passwordInput = useRef<TextInput>(null);
  const confirmationInput = useRef<TextInput>(null);
  const [focusRequest, setFocusRequest] = useState<{ field: RegistrationField } | null>(null);

  useEffect(() => {
    if (!focusRequest) return;
    const inputs = { firstName: firstNameInput, lastName: lastNameInput, email: emailInput, phone: phoneInput, password: passwordInput, confirmPassword: confirmationInput };
    inputs[focusRequest.field].current?.focus();
  }, [focusRequest]);

  async function submitForm() {
    setFocusRequest(null);
    Keyboard.dismiss();
    const firstInvalidField = await viewModel.submit();
    if (firstInvalidField) setFocusRequest({ field: firstInvalidField });
  }

  if (viewModel.registeredUser) {
    return (
      <AuthScaffold title="Tu cuenta está lista" subtitle="Gracias por ser parte de INHALEX.">
        <View accessibilityLiveRegion="polite" style={styles.successContent}>
          <View style={styles.successIcon}>
            <Ionicons accessible={false} name="checkmark-circle-outline" size={44} color={colors.success} />
          </View>
          <Text style={styles.successText}>{viewModel.registeredUser.firstName}, tu cuenta fue creada correctamente.</Text>
          <Text style={styles.successEmail}>{viewModel.registeredUser.email}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.replace('/(tabs)/cuenta')} style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}>
          <Text style={styles.createLabel}>Volver a Cuenta</Text>
          <Ionicons accessible={false} name="arrow-forward" color={colors.white} size={19} />
        </Pressable>
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold
      title="Crear cuenta"
      subtitle="Tu bienestar empieza aquí."
      footer={
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes una cuenta?</Text>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: true }} disabled style={styles.loginLink}>
            <Text style={styles.loginLabel}>Inicia sesión</Text>
          </Pressable>
        </View>
      }
    >
      <FormField
        ref={firstNameInput} label="Nombre" icon="person-outline" placeholder="Tu nombre"
        value={viewModel.form.firstName} error={viewModel.errors.firstName}
        editable={!viewModel.isSubmitting}
        onChangeText={(value) => viewModel.updateField('firstName', value)} onBlur={() => viewModel.touchField('firstName')}
        autoCapitalize="words" autoComplete="given-name" textContentType="givenName"
        returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => lastNameInput.current?.focus()}
      />
      <FormField
        ref={lastNameInput} label="Apellido" icon="person-outline" placeholder="Tu apellido"
        value={viewModel.form.lastName} error={viewModel.errors.lastName}
        editable={!viewModel.isSubmitting}
        onChangeText={(value) => viewModel.updateField('lastName', value)} onBlur={() => viewModel.touchField('lastName')}
        autoCapitalize="words" autoComplete="family-name" textContentType="familyName"
        returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => emailInput.current?.focus()}
      />
      <FormField
        ref={emailInput} label="Correo electrónico" icon="mail-outline" placeholder="tu@email.com"
        value={viewModel.form.email} error={viewModel.errors.email}
        editable={!viewModel.isSubmitting}
        onChangeText={(value) => viewModel.updateField('email', value)} onBlur={() => viewModel.touchField('email')}
        autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" keyboardType="email-address"
        returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => phoneInput.current?.focus()}
      />
      <FormField
        ref={phoneInput} label="Número telefónico" icon="call-outline" placeholder="5512345678"
        value={viewModel.form.phone} error={viewModel.errors.phone}
        editable={!viewModel.isSubmitting}
        onChangeText={(value) => viewModel.updateField('phone', value)} onBlur={() => viewModel.touchField('phone')}
        autoComplete="tel" textContentType="telephoneNumber" keyboardType="phone-pad"
        returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => passwordInput.current?.focus()}
      />
      <FormField
        ref={passwordInput} label="Contraseña" icon="lock-closed-outline" placeholder="Tu contraseña" isPassword
        value={viewModel.form.password} error={viewModel.errors.password}
        editable={!viewModel.isSubmitting}
        onChangeText={(value) => viewModel.updateField('password', value)} onBlur={() => viewModel.touchField('password')}
        autoComplete="new-password" textContentType="newPassword"
        returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => confirmationInput.current?.focus()}
      />
      <PasswordRequirements checks={viewModel.checks} hasValue={viewModel.form.password.length > 0} />
      <FormField
        ref={confirmationInput} label="Confirmar contraseña" icon="shield-checkmark-outline" placeholder="Repítela" isPassword
        value={viewModel.form.confirmPassword} error={viewModel.errors.confirmPassword}
        editable={!viewModel.isSubmitting}
        onChangeText={(value) => viewModel.updateField('confirmPassword', value)} onBlur={() => viewModel.touchField('confirmPassword')}
        autoComplete="new-password" textContentType="newPassword" returnKeyType="done" onSubmitEditing={submitForm}
      />
      {viewModel.message ? (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.notice, styles.invalidNotice]}
        >
          <Ionicons accessible={false} name="alert-circle-outline" size={19} color={colors.danger} />
          <Text style={styles.noticeLabel}>
            {viewModel.message}
          </Text>
        </View>
      ) : null}
      <Pressable
        accessibilityLabel={viewModel.isSubmitting ? 'Creando cuenta' : 'Crear cuenta'}
        accessibilityRole="button"
        accessibilityState={{ disabled: viewModel.isSubmitting, busy: viewModel.isSubmitting }}
        disabled={viewModel.isSubmitting}
        onPress={submitForm}
        style={({ pressed }) => [styles.createButton, pressed && styles.pressed, viewModel.isSubmitting && styles.submitting]}
      >
        <Text accessibilityLiveRegion="polite" style={styles.createLabel}>{viewModel.isSubmitting ? 'Creando cuenta…' : 'Crear cuenta'}</Text>
        {viewModel.isSubmitting ? <ActivityIndicator accessible={false} color={colors.white} size="small" /> : <Ionicons accessible={false} name="arrow-forward" color={colors.white} size={19} />}
      </Pressable>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  notice: { alignItems: 'flex-start', borderRadius: 12, flexDirection: 'row', gap: 8, marginBottom: 16, padding: 12 },
  invalidNotice: { backgroundColor: colors.dangerSoft },
  noticeLabel: { color: colors.danger, flex: 1, fontSize: 13, lineHeight: 19 },
  successContent: { alignItems: 'center', gap: 14, marginBottom: 28 },
  successIcon: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 40, height: 80, justifyContent: 'center', width: 80 },
  successText: { color: colors.text, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  successEmail: { color: colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  createButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 16, flexDirection: 'row', gap: 9, justifyContent: 'center', minHeight: 56, paddingHorizontal: 16, paddingVertical: 14 },
  pressed: { opacity: 0.8 },
  submitting: { opacity: 0.8 },
  createLabel: { color: colors.white, fontSize: 16, fontWeight: '700' },
  footer: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' },
  footerText: { color: colors.textMuted, fontSize: 13 },
  loginLink: { alignItems: 'center', borderRadius: 12, justifyContent: 'center', minHeight: 44, paddingHorizontal: 8 },
  loginLabel: { color: colors.primary, fontSize: 14, fontWeight: '700', opacity: 0.65 },
});
