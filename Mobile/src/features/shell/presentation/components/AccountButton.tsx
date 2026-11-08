import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { colors } from '@/core/theme/colors';
import { SoftPressable } from '@/shared/components/Motion';

/** The same public entry point for guests and signed-in users. */
export function AccountButton() {
  return (
    <SoftPressable
      accessibilityLabel="Abrir mi cuenta"
      accessibilityRole="button"
      onPress={() => router.navigate('/cuenta')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Ionicons accessible={false} name="person-outline" size={23} color={colors.primaryDark} />
    </SoftPressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderRadius: 17, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 },
  pressed: { opacity: 0.72 },
});
