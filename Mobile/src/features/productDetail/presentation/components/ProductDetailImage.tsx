import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { getCatalogImage } from '@/features/catalog/presentation/assets/catalogImages';
import { getAromaProductImage } from '../assets/aromaImages';

export function ProductDetailImage({ image, name, height, presentation }: {
  image: string | null; name: string; height: number; presentation?: string | null;
}) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const bottle = getAromaProductImage({ name, image });
  const source = bottle ?? (image !== failedImage ? getCatalogImage(image) : null);
  const volume = presentation?.match(/\b\d+(?:[.,]\d+)?\s*ml\b/i)?.[0];

  return <View style={[styles.frame, { height }]}>
    {source ? <Image accessible accessibilityRole="image"
      accessibilityLabel={`Imagen de ${name}, producto INHALEX`}
      source={source} resizeMode="contain" fadeDuration={0}
      onError={() => setFailedImage(image)}
      style={[styles.image, bottle ? { width: Math.min(height * 2 / 3, 360) } : { width: '100%' }]} />
      : <View accessible accessibilityRole="image" accessibilityLabel={`Imagen de ${name} no disponible`} style={styles.placeholder}>
        <Ionicons accessible={false} name="leaf-outline" size={38} color={colors.primary} />
        <Text style={styles.placeholderTitle}>{name}</Text>
        <Text style={styles.placeholderCopy}>Imagen del producto no disponible</Text>
      </View>}
    <Text accessible={false} pointerEvents="none" style={styles.signature}>INHALEX</Text>
    {source && volume ? <View pointerEvents="none" style={styles.volume}><Text style={styles.volumeLabel}>{volume}</Text></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', backgroundColor: '#F4F3F7', borderRadius: 24, justifyContent: 'center', overflow: 'hidden', width: '100%' },
  image: { height: '100%', maxWidth: '100%' },
  signature: { color: '#89968A', fontSize: 9, fontWeight: '700', left: 17, letterSpacing: 2, position: 'absolute', top: 18 },
  volume: { backgroundColor: '#F7FAF5F0', borderColor: '#E5EBDF', borderRadius: 12, borderWidth: 1, bottom: 14, paddingHorizontal: 10, paddingVertical: 5, position: 'absolute', right: 14 },
  volumeLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  placeholder: { alignItems: 'center', gap: 10, padding: 24 },
  placeholderTitle: { color: colors.primaryDark, fontSize: 17, fontWeight: '600', lineHeight: 24, textAlign: 'center' },
  placeholderCopy: { color: colors.textMuted, fontSize: 12, lineHeight: 20, textAlign: 'center' },
});
