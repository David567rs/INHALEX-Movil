import { Ionicons } from '@expo/vector-icons';
import { router, useIsFocused } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors } from '@/core/theme/colors';
import { FavoriteProductButton, FavoriteProductFeedback } from '@/features/favorites/presentation/components/FavoriteProductButton';
import { AddToCartAction } from '@/features/cart/presentation/components/AddToCartButton';
import { useCartViewModel } from '@/features/cart/presentation/viewModels/useCartViewModel';
import { BottomSheet, useBottomSheetDismiss } from '@/shared/components/BottomSheet';
import { FeedbackBanner, LoadingState, ScreenState } from '@/shared/components/ScreenFeedback';
import type { GetProductDetail } from '../../domain/useCases/getProductDetail';
import { ProductDetailImage } from '../components/ProductDetailImage';
import { useProductDetailViewModel } from '../viewModels/useProductDetailViewModel';

/** Original product sheet, backed by the current detail use case and coordinators. */
export function ProductDetailScreen({ productId, getProduct }: { productId: string; getProduct: GetProductDetail }) {
  const vm = useProductDetailViewModel(productId, getProduct);
  const cartViewModel = useCartViewModel();
  const { product } = vm;
  const focused = useIsFocused();
  const { height } = useWindowDimensions();
  const [contentHeight, setContentHeight] = useState<number>();
  // The native sheet reserves room for its footer. Its photo must fit the remaining
  // viewport rather than deriving an unbounded height from a ScrollView child.
  const preferredImageHeight = Math.min(340, height * 0.42);
  const imageHeight = Math.max(1, Math.min(preferredImageHeight, contentHeight === undefined ? preferredImageHeight : contentHeight * 0.72));
  const returnToCatalog = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/catalogo');
  }, []);

  return <BottomSheet visible={focused} title="Tu próximo aroma" onClose={returnToCatalog}
    onContentHeightChange={setContentHeight}
    adaptiveFooter
    footer={product ? <AddToCartAction product={product} vm={cartViewModel} /> : undefined}>
    {vm.status === 'loading' ? <LoadingState label="Cargando producto…"
      message="Estamos consultando la información del producto." /> : product ? <>
      {vm.error ? <FeedbackBanner message={`${vm.error} Se conserva la última información cargada.`} /> : null}
      <ProductDetailImage key={product.id} image={product.image} name={product.name}
        height={imageHeight} presentation={product.presentation} />
      <Text style={styles.category}>ESENCIA INHALEX</Text>
      <View style={styles.nameRow}>
        <Text accessibilityRole="header" style={styles.name}>{product.name}</Text>
        <FavoriteProductButton product={product} compact showFeedback={false} />
      </View>
      <View style={styles.priceRow}>
        <View style={styles.priceCopy}>
          {product.originalPriceLabel !== null ? <Text style={styles.originalPrice}>Antes: {product.originalPriceLabel}</Text> : null}
          <Text style={styles.price}>{product.priceLabel}</Text>
        </View>
        <View style={styles.stock}>
          <View accessible={false} style={[styles.stockDot, !product.inStock && styles.unavailableDot]} />
          <Text style={styles.stockLabel}>{product.availabilityLabel}</Text>
        </View>
      </View>
      <FavoriteProductFeedback />

      <View style={styles.descriptionSection}>
        <Text accessibilityRole="header" style={styles.infoTitle}>Conoce este aroma</Text>
        <Text style={styles.body}>{product.longDescription || product.description}</Text>
      </View>
      {product.aromas.length > 0 ? <View style={styles.info}>
        <Ionicons accessible={false} name="leaf-outline" size={21} color={colors.primary} />
        <View style={styles.infoCopy}>
          <Text accessibilityRole="header" style={styles.infoTitle}>Perfil aromático</Text>
          <View style={styles.notes}>{product.aromas.map((aroma, index) => <View key={`${index}:${aroma}`} style={styles.note}>
            <Text style={styles.noteLabel}>{aroma}</Text>
          </View>)}</View>
        </View>
      </View> : null}
      {product.presentation ? <View style={styles.info}>
        <Ionicons accessible={false} name="flask-outline" size={21} color={colors.primary} />
        <View style={styles.infoCopy}><Text accessibilityRole="header" style={styles.infoTitle}>Presentación</Text><Text style={styles.body}>{product.presentation}</Text></View>
      </View> : null}
      {product.origin ? <View style={styles.info}>
        <Ionicons accessible={false} name="location-outline" size={21} color={colors.primary} />
        <View style={styles.infoCopy}><Text accessibilityRole="header" style={styles.infoTitle}>Origen</Text><Text style={styles.body}>{product.origin}</Text></View>
      </View> : null}
      {product.benefits.length > 0 ? <View style={styles.benefits}>
        <Text accessibilityRole="header" style={styles.infoTitle}>Características</Text>
        {product.benefits.map((benefit, index) => <View key={`${index}:${benefit}`} style={styles.benefit}>
          <Ionicons accessible={false} name="checkmark-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.benefitText}>{benefit}</Text>
        </View>)}
      </View> : null}
      <Pressable accessibilityRole="button" accessibilityLabel={vm.error ? 'Reintentar carga del producto' : 'Actualizar producto'}
        accessibilityState={{ disabled: vm.refreshing, busy: vm.refreshing }} disabled={vm.refreshing}
        onPress={() => { void vm.refresh(); }} style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}>
        {vm.refreshing ? <ActivityIndicator color={colors.primary} size="small" />
          : <Ionicons accessible={false} name="refresh-outline" size={17} color={colors.primary} />}
        <Text style={styles.linkLabel}>{vm.refreshing ? 'Actualizando…' : vm.error ? 'Reintentar' : 'Actualizar producto'}</Text>
      </Pressable>
      <ProductDetailAccesses />
    </> : <>
      <ScreenState title={vm.status === 'not-found' ? 'Producto no disponible' : 'No pudimos cargar este aroma'}
        message={vm.error ?? undefined} icon={vm.status === 'not-found' ? 'leaf-outline' : 'cloud-offline-outline'}
        onAction={vm.status !== 'not-found' ? () => { void vm.refresh(); } : undefined}
        actionLabel="Reintentar" actionBusy={vm.refreshing} />
      <Pressable accessibilityRole="button" onPress={returnToCatalog}
        style={({ pressed }) => [styles.returnButton, pressed && styles.pressed]}>
        <Text style={styles.linkLabel}>Volver al catálogo</Text>
      </Pressable>
    </>}
  </BottomSheet>;
}

