import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { getCatalogImage } from '@/features/catalog/presentation/assets/catalogImages';
import type { FavoriteProductViewModel } from '../viewModels/useFavoritesViewModel';

type Props = {
  product: FavoriteProductViewModel;
  stacked: boolean;
  canRemove: boolean;
  onOpen(): void;
  onRemove(): void;
};

export function FavoriteCard({ product, stacked, canRemove, onOpen, onRemove }: Props) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const image = product.image !== failedImage ? getCatalogImage(product.image) : null;
  const disabled = !canRemove || product.pending;
  return (
    <View style={[styles.card, stacked && styles.stacked]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalle de ${product.name}`}
        onPress={onOpen} style={({ pressed }) => [styles.artwork, stacked && styles.stackedArtwork, pressed && styles.pressed]}>
        {image ? <Image accessible={false} source={image} resizeMode="cover" onError={() => setFailedImage(product.image)} style={styles.photo} />
          : <Ionicons accessible={false} name="leaf-outline" size={32} color={colors.primary} />}
      </Pressable>
      <View style={[styles.copy, stacked && styles.stackedCopy]}>
        <Text style={styles.eyebrow}>ESENCIA INHALEX</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalle de ${product.name}`}
          onPress={onOpen} style={({ pressed }) => [styles.nameButton, pressed && styles.pressed]}>
          <Text style={styles.name}>{product.name}</Text>
          <Ionicons accessible={false} name="chevron-forward" size={15} color={colors.primary} />
        </Pressable>
        <Text numberOfLines={stacked ? undefined : 2} style={styles.note}>{product.aromaNote}</Text>
        <Text style={styles.price}>{product.priceLabel}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.stock}>
            <View accessible={false} style={[styles.stockDot, !product.inStock && styles.unavailableDot]} />
            <Text style={styles.stockText}>{product.inStock ? 'Disponible' : 'Agotado'}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Quitar ${product.name} de favoritos`}
            accessibilityState={{ disabled, busy: product.pending }} disabled={disabled} onPress={onRemove}
            style={({ pressed }) => [styles.remove, disabled && styles.disabled, pressed && styles.pressed]}>
            {product.pending ? <ActivityIndicator accessibilityLabel={`Quitando ${product.name}`} size="small" color={colors.primary} />
              : <Ionicons accessible={false} name="heart" size={22} color={colors.primaryDark} />}
            <Text style={styles.removeText}>{product.pending ? 'Quitando…' : 'Quitar'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'flex-start', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, flexDirection: 'row', gap: 14, padding: 12 },
  stacked: { alignItems: 'stretch', flexDirection: 'column' },
  // The photo must not determine its auto-height row: a percentage height here
  // can expand to the intrinsic asset height on native and stretch the whole card.
  artwork: { alignItems: 'center', backgroundColor: '#F1F4EE', borderRadius: 15, flexShrink: 0, height: 132, justifyContent: 'center', overflow: 'hidden', width: 100 },
  stackedArtwork: { height: 172, width: '100%' },
  photo: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, height: '100%', width: '100%' },
  copy: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, paddingTop: 4 },
  stackedCopy: { flexBasis: 'auto', flexGrow: 0 },
  eyebrow: { color: colors.primary, fontSize: 8, fontWeight: '700', letterSpacing: 1.1 },
  nameButton: { alignItems: 'center', flexDirection: 'row', gap: 4, minHeight: 44, paddingVertical: 5 },
  name: { color: colors.text, flexShrink: 1, fontSize: 18, fontWeight: '800', letterSpacing: -0.4, lineHeight: 24 },
  note: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 1 },
  price: { color: colors.primaryDark, fontSize: 17, fontWeight: '800', marginTop: 10 },
  cardFooter: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'space-between', marginTop: 2 },
  stock: { alignItems: 'center', flexDirection: 'row', gap: 5, minHeight: 30 },
  stockDot: { backgroundColor: colors.primary, borderRadius: 3, height: 5, width: 5 },
  unavailableDot: { backgroundColor: colors.warning },
  stockText: { color: colors.textMuted, fontSize: 10 },
  remove: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', minHeight: 44, minWidth: 64, paddingVertical: 8 },
  removeText: { color: colors.primaryDark, flexShrink: 1, fontSize: 11, fontWeight: '600' },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.75 },
});
