import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, View } from 'react-native';
import { colors } from '@/core/theme/colors';

/** Original brand artwork, kept separate from readable and interactive content. */
export function MoreBrandHeader({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  return <View style={styles.header}>
    <Image accessibilityLabel="INHALEX" resizeMode="contain"
      source={require('../../../../../assets/home/brand.png')} style={styles.wordmark} />
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.emblem}>
      <View style={styles.orbit} />
      <View style={styles.symbol}>
        <Ionicons name={icon} size={23} color={colors.primaryDark} />
      </View>
      <View style={styles.dot} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 23, borderWidth: 1, flexDirection: 'row', gap: 16, justifyContent: 'space-between', marginBottom: 22, overflow: 'hidden', paddingHorizontal: 19, paddingVertical: 14 },
  wordmark: { flexShrink: 1, height: 48, maxWidth: '70%', width: 160 },
  emblem: { alignItems: 'center', height: 58, justifyContent: 'center', width: 58 },
  orbit: { borderColor: '#D2E8DA', borderRadius: 29, borderWidth: 1, height: 58, position: 'absolute', width: 58 },
  symbol: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 21, height: 42, justifyContent: 'center', width: 42 },
  dot: { backgroundColor: colors.mint, borderColor: colors.surface, borderRadius: 5, borderWidth: 2, height: 10, position: 'absolute', right: 2, top: 4, width: 10 },
});
