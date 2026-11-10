import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { SoftPressable } from '@/shared/components/Motion';
import { LoadingState, ScreenState } from '@/shared/components/ScreenFeedback';

export function MoreBackButton() {
  return <SoftPressable accessibilityRole="button" accessibilityLabel="Volver"
    onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/mas')}
    style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
    <Ionicons accessible={false} name="arrow-back" size={22} color={colors.primaryDark} />
  </SoftPressable>;
}

export function MoreRow({ title, description, icon, onPress, last = false }: {
  title: string;
  description?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress(): void;
  last?: boolean;
}) {
  return <SoftPressable accessibilityRole="button" accessibilityLabel={title}
    onPress={onPress} style={({ pressed }) => [styles.row, !last && styles.divider, pressed && styles.rowPressed]}>
    <View accessible={false} style={styles.icon}>
      <Ionicons name={icon} size={22} color={colors.primaryDark} />
    </View>
    <View style={styles.rowCopy}>
      <Text style={styles.rowTitle}>{title}</Text>
      {description ? <Text style={styles.rowDescription}>{description}</Text> : null}
    </View>
    <View accessible={false} style={styles.chevron}>
      <Ionicons name="chevron-forward" size={16} color={colors.primary} />
    </View>
  </SoftPressable>;
}

export function MoreLoadState({ isLoading, message, onRetry }: {
  isLoading: boolean;
  message: string | null;
  onRetry(): void;
}) {
  return isLoading
    ? <LoadingState label="Abriendo información…" />
    : <ScreenState title="Volvamos a intentarlo" message={message ?? 'Esta información no está disponible en este momento.'}
      icon="document-text-outline" actionLabel="Reintentar" onAction={onRetry} />;
}

const styles = StyleSheet.create({
  back: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 13, minHeight: 76, paddingHorizontal: 16, paddingVertical: 16 },
  divider: { borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth },
  icon: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderColor: '#E0ECDF', borderRadius: 15, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  chevron: { alignItems: 'center', borderColor: colors.border, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, height: 26, justifyContent: 'center', width: 26 },
  rowPressed: { backgroundColor: colors.surfaceSoft },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '700', lineHeight: 22 },
  rowDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 3 },
  pressed: { opacity: 0.7 },
});
