import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { getCatalogImage } from '../assets/catalogImages';
import type { CatalogProductViewModel } from '../viewModels/useCatalogViewModel';

interface CatalogProductCardProps {
  product: CatalogProductViewModel;
  horizontal: boolean;
  onPress: () => void;
}

export function CatalogProductCard({ product, horizontal, onPress }: CatalogProductCardProps) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const source = product.image !== failedImage ? getCatalogImage(product.image) : null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Abre la información del producto"
      accessibilityLabel={`${product.name}. ${product.aromaNote}. ${product.originalPriceLabel ? `Oferta: ${product.priceLabel}. Antes: ${product.originalPriceLabel}.` : `Precio: ${product.priceLabel}.`} ${product.inStock ? 'Disponible' : 'Agotado'}.`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, horizontal && styles.horizontal, pressed && styles.pressed]}
    >
      <View style={[styles.artwork, horizontal && styles.horizontalArtwork]}>
        {source ? <Image
          accessible={false}
          source={source}
          onError={() => setFailedImage(product.image)}
          resizeMode="contain"
          style={styles.photo}
        /> : <View accessible={false} style={styles.placeholder}>
          <Ionicons name="leaf-outline" size={30} color={colors.primary} />
          <Text style={styles.placeholderText}>Imagen no disponible</Text>
        </View>}
      </View>
      <View style={[styles.copy, horizontal && styles.horizontalCopy]}>
        <Text style={styles.productType}>ESENCIA INHALEX</Text>
        <Text numberOfLines={2} style={styles.name}>{product.name}</Text>
        <Text numberOfLines={2} style={styles.note}>{product.aromaNote}</Text>
        <View style={styles.priceRow}>
          {product.originalPriceLabel && <Text style={styles.originalPrice}>{product.originalPriceLabel}</Text>}
          <Text style={styles.price}>{product.priceLabel}</Text>
          <Text style={[styles.stock, !product.inStock && styles.outOfStock]}>{product.inStock ? 'Disponible' : 'Agotado'}</Text>
        </View>
        <View accessible={false} style={styles.detailLink}>
          <Text style={styles.detailLinkText}>Ver detalle</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.primaryDark} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, flex: 1, overflow: 'hidden' },
  horizontal: { flexDirection: 'row' },
  artwork: { alignItems: 'center', backgroundColor: '#F5F5F7', height: 186, justifyContent: 'center', overflow: 'hidden' },
  horizontalArtwork: { alignSelf: 'stretch', height: undefined, minHeight: 154, width: 104 },
  photo: { height: '100%', width: '100%' },
  placeholder: { alignItems: 'center', gap: 9, justifyContent: 'center', padding: 12 },
  placeholderText: { color: colors.textMuted, fontSize: 11, textAlign: 'center' },
  copy: { flex: 1, padding: 14, paddingTop: 15 },
  horizontalCopy: { justifyContent: 'center', paddingHorizontal: 17, paddingVertical: 19 },
  productType: { color: colors.primary, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  name: { color: colors.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.4, lineHeight: 23, marginTop: 6 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 3, minHeight: 36 },
  priceRow: { borderTopColor: '#EDF1EA', borderTopWidth: 1, marginTop: 10, paddingTop: 11 },
  price: { color: colors.primaryDark, fontSize: 16, fontWeight: '700', letterSpacing: -0.2, lineHeight: 23 },
  originalPrice: { color: colors.textMuted, fontSize: 11, lineHeight: 17, textDecorationLine: 'line-through' },
  stock: { color: colors.primary, fontSize: 10, lineHeight: 16, marginTop: 5 },
  outOfStock: { color: '#8A4E3B' },
  pressed: { opacity: 0.72 },
  detailLink: { alignItems: 'center', flexDirection: 'row', gap: 7, marginTop: 12, minHeight: 24 },
  detailLinkText: { color: colors.primaryDark, fontSize: 11, fontWeight: '600' },
});
