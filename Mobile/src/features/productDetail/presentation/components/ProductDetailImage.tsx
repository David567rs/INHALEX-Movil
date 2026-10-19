import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { getCatalogImage } from '@/features/catalog/presentation/assets/catalogImages';

export function ProductDetailImage({ image, name, height }: { image: string | null; name: string; height: number }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const source = image !== failedImage ? getCatalogImage(image) : null;

  return (
    <View style={[styles.frame, source ? { height } : { minHeight: height }]}>
      {source ? <Image
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Imagen de ${name}, producto INHALEX`}
        source={source}
        resizeMode="contain"
        fadeDuration={0}
        onError={() => setFailedImage(image)}
        style={styles.image}
      /> : <View accessible accessibilityRole="image" accessibilityLabel={`Imagen de ${name} no disponible`} style={styles.placeholder}>
        <Ionicons accessible={false} name="leaf-outline" size={42} color={colors.primary} />
        <Text style={styles.placeholderTitle}>Imagen no disponible</Text>
        <Text style={styles.placeholderCopy}>Puedes consultar la información de este aroma a continuación.</Text>
      </View>}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', backgroundColor: '#F5F5F7', borderColor: colors.border, borderRadius: 24, borderWidth: 1, justifyContent: 'center', overflow: 'hidden', width: '100%' },
  image: { height: '100%', width: '100%' },
  placeholder: { alignItems: 'center', gap: 10, paddingHorizontal: 26, paddingVertical: 22 },
  placeholderTitle: { color: colors.primaryDark, fontSize: 16, fontWeight: '600', lineHeight: 24, textAlign: 'center' },
  placeholderCopy: { color: colors.textMuted, fontSize: 12, lineHeight: 20, textAlign: 'center' },
});
