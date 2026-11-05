import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';

/** Keeps the form scroll bounded and gives numeric keyboards an explicit exit. */
export function FormKeyboardLayout({ children }: PropsWithChildren) {
  const [keyboardVisible, setKeyboardVisible] = useState(() => Platform.OS !== 'web' && Keyboard.isVisible());

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const shown = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hidden = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}
      style={styles.container}
    >
      {children}
      {keyboardVisible && (
        <View style={styles.toolbar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ocultar teclado"
            accessibilityHint="Conserva lo escrito y permite revisar los botones del formulario."
            onPress={Keyboard.dismiss}
            style={({ pressed }) => [styles.dismissButton, pressed && styles.pressed]}
          >
            <Text style={styles.dismissLabel}>Ocultar teclado</Text>
            <Ionicons accessible={false} name="chevron-down" size={18} color={colors.primaryDark} />
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: { alignItems: 'flex-end', backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, flexShrink: 0, paddingHorizontal: 12 },
  dismissButton: { alignItems: 'center', borderRadius: 10, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 44, paddingHorizontal: 12, paddingVertical: 10 },
  dismissLabel: { color: colors.primaryDark, flexShrink: 1, fontSize: 13, fontWeight: '600' },
  pressed: { backgroundColor: colors.surfaceSoft },
});
