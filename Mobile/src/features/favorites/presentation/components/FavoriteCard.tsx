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
        {image ? <Image accessible={false} source={image} resizeMode="contain" onError={() => setFailedImage(product.image)} style={styles.photo} />
          : <Ionicons accessible={false} name="leaf-outline" size={32} color={colors.primary} />}
        <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.heartBadge}>
          <Ionicons name="heart" size={16} color={colors.primaryDark} />
        </View>
      </Pressable>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>ESENCIA INHALEX</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalle de ${product.name}`}
          onPress={onOpen} style={({ pressed }) => [styles.nameButton, pressed && styles.pressed]}>
          <Text style={styles.name}>{product.name}</Text>
          <Ionicons accessible={false} name="chevron-forward" size={15} color={colors.primary} />
        </Pressable>
        <Text style={styles.note}>{product.aromaNote}</Text>
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
              : <Ionicons accessible={false} name="trash-outline" size={15} color={colors.primaryDark} />}
            <Text style={styles.removeText}>{product.pending ? 'Quitando…' : 'Quitar'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' },
  stacked: { flexDirection: 'column' },
  artwork: { alignItems: 'center', backgroundColor: '#F5F5F7', justifyContent: 'center', minHeight: 186, width: 112 },
  stackedArtwork: { height: 188, minHeight: 188, width: '100%' },
  photo: { height: '100%', minHeight: 186, width: '100%' },
  heartBadge: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, height: 34, justifyContent: 'center', left: 9, position: 'absolute', top: 9, width: 34 },
  copy: { flex: 1, minWidth: 0, padding: 16, paddingBottom: 8 },
  eyebrow: { color: colors.primary, fontSize: 8, fontWeight: '700', letterSpacing: 1.2 },
  nameButton: { alignItems: 'center', flexDirection: 'row', gap: 5, minHeight: 44, paddingVertical: 5 },
  name: { color: colors.text, flexShrink: 1, fontSize: 21, fontWeight: '800', letterSpacing: -0.5 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 2 },
  price: { color: colors.primaryDark, fontSize: 16, fontWeight: '800', marginTop: 12 },
  cardFooter: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'space-between', marginTop: 4 },
  stock: { alignItems: 'center', flexDirection: 'row', gap: 5, minHeight: 30 },
  stockDot: { backgroundColor: colors.primary, borderRadius: 3, height: 5, width: 5 },
  unavailableDot: { backgroundColor: colors.warning },
  stockText: { color: colors.textMuted, fontSize: 10 },
  remove: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', minHeight: 44, minWidth: 62, paddingVertical: 8 },
  removeText: { color: colors.primaryDark, flexShrink: 1, fontSize: 11, fontWeight: '600' },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.75 },
});
