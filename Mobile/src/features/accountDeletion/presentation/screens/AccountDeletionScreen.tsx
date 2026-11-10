import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { FormKeyboardLayout } from '@/shared/components/FormKeyboardLayout';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { MoreBackButton } from '@/features/more/presentation/components/MoreControls';
import { useAuthSession } from '@/features/auth/presentation/context/AuthSessionProvider';
import { useAccountDeletion } from '../context/AccountDeletionProvider';

export function AccountDeletionScreen() {
  const session = useAuthSession();
  const { expired } = useAccountDeletion();
  return <DeletionForm key={`${session.status}:${session.user?.id ?? ''}:${expired}`} />;
}

function DeletionForm() {
  const session = useAuthSession();
  const vm = useAccountDeletion();
  const { refresh } = vm;
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  useFocusEffect(useCallback(() => {
    if (session.status === 'authenticated') void refresh();
    return () => { setPassword(''); setConfirmation(''); };
  }, [session.status, refresh]));
  const authenticated = session.status === 'authenticated';
  const canSubmit = authenticated && vm.loaded && !vm.busy && !vm.requiresVerification && !vm.expired && !vm.request;
  async function send() {
    if (!canSubmit) return;
    Keyboard.dismiss();
    const input = { password, confirmation };
    setPassword(''); setConfirmation('');
    await vm.submit(input);
  }
  async function reauthenticate() {
    try { await session.signOut(); router.replace('/sign-in'); }
    catch {
      // Auth retains the safe storage error in its public state for Cuenta.
      router.replace('/cuenta');
    }
  }
  return <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safe}>
    <FormKeyboardLayout>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <ScreenHeader title="Eliminar cuenta" eyebrow="Privacidad" leading={<MoreBackButton />} />
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>Tú decides sobre tu cuenta</Text>
          <Text style={styles.body}>Puedes solicitar la eliminación de tu cuenta y de los datos asociados. El responsable de INHALEX atenderá la solicitud y te contactará por el correo de tu cuenta.</Text>
          <Text style={styles.body}>Solicitarla no borra los datos de inmediato ni cancela pedidos pendientes. Se revisarán los datos que deban conservarse por obligaciones legales, pedidos o devoluciones, y se te informará de ello.</Text>
          <Text style={styles.body}>También puedes escribir con el asunto «Eliminar cuenta INHALEX» a:</Text>
          <Text selectable style={styles.email}>danielcruzhernandezinhalex@gmail.com</Text>
          <Text style={styles.hint}>No envíes tu contraseña por correo. Si ya no puedes ingresar, usa este medio para solicitar ayuda con la verificación de tu identidad.</Text>
        </View>
        {!authenticated ? <View style={styles.card}>
          <Text style={styles.body}>{session.status === 'checking' ? 'Comprobando sesión…' : 'Ingresa para consultar o enviar una solicitud desde la app.'}</Text>
          {session.status !== 'checking' && <Action title="Ir a Cuenta" onPress={() => router.navigate('/cuenta')} />}
        </View> : <>
          {vm.message && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.notice}>{vm.message}</Text>}
          {vm.request ? <View style={styles.card}>
            <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.title}>Solicitud recibida</Text>
            <Text style={styles.body}>Pendiente de atención. Tu cuenta todavía no ha sido eliminada. Conserva esta referencia para consultar el seguimiento con INHALEX.</Text>
            <Text selectable style={styles.reference}>{vm.request.id}</Text>
            <Text style={styles.hint}>Registrada el {new Date(vm.request.createdAt).toLocaleDateString('es-MX')}</Text>
          </View> : vm.loaded && !vm.expired && <View style={styles.card}>
            <Text style={styles.body}>Para verificar que eres tú, escribe tu contraseña actual y la palabra ELIMINAR.</Text>
            <Text style={styles.label}>Contraseña actual</Text>
            <TextInput accessibilityLabel="Contraseña actual" value={password} onChangeText={setPassword} secureTextEntry
              autoComplete="current-password" textContentType="password" autoCapitalize="none" autoCorrect={false}
              maxLength={128} editable={canSubmit} accessibilityState={{ disabled: !canSubmit }} style={styles.input} />
            <Text style={styles.label}>Escribe ELIMINAR</Text>
            <TextInput accessibilityLabel="Escribe ELIMINAR" value={confirmation} onChangeText={setConfirmation}
              autoCapitalize="characters" autoCorrect={false} maxLength={20} editable={canSubmit}
              accessibilityState={{ disabled: !canSubmit }} style={styles.input} />
            <Action title={vm.busy ? 'Procesando…' : 'Solicitar eliminación'} disabled={!canSubmit || !password || confirmation.trim() !== 'ELIMINAR'} onPress={() => { void send(); }} />
          </View>}
          {vm.expired ? <Action title="Volver a iniciar sesión" onPress={() => { void reauthenticate(); }} />
            : <Action title={vm.busy ? 'Consultando…' : vm.requiresVerification ? 'Verificar solicitud' : 'Actualizar estado'} disabled={vm.busy} secondary onPress={() => { void vm.refresh(); }} />}
        </>}
      </ScrollView>
    </FormKeyboardLayout>
  </SafeAreaView>;
}

function Action({ title, onPress, disabled = false, secondary = false }: { title: string; onPress: () => void; disabled?: boolean; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, disabled && styles.disabled, pressed && styles.pressed]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{title}</Text>
  </Pressable>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 600, alignSelf: 'center', padding: 22, paddingBottom: 32, gap: 16 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 22, padding: 20, gap: 12 },
  title: { color: colors.primaryDark, fontSize: 20, lineHeight: 27, fontWeight: '700' },
  body: { color: colors.text, fontSize: 14, lineHeight: 23 },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
  email: { color: colors.primaryDark, fontSize: 14, lineHeight: 22, flexShrink: 1 },
  reference: { color: colors.primaryDark, fontWeight: '700', fontSize: 15, lineHeight: 24 },
  label: { color: colors.text, fontSize: 13, fontWeight: '600', marginTop: 4 },
  input: { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, minHeight: 52, color: colors.text, fontSize: 16 },
  button: { minHeight: 48, padding: 14, backgroundColor: colors.primaryDark, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  secondary: { backgroundColor: colors.surfaceSoft }, secondaryText: { color: colors.primaryDark },
  disabled: { opacity: 0.5 }, pressed: { opacity: 0.8 },
  notice: { color: colors.primaryDark, backgroundColor: colors.surfaceSoft, padding: 16, borderRadius: 14, fontSize: 14, lineHeight: 23 },
});
