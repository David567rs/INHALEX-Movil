import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { CATALOG_SEARCH_MAX_LENGTH } from '../../domain/useCases/listCatalog';

/** Search stays in the catalog; the ViewModel owns both its draft and applied term. */
export function CatalogSearchField({ value, onChange, onSubmit, onClear }: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return <View style={[styles.field, focused && styles.focused]}>
    <TextInput
      accessibilityLabel="Buscar en el catálogo"
      accessibilityHint="Escribe un nombre o aroma y pulsa Buscar"
      autoCapitalize="none"
      autoCorrect={false}
      maxLength={CATALOG_SEARCH_MAX_LENGTH}
      onBlur={() => setFocused(false)}
      onChangeText={onChange}
      onFocus={() => setFocused(true)}
      onSubmitEditing={onSubmit}
      placeholder="Buscar productos o aromas"
      placeholderTextColor={colors.textMuted}
      returnKeyType="search"
      style={[styles.input, Platform.OS === 'web' && styles.webInput]}
      value={value}
    />
    {value.length > 0 && <Pressable accessibilityLabel="Limpiar búsqueda" accessibilityRole="button"
      onPress={onClear} style={({ pressed }) => [styles.clear, pressed && styles.pressed]}>
      <Ionicons accessible={false} name="close" size={20} color={colors.textMuted} />
    </Pressable>}
    <Pressable accessibilityLabel="Buscar en esta colección" accessibilityRole="button"
      onPress={onSubmit} style={({ pressed }) => [styles.submit, pressed && styles.pressed]}>
      <Ionicons accessible={false} name="search-outline" size={21} color={colors.white} />
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  field: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 17, borderWidth: 1, flexDirection: 'row', gap: 2, minHeight: 56, paddingLeft: 16, paddingRight: 5 },
  focused: { borderColor: colors.primary },
  input: { color: colors.text, flex: 1, fontSize: 14, minHeight: 52, minWidth: 0, paddingVertical: 12 },
  webInput: { outlineStyle: 'solid', outlineWidth: 0 },
  clear: { alignItems: 'center', justifyContent: 'center', minHeight: 44, width: 44 },
  submit: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 12, justifyContent: 'center', minHeight: 44, width: 44 },
  pressed: { opacity: 0.65 },
});
