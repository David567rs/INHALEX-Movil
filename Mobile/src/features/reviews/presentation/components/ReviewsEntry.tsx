import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';

export function ReviewsEntry() {
  return <Pressable accessibilityRole="button" accessibilityLabel="Abrir Reseñas"
    onPress={() => router.push('/resenas')} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <Ionicons accessible={false} aria-hidden name="star-outline" size={22} color={colors.primaryDark} />
    <View style={styles.copy}>
      <Text style={styles.title}>Reseñas</Text>
      <Text style={styles.description}>Comparte tu opinión sobre los productos que recibiste.</Text>
    </View>
    <Ionicons accessible={false} aria-hidden name="chevron-forward" size={18} color={colors.primary} />
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18,
    borderWidth: 1, flexDirection: 'row', gap: 12, marginHorizontal: 22, minHeight: 70, padding: 15 },
  copy: { flex: 1, minWidth: 0 },
  title: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
  description: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 3 },
  pressed: { opacity: 0.75 },
});
