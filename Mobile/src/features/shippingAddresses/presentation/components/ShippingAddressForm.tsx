import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { ActivityIndicator, Keyboard, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors } from '@/core/theme/colors';
import { FormField } from '@/features/auth/presentation/components/FormField';
import type { ShippingAddressDraft, ShippingAddressField, ShippingAddressFieldErrors } from '../../domain/models/ShippingAddress';

type Props = {
  draft: ShippingAddressDraft;
  mode: 'create' | 'edit';
  onChange(field: ShippingAddressField, value: string): void;
  onCancel(): void;
  onSave(): void;
  onToggleDefault(): void;
  locked: boolean;
  canSave: boolean;
  saving: boolean;
  errors: ShippingAddressFieldErrors;
  defaultLocked: boolean;
};

type AddressFormField = {
  field: ShippingAddressField;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  keyboardType?: TextInputProps['keyboardType'];
  multiline?: boolean;
};

const sections: readonly { title: string; description: string; fields: readonly AddressFormField[] }[] = [
  {
    title: '¿Quién recibe?',
    description: 'Dale un nombre a este lugar e indica quién recibirá tu pedido.',
    fields: [
      { field: 'label', label: 'Nombre de la dirección', icon: 'bookmark-outline' },
      { field: 'recipientName', label: 'Nombre de quien recibe', icon: 'person-outline' },
      { field: 'phone', label: 'Teléfono de contacto', icon: 'call-outline', keyboardType: 'phone-pad' },
    ],
  },
  {
    title: 'Ubicación',
    description: 'Escribe los datos del lugar donde quieres recibir tu entrega.',
    fields: [
      { field: 'street', label: 'Calle', icon: 'map-outline' },
      { field: 'exteriorNumber', label: 'Número exterior', icon: 'home-outline' },
      { field: 'interiorNumber', label: 'Número interior (opcional)', icon: 'home-outline' },
      { field: 'neighborhood', label: 'Colonia', icon: 'business-outline' },
      { field: 'municipality', label: 'Municipio o alcaldía', icon: 'location-outline' },
      { field: 'state', label: 'Estado', icon: 'map-outline' },
      { field: 'postalCode', label: 'Código postal', icon: 'keypad-outline', keyboardType: 'number-pad' },
    ],
  },
  {
    title: 'Referencias',
    description: 'Un espacio opcional para indicar cómo reconocer el lugar.',
    fields: [{ field: 'references', label: 'Referencias (opcional)', icon: 'chatbubble-ellipses-outline', multiline: true }],
  },
];
const fieldOrder = sections.flatMap((section) => section.fields.map(({ field }) => field));

export function ShippingAddressForm({ draft, mode, onChange, onCancel, onSave, onToggleDefault, locked, canSave, saving, errors, defaultLocked }: Props) {
  const inputs = useRef<Partial<Record<ShippingAddressField, TextInput | null>>>({});
  function cancelForm() {
    Keyboard.dismiss();
    onCancel();
  }

  return <View>
    {sections.map((section) => <View key={section.title} style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionDescription}>{section.description}</Text>
      <View style={styles.fieldsCard}>
        {section.fields.map((field) => {
          const nextField = fieldOrder[fieldOrder.indexOf(field.field) + 1];
          return <FormField key={field.field} ref={(input) => { inputs.current[field.field] = input; }}
            label={field.label} icon={field.icon} accessibilityLabel={field.label}
            error={errors[field.field]} editable={!locked}
            value={draft[field.field]} onChangeText={(value) => onChange(field.field, value)}
            autoComplete="off" textContentType="none" importantForAutofill="no"
            autoCorrect={false} spellCheck={false} autoCapitalize={field.keyboardType ? 'none' : 'sentences'}
            keyboardType={field.keyboardType} multiline={field.multiline}
            returnKeyType={field.multiline ? 'default' : 'next'} submitBehavior={field.multiline ? 'newline' : 'submit'}
            onSubmitEditing={field.multiline ? undefined : () => { if (nextField) inputs.current[nextField]?.focus(); }}
            style={field.multiline ? styles.referencesInput : undefined} />;
        })}
      </View>
    </View>)}

    <Pressable accessibilityRole="checkbox" accessibilityLabel="Usar como dirección principal"
      accessibilityState={{ disabled: locked || defaultLocked, checked: draft.isDefault }}
      disabled={locked || defaultLocked} onPress={onToggleDefault} style={[styles.defaultOption, locked && styles.disabled]}>
      <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.defaultIcon}>
        <Ionicons name={draft.isDefault ? 'checkbox' : 'square-outline'} size={23} color={colors.primary} />
      </View>
      <View style={styles.defaultCopy}>
        <Text style={styles.defaultTitle}>Dirección principal</Text>
        <Text style={styles.defaultHint}>{defaultLocked ? 'Para cambiarla, elige otra dirección como principal.' : 'Tu primera dirección será principal automáticamente.'}</Text>
      </View>
    </Pressable>

    <Pressable accessibilityRole="button" accessibilityLabel={mode === 'create' ? 'Guardar dirección' : 'Guardar cambios de dirección'}
      onPress={() => { Keyboard.dismiss(); onSave(); }} accessibilityState={{ disabled: !canSave, busy: saving }} disabled={!canSave} style={[styles.saveButton, !canSave && styles.disabled]}>
      {saving ? <ActivityIndicator color={colors.white} /> : <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name="checkmark-outline" size={19} color={colors.white} />
      </View>}
      <Text style={styles.saveLabel}>{saving ? 'Guardando…' : mode === 'create' ? 'Guardar dirección' : 'Guardar cambios'}</Text>
    </Pressable>
    <Text style={styles.saveHint}>La dirección se guardará en tu cuenta de INHALEX.</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Cancelar edición de dirección" onPress={cancelForm} disabled={locked} accessibilityState={{ disabled: locked }}
      style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed, locked && styles.disabled]}>
      <Text style={styles.cancelLabel}>Cancelar</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  section: { marginBottom: 22 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.4, lineHeight: 27 },
  sectionDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 20, marginBottom: 14, marginTop: 5 },
  fieldsCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, padding: 18, paddingBottom: 0 },
  referencesInput: { minHeight: 112, textAlignVertical: 'top' },
  defaultOption: { alignItems: 'flex-start', backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 11, minHeight: 52, padding: 16 },
  defaultIcon: { minHeight: 28, justifyContent: 'center' },
  defaultCopy: { flex: 1, minWidth: 0 },
  defaultTitle: { color: colors.primaryDark, fontSize: 13, fontWeight: '700', lineHeight: 22 },
  defaultHint: { color: colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: 4 },
  saveButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 15, flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center', marginTop: 23, minHeight: 52, paddingHorizontal: 16, paddingVertical: 15 },
  saveLabel: { color: colors.white, flexShrink: 1, fontSize: 13, fontWeight: '800', lineHeight: 22, textAlign: 'center' },
  saveHint: { color: colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: 10, textAlign: 'center' },
  cancelButton: { alignItems: 'center', borderColor: colors.border, borderRadius: 14, borderWidth: 1, justifyContent: 'center', marginTop: 17, minHeight: 44, paddingHorizontal: 16, paddingVertical: 12 },
  cancelLabel: { color: colors.primaryDark, fontSize: 13, fontWeight: '700', lineHeight: 21, textAlign: 'center' },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.55 },
});