function ProductDetailAccesses() {
  const dismiss = useBottomSheetDismiss();
  return <View style={styles.accesses}>
    <Pressable accessibilityRole="button" accessibilityLabel="Ver mis favoritos"
      accessibilityHint="Cierra el detalle y abre Favoritos" onPress={() => dismiss(() => router.navigate('/(tabs)/favoritos'))}
      style={({ pressed }) => [styles.access, pressed && styles.pressed]}>
      <Ionicons accessible={false} name="heart-outline" size={18} color={colors.primaryDark} />
      <Text style={styles.linkLabel}>Ver favoritos</Text>
    </Pressable>
    <View accessible={false} style={styles.accessDivider} />
    <Pressable accessibilityRole="button" accessibilityLabel="Ir a mi bolsa de compras"
      accessibilityHint="Cierra el detalle y abre Bolsa" onPress={() => dismiss(() => router.navigate('/(tabs)/bolsa'))}
      style={({ pressed }) => [styles.access, pressed && styles.pressed]}>
      <Ionicons accessible={false} name="bag-handle-outline" size={18} color={colors.primaryDark} />
      <Text style={styles.linkLabel}>Ver bolsa</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  category: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, lineHeight: 17, marginTop: 22 },
  nameRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 6 },
  name: { color: colors.text, flex: 1, fontSize: 29, fontWeight: '700', letterSpacing: -0.8, lineHeight: 36 },
  priceRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between', marginVertical: 16 },
  priceCopy: { flexShrink: 1 },
  price: { color: colors.primaryDark, fontSize: 25, fontWeight: '800', lineHeight: 32 },
  originalPrice: { color: colors.textMuted, fontSize: 12, lineHeight: 20, textDecorationLine: 'line-through' },
  stock: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  stockDot: { backgroundColor: colors.primary, borderRadius: 4, height: 6, width: 6 },
  unavailableDot: { backgroundColor: colors.textMuted },
  stockLabel: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
  descriptionSection: { marginTop: 8 },
  body: { color: colors.textMuted, fontSize: 14, lineHeight: 23 },
  info: { alignItems: 'flex-start', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: 12, marginTop: 18, paddingTop: 18 },
  infoCopy: { flex: 1 },
  infoTitle: { color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 22, marginBottom: 5 },
  notes: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  note: { backgroundColor: colors.surfaceSoft, borderRadius: 9, maxWidth: '100%', paddingHorizontal: 10, paddingVertical: 5 },
  noteLabel: { color: colors.primaryDark, fontSize: 12, lineHeight: 19 },
  benefits: { backgroundColor: colors.surfaceSoft, borderRadius: 18, marginTop: 20, padding: 17 },
  benefit: { alignItems: 'flex-start', flexDirection: 'row', gap: 8, marginTop: 10 },
  benefitText: { color: colors.textMuted, flex: 1, fontSize: 13, lineHeight: 21 },
  refreshButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 8, marginTop: 16, minHeight: 44, paddingVertical: 10 },
  linkLabel: { color: colors.primaryDark, flexShrink: 1, fontSize: 12, fontWeight: '600', lineHeight: 20, textAlign: 'center' },
  accesses: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginTop: 16, paddingTop: 10 },
  access: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 44, paddingHorizontal: 8, paddingVertical: 9 },
  accessDivider: { backgroundColor: colors.border, height: 16, width: 1 },
  returnButton: { alignItems: 'center', marginTop: 12, minHeight: 44, paddingHorizontal: 15, paddingVertical: 11 },
  pressed: { opacity: 0.7 },
});
