import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FlatList, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { Reveal } from '@/shared/components/Motion';
import type { ReadCatalogPreview } from '../../domain/useCases/readCatalogPreview';
import { CatalogProductCard } from '../components/CatalogProductCard';
import { useCatalogViewModel, type CatalogProductViewModel } from '../viewModels/useCatalogViewModel';

export function CatalogScreen({ readPreview }: { readPreview: ReadCatalogPreview }) {
  const vm = useCatalogViewModel(readPreview);
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const largeText = fontScale > 1.25;
  const availableWidth = Math.min(width - insets.left - insets.right, 600);
  const columns = vm.layout === 'grid' && availableWidth >= 360 && !largeText ? 2 : 1;
  const horizontal = vm.layout === 'list' && !largeText;

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <FlatList<CatalogProductViewModel>
        key={`${columns}-${vm.layout}-${largeText}`}
        data={vm.products}
        keyExtractor={(product) => product.id}
        numColumns={columns}
        initialNumToRender={6}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={styles.content}
        columnWrapperStyle={columns === 2 ? styles.row : undefined}
        ListHeaderComponent={
          <>
            <Reveal style={styles.inset}>
              <View style={styles.brandRow}>
                <Image
                  accessibilityLabel="INHALEX, el respiro que alivia"
                  source={require('../../../../../assets/home/brand.png')}
                  resizeMode="contain"
                  style={styles.brand}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ir a mi cuenta"
                  onPress={() => router.navigate('/(tabs)/cuenta')}
                  style={({ pressed }) => [styles.account, pressed && styles.pressed]}
                >
                  <Ionicons accessible={false} name="person-outline" size={20} color={colors.primaryDark} />
                </Pressable>
              </View>
              <View style={styles.heading}>
                <Text style={styles.eyebrow}>CATÁLOGO INHALEX</Text>
                <Text accessibilityRole="header" style={styles.title}>Un aroma para ti<Text style={styles.titleDot}>.</Text></Text>
                <Text style={styles.description}>Pequeñas esencias para acompañar tu día.</Text>
              </View>
              <View style={styles.preview}>
                <Ionicons accessible={false} name="eye-outline" size={15} color={colors.primary} />
                <Text style={styles.previewText}>Vista previa · productos y precios de muestra</Text>
              </View>
            </Reveal>
            <Reveal delay={60} style={styles.inset}>
              <View style={[styles.collectionRow, largeText && styles.collectionRowStacked]}>
                <View style={styles.collectionCopy}>
                  <Text accessibilityRole="header" style={styles.collectionTitle}>Nuestra colección</Text>
                  <Text style={styles.collectionCount}>{vm.total} aromas para descubrir</Text>
                </View>
                <View accessibilityRole="radiogroup" accessibilityLabel="Presentación del catálogo" style={styles.layoutSwitch}>
                  {([
                    ['grid', 'grid-outline', 'Ver en cuadrícula'],
                    ['list', 'list-outline', 'Ver en lista'],
                  ] as const).map(([layout, icon, label]) => (
                    <Pressable
                      key={layout}
                      accessibilityRole="radio"
                      accessibilityLabel={label}
                      accessibilityState={{ checked: vm.layout === layout }}
                      aria-checked={vm.layout === layout}
                      onPress={() => vm.setLayout(layout)}
                      style={({ pressed }) => [styles.layoutButton, vm.layout === layout && styles.selectedLayout, pressed && styles.pressed]}
                    >
                      <Ionicons accessible={false} name={icon} size={19} color={vm.layout === layout ? colors.primaryDark : colors.textMuted} />
                    </Pressable>
                  ))}
                </View>
              </View>
            </Reveal>
          </>
        }
        renderItem={({ item, index }) => (
          <Reveal delay={Math.min(index, 5) * 35} style={[styles.cardShell, columns === 1 && styles.singleCard]}>
            <CatalogProductCard product={item} horizontal={horizontal} />
          </Reveal>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.signature}>
              <View style={styles.signatureLine} />
              <Image source={require('../../../../../assets/inhalex-mark.png')} resizeMode="contain" style={styles.signatureMark} />
              <View style={styles.signatureLine} />
            </View>
            <Text style={styles.footerCopy}>Tu próxima pausa empieza con un aroma.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  list: { alignSelf: 'center', flex: 1, maxWidth: 600, width: '100%' },
  content: { paddingBottom: 28 },
  inset: { paddingHorizontal: 22 },
  brandRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  brand: { height: 44, width: 142 },
  account: { alignItems: 'center', backgroundColor: '#ECF3E7', borderColor: '#E0E9D9', borderRadius: 24, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  heading: { marginTop: 28 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.7 },
  title: { color: colors.text, fontSize: 31, fontWeight: '700', letterSpacing: -1, lineHeight: 38, marginTop: 7 },
  titleDot: { color: colors.primary },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 21, marginTop: 6 },
  preview: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#EAF2E4', borderRadius: 11, flexDirection: 'row', gap: 7, marginTop: 17, maxWidth: '100%', paddingHorizontal: 10, paddingVertical: 8 },
  previewText: { color: '#4E6B50', flexShrink: 1, fontSize: 10, lineHeight: 16 },
  collectionRow: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between', marginBottom: 17, marginTop: 28 },
  collectionRowStacked: { alignItems: 'flex-start', flexDirection: 'column' },
  collectionCopy: { flex: 1 },
  collectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.4, lineHeight: 24 },
  collectionCount: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 3 },
  layoutSwitch: { backgroundColor: '#EAF0E4', borderRadius: 13, flexDirection: 'row', padding: 3 },
  layoutButton: { alignItems: 'center', borderRadius: 10, height: 44, justifyContent: 'center', width: 44 },
  selectedLayout: { backgroundColor: colors.white },
  pressed: { opacity: 0.65 },
  row: { alignItems: 'stretch', gap: 12, paddingHorizontal: 22 },
  cardShell: { flex: 1, marginBottom: 14 },
  singleCard: { marginHorizontal: 22 },
  footer: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 14 },
  signature: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  signatureLine: { backgroundColor: colors.border, height: 1, width: 42 },
  signatureMark: { height: 26, opacity: 0.65, width: 25 },
  footerCopy: { color: colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: 9, textAlign: 'center' },
});
