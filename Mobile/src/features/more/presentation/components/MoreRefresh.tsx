import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';

export function MoreRefresh({ loading, message, onRefresh }: { loading: boolean; message: string | null; onRefresh: () => void }) {
  return <View style={styles.container}>
    {message ? <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}
    <Pressable accessibilityRole="button" accessibilityState={{ busy: loading, disabled: loading }} disabled={loading}
      onPress={onRefresh} style={({ pressed }) => [styles.action, pressed && styles.pressed]}>
      <Ionicons accessible={false} name="refresh-outline" color={colors.primaryDark} size={18} />
      <Text style={styles.label}>{loading ? 'Actualizando…' : message ? 'Reintentar actualización' : 'Actualizar información'}</Text>
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({
  container: { gap: 8, marginVertical: 12 },
  message: { color: colors.textMuted, fontSize: 13, lineHeight: 21, backgroundColor: colors.surfaceSoft, borderRadius: 14, padding: 14 },
  action: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, minHeight: 44, borderRadius: 12 },
  label: { color: colors.primaryDark, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  pressed: { backgroundColor: colors.surfaceSoft },
});
