import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';

export function ProfileEntry() {
  return <View style={styles.container}>
    <Pressable accessibilityRole="button" accessibilityLabel="Ver perfil del usuario"
      onPress={() => router.push('/perfil-usuario')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.icon}>
        <Ionicons name="person-outline" size={22} color={colors.primaryDark} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Perfil del usuario</Text>
        <Text style={styles.hint}>Consulta y actualiza tus datos</Text>
      </View>
      <Ionicons accessible={false} name="chevron-forward" size={19} color={colors.primary} />
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  container: { alignSelf: 'center', backgroundColor: colors.background, maxWidth: 620, paddingBottom: 12, paddingHorizontal: 22, paddingTop: 10, width: '100%' },
  button: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, minHeight: 76, padding: 14 },
  icon: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 12, height: 42, justifyContent: 'center', width: 42 },
  copy: { flex: 1, minWidth: 0 }, title: { color: colors.primaryDark, fontSize: 13, fontWeight: '700', lineHeight: 21 },
  hint: { color: colors.textMuted, fontSize: 10, lineHeight: 17, marginTop: 2 }, pressed: { opacity: 0.75 },
});
