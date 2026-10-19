import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { FormField } from '@/features/auth/presentation/components/FormField';
import type { ProfileDraft, ProfileField, ProfileFieldErrors } from '../../domain/models/Profile';

type Props = {
  draft: ProfileDraft;
  email: string;
  onChange(field: ProfileField, value: string): void;
  onCancel(): void;
  onSave(): void;
  saving: boolean;
  canSave: boolean;
  refreshing: boolean;
  errors: ProfileFieldErrors;
};

export function ProfileForm({ draft, email, onChange, onCancel, onSave, saving, canSave, refreshing, errors }: Props) {
  const lastNameInput = useRef<TextInput>(null);
  const phoneInput = useRef<TextInput>(null);
  function cancelEdit() {
    Keyboard.dismiss();
    onCancel();
  }

  return <View>
    <View style={styles.formCard}>
      <FormField label="Nombres" icon="person-outline" accessibilityLabel="Nombres"
        error={errors.firstName} editable={!saving && !refreshing}
        value={draft.firstName} onChangeText={(value) => onChange('firstName', value)}
        autoComplete="off" textContentType="none" importantForAutofill="no"
        autoCapitalize="words" autoCorrect={false} spellCheck={false}
        returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => lastNameInput.current?.focus()} />
      <FormField ref={lastNameInput} label="Apellidos" icon="person-outline" accessibilityLabel="Apellidos"
        error={errors.lastName} editable={!saving && !refreshing}
        value={draft.lastName} onChangeText={(value) => onChange('lastName', value)}
        autoComplete="off" textContentType="none" importantForAutofill="no"
        autoCapitalize="words" autoCorrect={false} spellCheck={false}
        returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => phoneInput.current?.focus()} />
      <FormField ref={phoneInput} label="Teléfono" icon="call-outline" accessibilityLabel="Teléfono"
        error={errors.phone} editable={!saving && !refreshing}
        value={draft.phone} onChangeText={(value) => onChange('phone', value)}
        autoComplete="off" textContentType="none" importantForAutofill="no"
        autoCapitalize="none" autoCorrect={false} spellCheck={false} keyboardType="phone-pad"
        returnKeyType="done" submitBehavior="blurAndSubmit" onSubmitEditing={() => Keyboard.dismiss()} />

      <Text style={styles.emailLabel}>Correo electrónico</Text>
      <View style={styles.emailCard}>
        <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name="mail-outline" size={19} color={colors.textMuted} />
        </View>
        <Text accessibilityLabel={`Correo electrónico: ${email}`} style={styles.email}>{email}</Text>
        <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Ionicons name="lock-closed-outline" size={15} color={colors.textMuted} />
        </View>
      </View>
      <Text style={styles.emailNote}>El correo identifica tu cuenta y no se edita aquí.</Text>
    </View>

    <Pressable accessibilityRole="button" accessibilityLabel="Guardar cambios" disabled={!canSave}
      onPress={() => { Keyboard.dismiss(); onSave(); }} accessibilityState={{ disabled: !canSave, busy: saving }}
      style={[styles.saveButton, !canSave && styles.disabled]}>
      {saving ? <ActivityIndicator color={colors.white} /> :
      <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="checkmark-outline" size={19} color={colors.white} />
      </View>}
      <Text style={styles.saveLabel}>{saving ? 'Guardando…' : 'Guardar cambios'}</Text>
    </Pressable>
    <Text style={styles.saveNote}>Los cambios se guardan en tu cuenta de INHALEX.</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Cancelar edición de perfil" onPress={cancelEdit}
      disabled={saving || refreshing} accessibilityState={{ disabled: saving || refreshing }}
      style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed, (saving || refreshing) && styles.disabled]}>
      <Text style={styles.cancelLabel}>Cancelar</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  formCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, padding: 20 },
  emailLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  emailCard: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 12, minHeight: 56, paddingHorizontal: 16, paddingVertical: 15 },
  email: { color: colors.textMuted, flex: 1, fontSize: 14, lineHeight: 22, minWidth: 0 },
  emailNote: { color: colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: 9 },
  saveButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 15, flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center', marginTop: 22, minHeight: 52, paddingHorizontal: 16, paddingVertical: 15 },
  disabled: { opacity: 0.55 },
  saveLabel: { color: colors.white, flexShrink: 1, fontSize: 13, fontWeight: '800', lineHeight: 22, textAlign: 'center' },
  saveNote: { color: colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: 10, textAlign: 'center' },
  cancelButton: { alignItems: 'center', borderColor: colors.border, borderRadius: 14, borderWidth: 1, justifyContent: 'center', marginTop: 17, minHeight: 44, paddingHorizontal: 16, paddingVertical: 12 },
  cancelLabel: { color: colors.primaryDark, fontSize: 13, fontWeight: '700', lineHeight: 21, textAlign: 'center' },
  pressed: { opacity: 0.75 },
});
