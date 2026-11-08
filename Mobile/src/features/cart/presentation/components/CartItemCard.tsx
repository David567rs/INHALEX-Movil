import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { getCatalogImage } from '@/features/catalog/presentation/assets/catalogImages';
import type { CartItemViewModel } from '../viewModels/useCartViewModel';

type Props = { item: CartItemViewModel; stacked: boolean; canMutate: boolean;
  onQuantity(quantity: number): void; onRemove(): void; onOpen(): void; };

export function CartItemCard({ item, stacked, canMutate, onQuantity, onRemove, onOpen }: Props) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const image = item.image !== failedImage ? getCatalogImage(item.image) : null;

  return <View style={styles.card}>
    <View style={[styles.productRow, stacked && styles.stacked]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalle de ${item.name}`} onPress={onOpen}
        style={({ pressed }) => [styles.artwork, stacked && styles.stackedArtwork, pressed && styles.pressed]}>
        {image ? <Image accessible={false} source={image} resizeMode="cover" onError={() => setFailedImage(item.image)} style={styles.photo} />
          : <Ionicons accessible={false} name="leaf-outline" size={32} color={colors.primary} />}
      </Pressable>
      <View style={[styles.copy, stacked && styles.stackedCopy]}>
        <Text style={styles.eyebrow}>ESENCIA INHALEX</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalle de ${item.name}`} onPress={onOpen} style={styles.openProduct}>
          <Text style={styles.name}>{item.name}</Text>
        </Pressable>
        <Text numberOfLines={stacked ? undefined : 2} style={styles.note}>{item.aromaNote}</Text>
        <View style={styles.unitPrice}>
          <Text style={styles.fieldLabel}>Precio unitario</Text>
          <Text style={styles.unitPriceValue}>{item.unitPriceLabel}</Text>
        </View>
      </View>
    </View>

    <View style={[styles.bottom, stacked && styles.stackedBottom]}>
      <View>
        <Text style={styles.quantityLabel}>Cantidad</Text>
        <View style={styles.quantityControls}>
          <Pressable accessibilityRole="button" accessibilityLabel={`Disminuir cantidad de ${item.name}`}
            accessibilityState={{ disabled: !canMutate || item.quantity <= 1 }} disabled={!canMutate || item.quantity <= 1}
            onPress={() => onQuantity(item.quantity - 1)} style={[styles.quantityButton, (!canMutate || item.quantity <= 1) && styles.disabled]}>
            <Ionicons accessible={false} name="remove" size={17} color={colors.textMuted} />
          </Pressable>
          <Text accessibilityLabel={`Cantidad: ${item.quantity}`} style={styles.quantityValue}>{item.quantity}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`Aumentar cantidad de ${item.name}`}
            accessibilityState={{ disabled: !canMutate || item.quantity >= 25 }} disabled={!canMutate || item.quantity >= 25}
            onPress={() => onQuantity(item.quantity + 1)} style={[styles.quantityButton, (!canMutate || item.quantity >= 25) && styles.disabled]}>
            <Ionicons accessible={false} name="add" size={17} color={colors.textMuted} />
          </Pressable>
        </View>
      </View>
      <View style={[styles.lineTotal, stacked && styles.stackedTotal]}>
        <Text style={styles.fieldLabel}>Importe</Text>
        <Text style={styles.lineTotalValue}>{item.lineTotalLabel}</Text>
      </View>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Quitar ${item.name}`}
      accessibilityState={{ disabled: !canMutate, busy: item.pending }} disabled={!canMutate} onPress={onRemove}
      style={({ pressed }) => [styles.remove, !canMutate && styles.disabled, pressed && styles.pressed]}>
      {item.pending ? <ActivityIndicator color={colors.primary} size="small" />
        : <Ionicons accessible={false} name="trash-outline" size={16} color={colors.textMuted} />}
      <Text style={styles.removeText}>{item.pending ? 'Guardando…' : 'Quitar'}</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.5 },
  openProduct: { minHeight: 44, justifyContent: 'center' },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, padding: 14 },
  productRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 14 },
  stacked: { alignItems: 'stretch', flexDirection: 'column' },
  artwork: { alignItems: 'center', backgroundColor: '#F1F4EE', borderRadius: 15, flexShrink: 0, height: 120, justifyContent: 'center', overflow: 'hidden', width: 96 },
  stackedArtwork: { height: 172, width: '100%' },
  // Fixed artwork bounds keep native image dimensions out of row measurement.
  photo: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, height: '100%', width: '100%' },
  copy: { flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0, paddingTop: 3 },
  stackedCopy: { flexBasis: 'auto', flexGrow: 0 },
  eyebrow: { color: colors.primary, fontSize: 8, fontWeight: '700', letterSpacing: 1.2 },
  name: { color: colors.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.4, lineHeight: 24, paddingVertical: 5 },
  note: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 1 },
  unitPrice: { marginTop: 8 },
  fieldLabel: { color: colors.textMuted, fontSize: 10, lineHeight: 17 },
  unitPriceValue: { color: colors.text, fontSize: 13, fontWeight: '600', lineHeight: 21, marginTop: 2 },
  bottom: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: 12, justifyContent: 'space-between', marginTop: 16, paddingTop: 12 },
  stackedBottom: { alignItems: 'flex-start', flexDirection: 'column' },
  quantityLabel: { color: colors.textMuted, fontSize: 10, lineHeight: 17, marginBottom: 4 },
  quantityControls: { alignItems: 'center', backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexDirection: 'row', maxWidth: '100%' },
  quantityButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  quantityValue: { color: colors.text, flexShrink: 1, fontSize: 14, fontWeight: '700', minWidth: 30, paddingHorizontal: 4, textAlign: 'center' },
  remove: { alignItems: 'center', alignSelf: 'flex-end', flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: -5, marginTop: 3, minHeight: 44, minWidth: 64, paddingVertical: 8 },
  removeText: { color: colors.textMuted, flexShrink: 1, fontSize: 11, fontWeight: '600' },
  lineTotal: { alignItems: 'flex-end', flexShrink: 1 },
  stackedTotal: { alignItems: 'flex-start' },
  lineTotalValue: { color: colors.primaryDark, fontSize: 18, fontWeight: '800', lineHeight: 26, marginTop: 3 },
  pressed: { opacity: 0.75 },
});
