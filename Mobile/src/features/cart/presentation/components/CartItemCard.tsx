import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { getCatalogImage } from '@/features/catalog/presentation/assets/catalogImages';
import type { CartItemViewModel } from '../viewModels/useCartViewModel';

type Props = { item: CartItemViewModel; stacked: boolean; canMutate: boolean;
  onQuantity(quantity: number): void; onRemove(): void; onOpen(): void; };

export function CartItemCard({ item, stacked, canMutate, onQuantity, onRemove, onOpen }: Props) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const image = item.image !== failedImage ? getCatalogImage(item.image) : null;

  return <View style={[styles.card, stacked && styles.stacked]}>
    <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={[styles.artwork, stacked && styles.stackedArtwork]}>
      {image ? <Image accessible={false} source={image} resizeMode="contain" onError={() => setFailedImage(item.image)} style={styles.photo} />
        : <Ionicons accessible={false} name="leaf-outline" size={32} color={colors.primary} />}
      <View style={styles.bagBadge}><Ionicons name="bag-handle-outline" size={16} color={colors.primaryDark} /></View>
    </View>
    <View style={styles.copy}>
      <Text style={styles.eyebrow}>ESENCIA INHALEX</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalle de ${item.name}`} onPress={onOpen} style={styles.openProduct}><Text style={styles.name}>{item.name}</Text></Pressable>
      <Text style={styles.note}>{item.aromaNote}</Text>

      <View style={styles.unitPrice}>
        <Text style={styles.fieldLabel}>Precio unitario</Text>
        <Text style={styles.unitPriceValue}>{item.unitPriceLabel}</Text>
      </View>

      <Text style={styles.quantityLabel}>Cantidad</Text>
      <View style={styles.controlsRow}>
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
        <Pressable accessibilityRole="button" accessibilityLabel={`Quitar ${item.name}`}
          accessibilityState={{ disabled: !canMutate, busy: item.pending }} disabled={!canMutate} onPress={onRemove} style={[styles.remove, !canMutate && styles.disabled]}>
          <Ionicons accessible={false} name="trash-outline" size={15} color={colors.textMuted} />
          <Text style={styles.removeText}>{item.pending ? 'Guardando…' : 'Quitar'}</Text>
        </Pressable>
      </View>

      <View style={styles.lineTotal}>
        <Text style={styles.fieldLabel}>Importe</Text>
        <Text style={styles.lineTotalValue}>{item.lineTotalLabel}</Text>
      </View>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.5 },
  openProduct: { minHeight: 44, justifyContent: 'center' },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' },
  stacked: { flexDirection: 'column' },
  artwork: { alignItems: 'center', backgroundColor: '#F5F5F7', justifyContent: 'center', minHeight: 186, width: 112 },
  stackedArtwork: { height: 188, minHeight: 188, width: '100%' },
  photo: { height: '100%', minHeight: 186, width: '100%' },
  bagBadge: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, height: 34, justifyContent: 'center', left: 9, position: 'absolute', top: 9, width: 34 },
  copy: { flex: 1, minWidth: 0, padding: 16 },
  eyebrow: { color: colors.primary, fontSize: 8, fontWeight: '700', letterSpacing: 1.2 },
  name: { color: colors.text, fontSize: 21, fontWeight: '800', letterSpacing: -0.5, lineHeight: 28, marginTop: 5 },
  note: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: 5 },
  unitPrice: { marginTop: 14 },
  fieldLabel: { color: colors.textMuted, fontSize: 10, lineHeight: 17 },
  unitPriceValue: { color: colors.text, fontSize: 13, fontWeight: '600', lineHeight: 21, marginTop: 2 },
  quantityLabel: { color: colors.textMuted, fontSize: 10, lineHeight: 17, marginTop: 13 },
  controlsRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between', marginTop: 4 },
  quantityControls: { alignItems: 'center', borderColor: colors.border, borderRadius: 11, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap', maxWidth: '100%' },
  quantityButton: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  quantityValue: { color: colors.text, flexShrink: 1, fontSize: 13, fontWeight: '700', minWidth: 32, paddingHorizontal: 4, textAlign: 'center' },
  remove: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center', minHeight: 44, minWidth: 62, paddingVertical: 8 },
  removeText: { color: colors.textMuted, flexShrink: 1, fontSize: 11, fontWeight: '600' },
  lineTotal: { borderTopColor: colors.border, borderTopWidth: 1, marginTop: 12, paddingTop: 11 },
  lineTotalValue: { color: colors.primaryDark, fontSize: 17, fontWeight: '800', lineHeight: 26, marginTop: 3 },
});
