import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { Reveal } from '@/shared/components/Motion';
import type { ListCatalog } from '../../domain/useCases/listCatalog';
import { CatalogProductCard } from '../components/CatalogProductCard';
import { useCatalogViewModel, type CatalogProductViewModel } from '../viewModels/useCatalogViewModel';

export function CatalogScreen({ listCatalog, categoryName }: { listCatalog: ListCatalog; categoryName?: string }) {
  const vm = useCatalogViewModel(listCatalog);
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
        refreshing={vm.refreshing}
        onRefresh={() => { void vm.refresh(); }}
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Actualizar catálogo"
                accessibilityState={{ disabled: vm.status === 'loading' || vm.refreshing, busy: vm.refreshing }}
                disabled={vm.status === 'loading' || vm.refreshing}
                onPress={() => { void vm.refresh(); }}
                style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}
              >
                {vm.refreshing ? <ActivityIndicator size="small" color={colors.primary} />
                  : <Ionicons accessible={false} name="refresh-outline" size={16} color={colors.primary} />}
                <Text style={styles.refreshText}>{vm.refreshing ? 'Actualizando…' : 'Actualizar catálogo'}</Text>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Explorar líneas o categorías"
                onPress={() => router.push('/lineas-categorias')}
                style={({ pressed }) => [styles.linesEntry, pressed && styles.pressed]}>
                <View style={styles.linesEntrySymbol}><Ionicons accessible={false} name="layers-outline" size={21} color={colors.primary} /></View>
                <View style={styles.linesEntryCopy}>
                  <Text style={styles.linesEntryTitle}>Encuentra tu línea</Text>
                  <Text style={styles.linesEntryDescription}>Conoce las líneas de INHALEX</Text>
                </View>
                <Ionicons accessible={false} name="chevron-forward" size={18} color={colors.primary} />
              </Pressable>
              {categoryName !== undefined && <View style={styles.filterPanel}>
                <Text accessibilityRole="header" style={styles.filterTitle}>{categoryName}</Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Ver todos los productos"
                  onPress={() => router.replace('/(tabs)/catalogo')}
                  style={({ pressed }) => [styles.clearFilter, pressed && styles.pressed]}>
                  <Text style={styles.clearFilterText}>Ver todos los productos</Text>
                  <Ionicons accessible={false} name="close-circle-outline" size={18} color={colors.primaryDark} />
                </Pressable>
              </View>}
              {vm.error && vm.products.length > 0 && <View accessibilityLiveRegion="polite" style={styles.notice}>
                <Text style={styles.noticeText}>{vm.error} Se conserva la última colección cargada.</Text>
              </View>}
            </Reveal>
            <Reveal delay={60} style={styles.inset}>
              <View style={[styles.collectionRow, largeText && styles.collectionRowStacked]}>
                <View style={styles.collectionCopy}>
                  <Text accessibilityRole="header" style={styles.collectionTitle}>{categoryName === undefined ? 'Nuestra colección' : 'Productos de esta línea'}</Text>
                  <Text style={styles.collectionCount}>{vm.status === 'loading' ? 'Buscando tus próximos aromas…'
                    : vm.status === 'error' ? 'La colección estará aquí al reconectar'
                    : `${vm.total} ${vm.total === 1 ? 'producto' : 'productos'} para descubrir`}</Text>
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
        ListEmptyComponent={
          <View accessibilityLiveRegion="polite" style={styles.emptyState}>
            {vm.status === 'loading'
              ? <ActivityIndicator accessibilityLabel="Cargando productos" color={colors.primary} size="large" />
              : <Ionicons accessible={false} name={vm.status === 'error' ? 'cloud-offline-outline' : 'leaf-outline'} color={colors.primary} size={34} />}
            <Text accessibilityRole="header" style={styles.stateTitle}>{vm.status === 'loading' ? 'Un momento para descubrir'
              : vm.status === 'error' ? 'No pudimos cargar la colección' : categoryName === undefined ? 'Nuevos aromas están por llegar' : 'Esta línea aún no tiene productos'}</Text>
            <Text style={styles.stateCopy}>{vm.status === 'loading' ? 'Estamos preparando el catálogo para ti.'
              : vm.status === 'error' ? vm.error : categoryName === undefined
                ? 'Por ahora no hay productos disponibles. Puedes volver a consultar en un momento.'
                : 'Puedes consultar otra línea o volver a ver todos los productos.'}</Text>
            {vm.status !== 'loading' && <Pressable accessibilityRole="button" onPress={() => { void vm.refresh(); }}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
              <Text style={styles.actionText}>{vm.status === 'error' ? 'Reintentar' : 'Volver a consultar'}</Text>
            </Pressable>}
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {vm.products.length > 0 && <>
              <Text style={styles.loadedCount}>{vm.products.length} de {vm.total} productos</Text>
              {vm.moreError && <Text accessibilityLiveRegion="polite" style={styles.paginationError}>{vm.moreError}</Text>}
              {vm.hasMore && <Pressable accessibilityRole="button"
                accessibilityState={{ disabled: vm.loadingMore || vm.refreshing, busy: vm.loadingMore }}
                disabled={vm.loadingMore || vm.refreshing}
                onPress={() => { void vm.loadMore(); }}
                style={({ pressed }) => [styles.actionButton, styles.moreButton, pressed && styles.pressed]}>
                {vm.loadingMore && <ActivityIndicator size="small" color={colors.white} />}
                <Text style={styles.actionText}>{vm.loadingMore ? 'Cargando…' : vm.moreError ? 'Reintentar más productos' : 'Cargar más productos'}</Text>
              </Pressable>}
            </>}
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
  refreshButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 8, marginTop: 10, minHeight: 44, paddingRight: 12 },
  refreshText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  linesEntry: { alignItems: 'center', backgroundColor: '#EAF1E5', borderColor: '#DDE8D5', borderRadius: 17, borderWidth: 1, flexDirection: 'row', gap: 12, marginTop: 12, minHeight: 76, padding: 14 },
  linesEntrySymbol: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 13, height: 42, justifyContent: 'center', width: 42 },
  linesEntryCopy: { flex: 1 },
  linesEntryTitle: { color: colors.primaryDark, fontSize: 14, fontWeight: '600', lineHeight: 21 },
  linesEntryDescription: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 2 },
  filterPanel: { backgroundColor: '#F0F6EB', borderColor: '#D5E2CE', borderRadius: 15, borderWidth: 1, marginTop: 12, paddingHorizontal: 14, paddingTop: 12 },
  filterTitle: { color: colors.primaryDark, fontSize: 16, fontWeight: '700', lineHeight: 23 },
  clearFilter: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 8, minHeight: 44 },
  clearFilterText: { color: colors.primaryDark, flexShrink: 1, fontSize: 12, lineHeight: 19 },
  notice: { backgroundColor: '#F8EFE5', borderRadius: 12, padding: 12, marginTop: 8 },
  noticeText: { color: '#79543B', fontSize: 12, lineHeight: 19 },
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
  emptyState: { alignItems: 'center', paddingHorizontal: 30, paddingVertical: 36 },
  stateTitle: { color: colors.text, fontSize: 19, fontWeight: '700', lineHeight: 26, marginTop: 16, textAlign: 'center' },
  stateCopy: { color: colors.textMuted, fontSize: 13, lineHeight: 21, marginTop: 9, textAlign: 'center' },
  actionButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 14, flexDirection: 'row', gap: 9, justifyContent: 'center', marginTop: 20, minHeight: 48, paddingHorizontal: 22, paddingVertical: 12 },
  actionText: { color: colors.white, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  moreButton: { marginBottom: 26, marginTop: 12 },
  loadedCount: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginBottom: 4, textAlign: 'center' },
  paginationError: { color: '#8A4E3B', fontSize: 12, lineHeight: 19, marginTop: 8, textAlign: 'center' },
  footer: { alignItems: 'center', paddingHorizontal: 22, paddingTop: 14 },
  signature: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  signatureLine: { backgroundColor: colors.border, height: 1, width: 42 },
  signatureMark: { height: 26, opacity: 0.65, width: 25 },
  footerCopy: { color: colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: 9, textAlign: 'center' },
});
