import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AuthScaffold } from '../components/AuthScaffold';
import { FormField } from '../components/FormField';
import { useLoginViewModel } from '../viewModels/useLoginViewModel';

/** Visual sign-in stage: editable fields and navigation, without authentication. */
export function LoginScreen() {
  const viewModel = useLoginViewModel();
  const passwordInput = useRef<TextInput>(null);

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
        label="Correo electrónico" icon="mail-outline" placeholder="tu@email.com"
        value={viewModel.form.email} onChangeText={(value) => viewModel.updateField('email', value)}
        autoCapitalize="none" autoCorrect={false} autoComplete="username"
        textContentType="username" keyboardType="email-address"
        returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => passwordInput.current?.focus()}
      />
      <FormField
        ref={passwordInput} label="Contraseña" icon="lock-closed-outline" placeholder="Tu contraseña" isPassword
        value={viewModel.form.password} onChangeText={(value) => viewModel.updateField('password', value)}
        autoComplete="current-password" textContentType="password"
        returnKeyType="done" onSubmitEditing={() => Keyboard.dismiss()}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Entrar"
        accessibilityHint="El inicio de sesión estará disponible próximamente."
        accessibilityState={{ disabled: true }}
        disabled
        style={styles.loginButton}
      >
        <Text style={styles.loginLabel}>Entrar</Text>
        <Ionicons accessible={false} name="arrow-forward" color={colors.white} size={19} />
      </Pressable>
      <Text style={styles.availability}>El acceso a tu cuenta estará disponible próximamente.</Text>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  loginButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 16, flexDirection: 'row', gap: 9, justifyContent: 'center', minHeight: 56, opacity: 0.65, paddingHorizontal: 16, paddingVertical: 14 },
  loginLabel: { color: colors.white, fontSize: 16, fontWeight: '700' },
  availability: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 14, textAlign: 'center' },
  footer: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' },
  footerText: { color: colors.textMuted, fontSize: 13 },
  registerLink: { alignItems: 'center', borderRadius: 12, justifyContent: 'center', minHeight: 44, paddingHorizontal: 8 },
  registerLabel: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
