import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { catalogImages } from '../assets/catalogImages';
import type { CatalogProductViewModel } from '../viewModels/useCatalogViewModel';

interface CatalogProductCardProps {
  product: CatalogProductViewModel;
  horizontal: boolean;
}

/** Informative preview: product detail and purchase actions belong to later stages. */
export function CatalogProductCard({ product, horizontal }: CatalogProductCardProps) {
  return (
    <View
      accessible
      accessibilityLabel={`${product.name}. ${product.aromaNote}. Precio de muestra: ${product.priceLabel}.`}
      style={[styles.card, horizontal && styles.horizontal]}
    >
      <View style={[styles.artwork, horizontal && styles.horizontalArtwork]}>
        <Image
          accessible={false}
          source={catalogImages[product.imageKey]}
          resizeMode="contain"
          style={styles.photo}
        />
      </View>
      <View style={[styles.copy, horizontal && styles.horizontalCopy]}>
        <Text style={styles.productType}>ESENCIA INHALEX</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.note}>{product.aromaNote}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{product.priceLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, flex: 1, overflow: 'hidden' },
  horizontal: { flexDirection: 'row' },
  artwork: { alignItems: 'center', backgroundColor: '#F5F5F7', height: 186, justifyContent: 'center', overflow: 'hidden' },
  horizontalArtwork: { alignSelf: 'stretch', height: undefined, minHeight: 154, width: 104 },
  photo: { height: '100%', width: '100%' },
  copy: { flex: 1, padding: 14, paddingTop: 15 },
  horizontalCopy: { justifyContent: 'center', paddingHorizontal: 17, paddingVertical: 19 },
  productType: { color: colors.primary, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  name: { color: colors.text, fontSize: 17, fontWeight: '700', letterSpacing: -0.4, lineHeight: 23, marginTop: 6 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 3, minHeight: 36 },
  priceRow: { borderTopColor: '#EDF1EA', borderTopWidth: 1, marginTop: 10, paddingTop: 11 },
  price: { color: colors.primaryDark, fontSize: 16, fontWeight: '700', letterSpacing: -0.2, lineHeight: 23 },
});
