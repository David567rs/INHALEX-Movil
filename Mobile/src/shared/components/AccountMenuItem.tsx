import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';

/** A flexible menu row; the containing screen owns scrolling and grouping. */
export function AccountMenuItem({ icon, title, hint, accessibilityLabel, onPress }: {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  hint: string;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel}
    accessibilityHint={hint} onPress={onPress}
    style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
    <View accessible={false} aria-hidden importantForAccessibility="no-hide-descendants" style={styles.icon}>
      <Ionicons name={icon} size={22} color={colors.primaryDark} />
    </View>
    <View style={styles.copy}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.hint}>{hint}</Text>
    </View>
    <Ionicons accessible={false} aria-hidden name="chevron-forward" size={18} color={colors.primary} />
  </Pressable>;
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, minHeight: 76, paddingHorizontal: 16, paddingVertical: 15 },
  icon: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  copy: { flex: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  pressed: { backgroundColor: colors.surfaceSoft },
});
