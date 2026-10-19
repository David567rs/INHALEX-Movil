import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { CatalogProductCard } from '@/features/catalog/presentation/components/CatalogProductCard';
import { Reveal, SoftPressable } from '@/shared/components/Motion';
import type { SearchProducts } from '../../domain/useCases/searchProducts';
import { useProductSearchViewModel } from '../viewModels/useProductSearchViewModel';

export function ProductSearchScreen({ searchProducts }: { searchProducts: SearchProducts }) {
  const vm = useProductSearchViewModel(searchProducts);
  const [focused, setFocused] = useState(false);
  const { width, fontScale } = useWindowDimensions();
  const stackCards = width < 350 || fontScale > 1.25;

  function returnToCatalog() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/catalogo');
  }

  function runSearch() {
    Keyboard.dismiss();
    void vm.search();
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardArea}>
        <FlatList data={vm.products} keyExtractor={(product) => product.id} initialNumToRender={6}
          keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS === 'web' ? 'none' : 'on-drag'}
          showsVerticalScrollIndicator={false} style={styles.list} contentContainerStyle={styles.content}
          renderItem={({ item }) => <View style={styles.resultCard}>
            <CatalogProductCard product={item} horizontal={!stackCards}
              onPress={() => router.push({ pathname: '/producto/[id]', params: { id: item.id } })} />
          </View>}
          ListHeaderComponent={<>
          <Reveal>
            <View style={styles.topBar}>
              <Pressable accessibilityRole="button" accessibilityLabel="Volver al catálogo"
                onPress={returnToCatalog} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
                <Ionicons accessible={false} name="arrow-back" size={21} color={colors.primaryDark} />
              </Pressable>
              <Image accessibilityLabel="INHALEX, el respiro que alivia" resizeMode="contain"
                source={require('../../../../../assets/home/brand.png')} style={styles.brand} />
            </View>

            <View style={styles.heading}>
              <View style={styles.eyebrowRow}>
                <Text style={styles.eyebrow}>BÚSQUEDA INHALEX</Text>
              </View>
              <Text accessibilityRole="header" style={styles.title}>Encuentra tu{'\n'}próximo aroma<Text style={styles.dot}>.</Text></Text>
              <Text style={styles.description}>Una palabra puede ser el inicio de tu próxima pausa.</Text>
            </View>

            <View style={styles.searchPanel}>
              <Text nativeID="search-label" style={styles.fieldLabel}>¿Qué aroma buscas?</Text>
              <View style={[styles.field, focused && styles.focusedField]}>
                <Ionicons accessible={false} name="search-outline" size={22} color={colors.primary} />
                <TextInput accessibilityLabel="Buscar productos" accessibilityLabelledBy="search-label"
                  accessibilityHint="Escribe un nombre o una palabra clave y pulsa Buscar."
                  value={vm.query} onChangeText={vm.setQuery} placeholder="Por ejemplo, lavanda"
                  placeholderTextColor={colors.textMuted} autoCapitalize="none" autoCorrect={false}
                  maxLength={vm.maxLength} selectionColor={colors.primary}
                  returnKeyType="search" onSubmitEditing={runSearch}
                  onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={styles.input} />
                {vm.query.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Borrar texto de búsqueda"
                  onPress={vm.clearQuery} style={({ pressed }) => [styles.clearButton, pressed && styles.pressed]}>
                  <Ionicons accessible={false} name="close-circle" size={21} color={colors.textMuted} />
                </Pressable>}
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Buscar productos"
                accessibilityState={{ disabled: !vm.canSearch, busy: vm.status === 'loading' || vm.refreshing }}
                disabled={!vm.canSearch} onPress={runSearch}
                style={({ pressed }) => [styles.searchButton, !vm.canSearch && styles.disabledButton, pressed && styles.pressed]}>
                <Text style={styles.searchButtonText}>{vm.status === 'loading' || vm.refreshing ? 'Buscando…' : 'Buscar'}</Text>
                {vm.status === 'loading' || vm.refreshing ? <ActivityIndicator color={colors.primaryDark} size="small" />
                  : <Ionicons accessible={false} name="arrow-forward" size={18} color={colors.primaryDark} />}
              </Pressable>
              <Text style={styles.searchNote}>Busca por nombre, descripción o aromas. Hasta {vm.maxLength} caracteres.</Text>
            </View>
          </Reveal>

          <Reveal delay={60} style={styles.suggestionsSection}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Un poco de inspiración</Text>
            <Text style={styles.sectionDescription}>Elige una palabra y pulsa Buscar.</Text>
            <View style={styles.suggestions}>
              {vm.suggestions.map((suggestion) => (
                <SoftPressable key={suggestion} accessibilityRole="button" accessibilityLabel={`Escribir ${suggestion} en el buscador`}
                  onPress={() => vm.setQuery(suggestion)} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
                  <Ionicons accessible={false} name="leaf-outline" size={15} color={colors.primary} />
                  <Text style={styles.chipText}>{suggestion}</Text>
                </SoftPressable>
              ))}
            </View>
          </Reveal>

          <View style={styles.resultsHeading}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{vm.term ? `Resultados para «${vm.term}»` : 'Encuentra tu esencia'}</Text>
            {vm.status === 'ready' && <Text accessibilityLiveRegion="polite" style={styles.sectionDescription}>
              {vm.total} {vm.total === 1 ? 'coincidencia' : 'coincidencias'}
            </Text>}
            {vm.error && vm.products.length > 0 && <View accessibilityLiveRegion="polite" style={styles.notice}>
              <Text style={styles.noticeText}>{vm.error} Conservamos los últimos resultados de esta búsqueda.</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Reintentar búsqueda"
                onPress={() => { void vm.retry(); }} style={({ pressed }) => [styles.retryLink, pressed && styles.pressed]}>
                <Text style={styles.retryLinkText}>Reintentar</Text>
              </Pressable>
            </View>}
          </View>
          </>}
          ListEmptyComponent={<View accessibilityLiveRegion="polite" style={styles.statePanel}>
            {vm.status === 'loading' ? <ActivityIndicator accessibilityLabel="Buscando productos" color={colors.primary} size="large" />
              : <Ionicons accessible={false} name={vm.status === 'error' ? 'cloud-offline-outline' : 'search-outline'} size={32} color={colors.primary} />}
            <Text accessibilityRole="header" style={styles.stateTitle}>{vm.status === 'idle' ? 'Empieza con un aroma'
              : vm.status === 'loading' ? 'Buscando tu próxima esencia'
              : vm.status === 'error' ? 'No pudimos buscar' : 'No encontramos coincidencias'}</Text>
            <Text style={styles.stateDescription}>{vm.status === 'idle' ? 'Escribe un nombre o una palabra clave para explorar la colección.'
              : vm.status === 'loading' ? 'Un momento, estamos consultando la colección.'
              : vm.status === 'error' ? vm.error : 'Prueba con otra palabra o revisa cómo la escribiste.'}</Text>
            {vm.status === 'error' && <Pressable accessibilityRole="button" accessibilityLabel="Reintentar búsqueda"
              onPress={() => { void vm.retry(); }} style={({ pressed }) => [styles.retryLink, pressed && styles.pressed]}>
              <Text style={styles.retryLinkText}>Reintentar</Text>
            </Pressable>}
          </View>}
          ListFooterComponent={<>
            {vm.products.length > 0 && <View style={styles.pagination}>
              <Text style={styles.sectionDescription}>{vm.products.length} de {vm.total} productos</Text>
              {vm.moreError && <Text accessibilityLiveRegion="polite" style={styles.noticeText}>{vm.moreError}</Text>}
              {vm.hasMore && <Pressable accessibilityRole="button" accessibilityLabel="Cargar más resultados"
                accessibilityState={{ disabled: vm.loadingMore || vm.refreshing, busy: vm.loadingMore }}
                disabled={vm.loadingMore || vm.refreshing} onPress={() => { void vm.loadMore(); }}
                style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}>
                {vm.loadingMore && <ActivityIndicator size="small" color={colors.primaryDark} />}
                <Text style={styles.retryLinkText}>{vm.loadingMore ? 'Cargando…' : vm.moreError ? 'Reintentar más resultados' : 'Cargar más resultados'}</Text>
              </Pressable>}
            </View>
            }
          <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.signature}>
            <View style={styles.signatureLine} />
            <Image source={require('../../../../../assets/inhalex-mark.png')} resizeMode="contain" style={styles.signatureMark} />
            <View style={styles.signatureLine} />
          </View>
          <Text style={styles.footer}>Tu próxima pausa empieza con un aroma.</Text>
          </>}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  keyboardArea: { flex: 1 },
  list: { alignSelf: 'center', maxWidth: 600, width: '100%' },
  content: { alignSelf: 'center', flexGrow: 1, maxWidth: 600, padding: 22, paddingBottom: 30, width: '100%' },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  backButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 23, borderWidth: 1, height: 46, justifyContent: 'center', width: 46 },
  brand: { height: 40, width: 132 },
  heading: { marginTop: 28 },
  eyebrowRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  title: { color: colors.text, fontSize: 32, fontWeight: '700', letterSpacing: -1, lineHeight: 39, marginTop: 12 },
  dot: { color: colors.primary },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 22, marginTop: 10 },
  searchPanel: { marginTop: 28 },
  fieldLabel: { color: colors.primaryDark, fontSize: 13, fontWeight: '600', marginBottom: 9 },
  field: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 17, borderWidth: 1, flexDirection: 'row', gap: 10, minHeight: 60, paddingLeft: 15, paddingRight: 5 },
  focusedField: { borderColor: colors.primary, borderWidth: 1 },
  input: { color: colors.text, flex: 1, fontSize: 15, minHeight: 58, minWidth: 0, paddingVertical: 15 },
  clearButton: { alignItems: 'center', justifyContent: 'center', minHeight: 46, width: 44 },
  searchButton: { alignItems: 'center', backgroundColor: '#CBE2BB', borderRadius: 15, flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 12, minHeight: 52, padding: 12 },
  disabledButton: { backgroundColor: '#E2EBDD' },
  searchButtonText: { color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
  searchNote: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 10 },
  suggestionsSection: { marginTop: 28 },
  sectionTitle: { color: colors.text, flexShrink: 1, fontSize: 18, fontWeight: '700', lineHeight: 26 },
  sectionDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 20, marginTop: 5 },
  suggestions: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderColor: '#D8E6CF', borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 7, minHeight: 46, paddingHorizontal: 14, paddingVertical: 10 },
  chipText: { color: colors.primaryDark, fontSize: 12, fontWeight: '600' },
  resultsHeading: { marginTop: 28, marginBottom: 16 },
  resultCard: { marginBottom: 14 },
  statePanel: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderRadius: 20, borderWidth: 1, padding: 24 },
  stateTitle: { color: colors.primaryDark, fontSize: 18, fontWeight: '700', lineHeight: 27, marginTop: 12, textAlign: 'center' },
  stateDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 21, marginTop: 8, textAlign: 'center' },
  notice: { backgroundColor: '#FFF4DA', borderRadius: 12, marginTop: 12, padding: 12 },
  noticeText: { color: '#79543B', fontSize: 12, lineHeight: 20 },
  retryLink: { justifyContent: 'center', minHeight: 46, paddingHorizontal: 8, paddingVertical: 10 },
  retryLinkText: { color: colors.primaryDark, fontSize: 13, fontWeight: '600' },
  pagination: { alignItems: 'center', gap: 10, marginTop: 10 },
  moreButton: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 48, paddingHorizontal: 18, paddingVertical: 12 },
  signature: { alignItems: 'center', flexDirection: 'row', gap: 13, justifyContent: 'center', marginTop: 30 },
  signatureLine: { backgroundColor: colors.border, height: 1, width: 45 },
  signatureMark: { height: 24, opacity: 0.65, width: 24 },
  footer: { color: colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: 9, textAlign: 'center' },
  pressed: { opacity: 0.75 },
});
