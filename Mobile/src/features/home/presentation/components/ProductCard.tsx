import { useState, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/core/theme/colors';
import { SoftPressable } from '@/shared/components/Motion';
import type { CatalogProduct } from '@/features/catalog/domain/models/Catalog';
import { getCatalogImage } from '@/features/catalog/presentation/assets/catalogImages';

export function formatPrice(value: number, currency: string) {
  try { return new Intl.NumberFormat('es-MX', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value); }
  catch { return `${value.toFixed(2)} ${currency}`; }
}

export function ProductImage({ imagePath, style, imageStyle, resizeMode = 'cover' }: { imagePath: string | null; style?: StyleProp<ViewStyle>; imageStyle?: StyleProp<ImageStyle>; resizeMode?: 'cover' | 'contain' }) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const source = imagePath !== failedUri ? getCatalogImage(imagePath) : null;
  return (
    <View style={[styles.imageStage, style]}>
      {source ? (
        <Image accessible={false} source={source} resizeMode={resizeMode} style={[styles.image, imageStyle]} onError={() => setFailedUri(imagePath)} />
      ) : (
        <View style={styles.imageFallback}>
          <Image source={require('../../../../../assets/inhalex-mark.png')} resizeMode="contain" style={styles.fallbackMark} />
          <Text style={styles.fallbackLabel}>INHALEX</Text>
        </View>
      )}
    </View>
  );
}

export function ProductCard({ product, categoryLabel, width, onPress, compact = false, action }: {
  product: CatalogProduct;
  categoryLabel: string;
  width: number;
  onPress: () => void;
  compact?: boolean;
  action?: ReactNode;
}) {
  const hasPromotion = product.originalPrice !== null && product.originalPrice > product.price;
  const imageWidth = width - 18;
  const detailLabel = `${product.name}, ${formatPrice(product.price, product.currency)}. Ver detalles`;
  return (
    <View style={[styles.card, compact && styles.compactCard, { width }]}>
      <SoftPressable accessibilityRole="button" accessibilityLabel={detailLabel} onPress={onPress}>
        <View style={styles.imageFrame}>
          <ProductImage
            imagePath={product.image}
            style={[styles.framedImage, { height: compact ? Math.min(imageWidth * 0.78, 190) : imageWidth }]}
            imageStyle={compact ? { position: 'absolute', bottom: 0, height: imageWidth } : undefined}
          />
          {hasPromotion ? <View style={styles.badge}><Text style={styles.badgeLabel}>Precio especial</Text></View> : null}
        </View>
        <View style={[styles.copy, compact && styles.compactCopy]}>
          <Text style={[styles.category, compact && styles.compactCategory]} numberOfLines={1}>{categoryLabel.replace(/^L[ií]nea\s+/i, '')}</Text>
          <Text style={[styles.name, compact && styles.compactName]} numberOfLines={2}>{product.name}</Text>
          <Text style={[styles.aromas, compact && styles.compactAromas]} numberOfLines={1}>{product.aromas.length ? product.aromas.join(' · ') : product.presentation ?? product.description}</Text>
        </View>
      </SoftPressable>
      <View style={[styles.bottom, compact && styles.compactBottom]}>
        <Pressable accessibilityRole="button" accessibilityLabel={detailLabel} onPress={onPress} style={({ pressed }) => [styles.priceCopy, pressed && styles.pressed]}>
          {hasPromotion && product.originalPrice !== null ? <Text style={styles.originalPrice}>{formatPrice(product.originalPrice, product.currency)}</Text> : null}
          <Text style={[styles.price, compact && styles.compactPrice]}>{formatPrice(product.price, product.currency)}</Text>
        </Pressable>
        {action ? <View style={styles.action}>{action}</View> : <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalles de ${product.name}`} onPress={onPress} style={styles.action}><Ionicons accessible={false} aria-hidden name="arrow-forward" size={18} color={colors.primaryDark} /></Pressable>}
      </View>
      {!product.inStock ? <Text style={styles.unavailable}>Sin disponibilidad</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  action: { alignItems: 'center', flexShrink: 0, justifyContent: 'center', minHeight: 44, minWidth: 44 },
  card: { backgroundColor: colors.surface, borderColor: '#E3EADF', borderRadius: 23, borderWidth: 1, overflow: 'hidden' },
  imageFrame: { padding: 8 },
  framedImage: { borderRadius: 14 },
  imageStage: { alignItems: 'center', backgroundColor: '#EDF3E9', borderRadius: 22, height: 168, justifyContent: 'center', overflow: 'hidden' },
  image: { height: '100%', width: '100%' },
  imageFallback: { alignItems: 'center', opacity: 0.6 },
  fallbackMark: { width: 55, height: 60 },
  fallbackLabel: { color: colors.primaryDark, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginTop: 7 },
  badge: { backgroundColor: '#FFFFFFEB', borderRadius: 10, left: 14, paddingHorizontal: 7, paddingVertical: 5, position: 'absolute', top: 14 },
  badgeLabel: { color: colors.primaryDark, fontSize: 10, fontWeight: '700' },
  copy: { paddingHorizontal: 14, paddingTop: 4 },
  category: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase' },
  name: { color: colors.text, fontSize: 16, fontWeight: '700', lineHeight: 21, marginTop: 6, minHeight: 42 },
  aromas: { color: colors.textMuted, fontSize: 11, marginTop: 4, minHeight: 16 },
  bottom: { alignItems: 'center', flexDirection: 'row', gap: 4, justifyContent: 'space-between', marginTop: 8, paddingBottom: 8, paddingHorizontal: 14 },
  priceCopy: { flex: 1, justifyContent: 'center', minHeight: 44, minWidth: 0 },
  pressed: { opacity: 0.7 },
  price: { color: colors.primaryDark, fontSize: 17, fontWeight: '800' },
  originalPrice: { color: colors.textMuted, fontSize: 11, textDecorationLine: 'line-through' },
  unavailable: { color: colors.textMuted, fontSize: 11, paddingBottom: 12, paddingHorizontal: 12 },
  compactCard: { borderRadius: 20 },
  compactCopy: { paddingHorizontal: 12 },
  compactCategory: { fontSize: 10, fontWeight: '600', letterSpacing: 0.2, textTransform: 'none' },
  compactName: { fontSize: 15, lineHeight: 19, marginTop: 5, minHeight: 38 },
  compactAromas: { marginTop: 3 },
  compactBottom: { marginTop: 5, paddingHorizontal: 12 },
  compactPrice: { fontSize: 16 },
});
