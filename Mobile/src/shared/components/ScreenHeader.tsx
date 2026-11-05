import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';

/** A flowing heading: long titles and larger text grow with the content. */
export function ScreenHeader({ title, eyebrow, description, leading, trailing }: {
  title: string;
  eyebrow?: string;
  description?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  return <View style={styles.header}>
    <View style={styles.row}>
      {leading ? <View style={styles.accessory}>{leading}</View> : null}
      <View style={styles.copy}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      </View>
      {trailing ? <View style={styles.accessory}>{trailing}</View> : null}
    </View>
    {description ? <Text style={styles.description}>{description}</Text> : null}
  </View>;
}

export function BackButton({ label = 'Volver', onPress }: { label?: string; onPress(): void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress}
    style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
    <Ionicons accessible={false} name="arrow-back" size={21} color={colors.primaryDark} />
  </Pressable>;
}

const styles = StyleSheet.create({
  header: { marginBottom: 20 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  accessory: { flexShrink: 0 },
  copy: { flex: 1, minWidth: 0 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.3, lineHeight: 16, marginBottom: 4, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.7, lineHeight: 36 },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 21, marginTop: 8 },
  back: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 15, borderWidth: 1, height: 46, justifyContent: 'center', width: 46 },
  pressed: { backgroundColor: colors.surfaceSoft },
});
