import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { Reveal } from '@/shared/components/Motion';
import type { GetProductDetailPreview } from '../../domain/useCases/getProductDetailPreview';
import { ProductDetailImage } from '../components/ProductDetailImage';
import { useProductDetailViewModel } from '../viewModels/useProductDetailViewModel';

export function ProductDetailScreen({ productId, readProduct }: { productId: string; readProduct: GetProductDetailPreview }) {
  const { product } = useProductDetailViewModel(productId, readProduct);
  const { height, width, fontScale } = useWindowDimensions();
  const stackActions = width < 360 || fontScale > 1.2;
  const imageHeight = Math.min(420, Math.max(250, height * 0.44));

  function returnToCatalog() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/catalogo');
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver al catálogo"
            onPress={returnToCatalog} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons accessible={false} name="arrow-back" size={21} color={colors.primaryDark} />
          </Pressable>
          <Image accessibilityLabel="INHALEX, el respiro que alivia" resizeMode="contain"
            source={require('../../../../../assets/home/brand.png')} style={styles.brand} />
        </View>

        <View style={styles.previewRow}>
          <Text style={styles.eyebrow}>DETALLE DEL PRODUCTO</Text>
          <View style={styles.previewBadge}><Text style={styles.previewLabel}>Vista previa</Text></View>
        </View>

        {product ? <>
          <Reveal style={styles.artwork}>
            <ProductDetailImage key={product.id} image={product.image} name={product.name} height={imageHeight} />
          </Reveal>
          <Reveal delay={50}>
            <Text style={styles.productType}>ESENCIA INHALEX</Text>
            <Text accessibilityRole="header" style={styles.name}>{product.name}</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceCopy}>
                {product.originalPriceLabel !== null && <Text style={styles.originalPrice}>Antes: {product.originalPriceLabel}</Text>}
                <Text style={styles.price}>{product.priceLabel}</Text>
              </View>
              <View style={[styles.stockBadge, !product.inStock && styles.unavailableBadge]}>
                <View accessible={false} style={[styles.stockDot, !product.inStock && styles.unavailableDot]} />
                <Text style={[styles.stockLabel, !product.inStock && styles.unavailableLabel]}>{product.availabilityLabel}</Text>
              </View>
            </View>

            <View style={styles.descriptionSection}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>Conoce este aroma</Text>
              <Text style={styles.description}>{product.description}</Text>
            </View>
            {product.aromas.length > 0 && <View style={styles.aromasSection}>
              <View style={styles.sectionHeading}>
                <Ionicons accessible={false} name="leaf-outline" size={20} color={colors.primary} />
                <Text accessibilityRole="header" style={styles.sectionTitle}>Perfil aromático</Text>
              </View>
              <View style={styles.aromas}>
                {product.aromas.map((aroma, index) => <View key={`${index}:${aroma}`} style={styles.aroma}>
                  <Text style={styles.aromaText}>{aroma}</Text>
                </View>)}
              </View>
            </View>}

            <View style={styles.previewNotice}>
              <Ionicons accessible={false} name="information-circle-outline" size={19} color={colors.primary} />
              <Text style={styles.previewCopy}>Vista previa con la información del producto seleccionado en el catálogo.</Text>
            </View>

            <View style={[styles.actions, stackActions && styles.stackedActions]}>
              <Pressable disabled accessibilityRole="button" accessibilityLabel="Favoritos, próximamente"
                accessibilityState={{ disabled: true }} style={[styles.action, stackActions && styles.stackedAction]}>
                <Ionicons accessible={false} name="heart-outline" size={22} color={colors.textMuted} />
                <View style={styles.actionCopy}>
                  <Text style={styles.actionTitle}>Favoritos</Text>
                  <Text style={styles.comingSoon}>Próximamente</Text>
                </View>
              </Pressable>
              <Pressable disabled accessibilityRole="button" accessibilityLabel="Bolsa de compras, próximamente"
                accessibilityState={{ disabled: true }} style={[styles.action, stackActions && styles.stackedAction]}>
                <Ionicons accessible={false} name="bag-handle-outline" size={22} color={colors.textMuted} />
                <View style={styles.actionCopy}>
                  <Text style={styles.actionTitle}>Bolsa de compras</Text>
                  <Text style={styles.comingSoon}>Próximamente</Text>
                </View>
              </Pressable>
            </View>
          </Reveal>
        </> : <View style={styles.missing}>
          <Ionicons accessible={false} name="leaf-outline" size={38} color={colors.primary} />
          <Text accessibilityRole="header" style={styles.missingTitle}>Selecciona tu próximo aroma</Text>
          <Text style={styles.missingCopy}>Esta vista previa no está disponible. Elige un producto del catálogo para consultar su información.</Text>
          <Pressable accessibilityRole="button" onPress={returnToCatalog}
            style={({ pressed }) => [styles.catalogButton, pressed && styles.pressed]}>
            <Text style={styles.catalogButtonText}>Volver al catálogo</Text>
          </Pressable>
        </View>}

        <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.signature}>
          <View style={styles.signatureLine} />
          <Image source={require('../../../../../assets/inhalex-mark.png')} resizeMode="contain" style={styles.mark} />
          <View style={styles.signatureLine} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { alignSelf: 'center', flexGrow: 1, maxWidth: 600, paddingBottom: 25, paddingHorizontal: 22, width: '100%' },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  backButton: { alignItems: 'center', backgroundColor: '#ECF3E7', borderColor: colors.border, borderRadius: 22, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  brand: { height: 42, width: 139 },
  previewRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', marginBottom: 17, marginTop: 26 },
  eyebrow: { color: colors.primary, fontSize: 9, fontWeight: '700', letterSpacing: 1.3, lineHeight: 17 },
  previewBadge: { alignSelf: 'flex-start', backgroundColor: '#E8F0E2', borderColor: '#D7E5CF', borderRadius: 20, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  previewLabel: { color: colors.primaryDark, fontSize: 10, fontWeight: '600', lineHeight: 16 },
  artwork: { marginBottom: 25 },
  productType: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.5, lineHeight: 17 },
  name: { color: colors.text, fontSize: 33, fontWeight: '700', letterSpacing: -0.9, lineHeight: 41, marginTop: 6 },
  priceRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between', marginBottom: 24, marginTop: 17 },
  priceCopy: { flexShrink: 1 },
  price: { color: colors.primaryDark, fontSize: 25, fontWeight: '700', lineHeight: 34 },
  originalPrice: { color: colors.textMuted, fontSize: 12, lineHeight: 20, marginBottom: 2, textDecorationLine: 'line-through' },
  stockBadge: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#EAF3E5', borderRadius: 20, flexDirection: 'row', gap: 6, paddingHorizontal: 11, paddingVertical: 6 },
  unavailableBadge: { backgroundColor: '#F5EBE5' },
  stockDot: { backgroundColor: colors.primary, borderRadius: 3, height: 6, width: 6 },
  unavailableDot: { backgroundColor: '#8A4E3B' },
  stockLabel: { color: colors.primaryDark, flexShrink: 1, fontSize: 11, fontWeight: '600', lineHeight: 18 },
  unavailableLabel: { color: '#8A4E3B' },
  descriptionSection: { borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 21 },
  sectionTitle: { color: colors.text, flexShrink: 1, fontSize: 16, fontWeight: '600', lineHeight: 24 },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 24, marginTop: 9 },
  aromasSection: { marginTop: 23 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  aromas: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  aroma: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexShrink: 1, maxWidth: '100%', paddingHorizontal: 12, paddingVertical: 7 },
  aromaText: { color: colors.primaryDark, fontSize: 12, lineHeight: 19 },
  previewNotice: { alignItems: 'flex-start', backgroundColor: '#EDF3E8', borderRadius: 14, flexDirection: 'row', gap: 9, marginTop: 25, padding: 13 },
  previewCopy: { color: colors.textMuted, flex: 1, fontSize: 11, lineHeight: 19 },
  actions: { alignItems: 'stretch', flexDirection: 'row', gap: 10, marginTop: 20 },
  stackedActions: { flexDirection: 'column' },
  action: { alignItems: 'center', backgroundColor: '#F0F3EE', borderColor: colors.border, borderRadius: 16, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 9, minHeight: 72, paddingHorizontal: 13, paddingVertical: 14 },
  stackedAction: { flex: 0 },
  actionCopy: { flex: 1 },
  actionTitle: { color: colors.textMuted, fontSize: 12, fontWeight: '600', lineHeight: 20 },
  comingSoon: { color: colors.textMuted, fontSize: 10, lineHeight: 17, marginTop: 1 },
  missing: { alignItems: 'center', paddingHorizontal: 8, paddingVertical: 45 },
  missingTitle: { color: colors.text, fontSize: 23, fontWeight: '600', lineHeight: 31, marginTop: 18, textAlign: 'center' },
  missingCopy: { color: colors.textMuted, fontSize: 13, lineHeight: 22, marginTop: 10, textAlign: 'center' },
  catalogButton: { backgroundColor: colors.primaryDark, borderRadius: 14, justifyContent: 'center', marginTop: 23, minHeight: 48, paddingHorizontal: 23, paddingVertical: 13 },
  catalogButtonText: { color: colors.white, fontSize: 13, fontWeight: '600', lineHeight: 21, textAlign: 'center' },
  signature: { alignItems: 'center', flexDirection: 'row', gap: 14, justifyContent: 'center', marginTop: 30 },
  signatureLine: { backgroundColor: colors.border, height: 1, width: 42 },
  mark: { height: 25, opacity: 0.65, width: 25 },
  pressed: { opacity: 0.65 },
});
