import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AuthScaffold } from '../components/AuthScaffold';
import { FormField } from '../components/FormField';

/** Registration presentation only; validation and submission are later steps. */
export function RegisterScreen() {
  const lastNameInput = useRef<TextInput>(null);
  const emailInput = useRef<TextInput>(null);
  const phoneInput = useRef<TextInput>(null);
  const passwordInput = useRef<TextInput>(null);
  const confirmationInput = useRef<TextInput>(null);

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
        label="Nombre" icon="person-outline" placeholder="Tu nombre"
        autoCapitalize="words" autoComplete="given-name" textContentType="givenName"
        returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => lastNameInput.current?.focus()}
      />
      <FormField
        ref={lastNameInput} label="Apellido" icon="person-outline" placeholder="Tu apellido"
        autoCapitalize="words" autoComplete="family-name" textContentType="familyName"
        returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => emailInput.current?.focus()}
      />
      <FormField
        ref={emailInput} label="Correo electrónico" icon="mail-outline" placeholder="tu@email.com"
        autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" keyboardType="email-address"
        returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => phoneInput.current?.focus()}
      />
      <FormField
        ref={phoneInput} label="Número telefónico" icon="call-outline" placeholder="5512345678"
        autoComplete="tel" textContentType="telephoneNumber" keyboardType="phone-pad"
        returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => passwordInput.current?.focus()}
      />
      <FormField
        ref={passwordInput} label="Contraseña" icon="lock-closed-outline" placeholder="Tu contraseña" isPassword
        autoComplete="new-password" textContentType="newPassword"
        returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => confirmationInput.current?.focus()}
      />
      <View style={styles.passwordHint}>
        <Ionicons accessible={false} name="information-circle-outline" color={colors.textMuted} size={16} />
        <Text style={styles.passwordHintText}>Usa al menos 8 caracteres, una mayúscula, un número y un símbolo.</Text>
      </View>
      <FormField
        ref={confirmationInput} label="Confirmar contraseña" icon="shield-checkmark-outline" placeholder="Repítela" isPassword
        autoComplete="new-password" textContentType="newPassword" returnKeyType="done"
      />
      <Pressable
        accessibilityLabel="Crear cuenta"
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        disabled
        style={styles.createButton}
      >
        <Text style={styles.createLabel}>Crear cuenta</Text>
        <Ionicons accessible={false} name="arrow-forward" color={colors.white} size={19} />
      </Pressable>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  passwordHint: { alignItems: 'flex-start', flexDirection: 'row', gap: 7, marginBottom: 20, marginTop: -6 },
  passwordHintText: { color: colors.textMuted, flex: 1, fontSize: 12, lineHeight: 18 },
  createButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 16, flexDirection: 'row', gap: 9, justifyContent: 'center', minHeight: 56, opacity: 0.7, paddingHorizontal: 16, paddingVertical: 14 },
  createLabel: { color: colors.white, fontSize: 16, fontWeight: '700' },
  footer: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' },
  footerText: { color: colors.textMuted, fontSize: 13 },
  loginLink: { alignItems: 'center', borderRadius: 12, justifyContent: 'center', minHeight: 44, paddingHorizontal: 8 },
  loginLabel: { color: colors.primary, fontSize: 14, fontWeight: '700', opacity: 0.65 },
});
