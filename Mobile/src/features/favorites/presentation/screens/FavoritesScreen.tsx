import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { Reveal } from '@/shared/components/Motion';
import { FavoriteCard } from '../components/FavoriteCard';
import { useFavoritesViewModel } from '../viewModels/useFavoritesViewModel';

export function FavoritesScreen() {
  const vm = useFavoritesViewModel();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 350 || fontScale > 1.25;
  const needsSession = vm.status === 'anonymous' || vm.status === 'session-expired';
  const recovering = vm.status === 'recovery-error';
  const initialBusy = vm.busy && !vm.loaded;
  const initialError = vm.status === 'error' && !vm.loaded;
  const showCollection = !needsSession && !recovering && !initialBusy && !initialError;
  const openCatalog = () => router.navigate('/(tabs)/catalogo');
  const refresh = () => { void vm.refresh(); };
  async function openSignIn() {
    if (await vm.prepareSignIn()) router.push('/sign-in');
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Reveal>
          <View style={styles.header}>
            <Image accessibilityLabel="INHALEX, el respiro que alivia" resizeMode="contain"
              source={require('../../../../../assets/home/brand.png')} style={styles.brand} />
            <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.headerHeart}>
              <Ionicons name="heart-outline" size={22} color={colors.primaryDark} />
            </View>
          </View>
          <Text style={styles.eyebrow}>TUS IMPRESCINDIBLES</Text>
          <Text accessibilityRole="header" style={styles.title}>Tus favoritos<Text style={styles.dot}>.</Text></Text>
          <Text style={styles.intro}>Los aromas que van contigo, en un solo lugar.</Text>
        </Reveal>

        {needsSession ? <StatusPanel title={vm.status === 'session-expired' ? 'Vuelve a iniciar sesión' : 'Tu selección te espera'}
          message={vm.status === 'session-expired' ? 'Tu sesión ya no está disponible. Inicia sesión para consultar y guardar tus favoritos.'
            : 'Inicia sesión para guardar tus aromas y encontrarlos aquí.'}
          actionLabel={vm.openingSignIn ? 'Abriendo…' : 'Iniciar sesión'} actionBusy={vm.openingSignIn}
          onAction={() => { void openSignIn(); }} />
          : recovering ? <StatusPanel title="No pudimos comprobar tu sesión"
            message="Comprueba tu conexión e intenta recuperar tu sesión para consultar tus favoritos."
            actionLabel="Reintentar sesión" onAction={() => { void vm.restoreSession(); }} />
            : initialBusy ? <StatusPanel title={vm.status === 'checking' ? 'Comprobando tu sesión' : 'Preparando tu selección'}
              message={vm.status === 'checking' ? 'Estamos comprobando si tienes una sesión guardada.' : 'Estamos consultando tus favoritos.'} busy />
              : initialError ? <StatusPanel title="No pudimos cargar tus favoritos"
                message={vm.error || 'Comprueba tu conexión e inténtalo de nuevo.'} actionLabel="Reintentar" onAction={refresh} />
                : null}

        {showCollection && <>
          {vm.error && <View accessibilityLiveRegion="polite" style={styles.errorNotice}>
            <Ionicons accessible={false} name="information-circle-outline" size={19} color={colors.danger} />
            <Text style={styles.errorCopy}>{vm.error} Se conserva tu última colección cargada.</Text>
          </View>}
          {vm.mutationError && <View accessibilityLiveRegion="polite" style={styles.errorNotice}>
            <Ionicons accessible={false} name="alert-circle-outline" size={19} color={colors.danger} />
            <Text style={styles.errorCopy}>{vm.mutationError}</Text>
          </View>}
          <Pressable accessibilityRole="button" accessibilityLabel={vm.error ? 'Reintentar carga de favoritos' : 'Actualizar favoritos'}
            accessibilityState={{ disabled: !vm.canRefresh, busy: vm.refreshing }} disabled={!vm.canRefresh}
            onPress={refresh} style={({ pressed }) => [styles.refreshButton, !vm.canRefresh && styles.disabled, pressed && styles.pressed]}>
            {vm.refreshing ? <ActivityIndicator color={colors.primary} size="small" />
              : <Ionicons accessible={false} name="refresh-outline" size={17} color={colors.primary} />}
            <Text style={styles.refreshText}>{vm.refreshing ? 'Actualizando…' : vm.error ? 'Reintentar' : 'Actualizar favoritos'}</Text>
          </Pressable>

          {vm.products.length > 0 ? <>
            <Reveal delay={45}>
              <View style={styles.selectionCard}>
                <View style={styles.selectionCopy}>
                  <Text style={styles.selectionEyebrow}>CERCA DE TI</Text>
                  <Text accessibilityRole="header" style={styles.selectionTitle}>Una selección muy tuya.</Text>
                  <Text style={styles.selectionBody}>Pequeñas pausas para volver a elegir.</Text>
                </View>
                <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.selectionSymbol}>
                  <Ionicons name="heart" size={36} color="#CFE8B9" />
                </View>
              </View>
            </Reveal>
            <Reveal delay={75}>
              <View style={styles.sectionHeading}>
                <View style={styles.sectionCopy}>
                  <Text accessibilityRole="header" style={styles.sectionTitle}>Tu colección personal</Text>
                  <Text accessibilityLiveRegion="polite" style={styles.sectionDescription}>{vm.countLabel}</Text>
                </View>
                <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.countBadge}>
                  <Text style={styles.countText}>{vm.count}</Text>
                </View>
              </View>
              <View style={styles.cards}>{vm.products.map((product) => <FavoriteCard key={product.id} product={product}
                stacked={stacked} canRemove={vm.canMutate}
                onOpen={() => router.push({ pathname: '/producto/[id]', params: { id: product.id } })}
                onRemove={() => { void vm.remove(product.id); }} />)}</View>
              <Pressable accessibilityRole="button" accessibilityLabel="Explorar catálogo" onPress={openCatalog}
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Text style={styles.secondaryButtonText}>Seguir explorando</Text>
                <Ionicons accessible={false} name="arrow-forward" size={18} color={colors.primaryDark} />
              </Pressable>
            </Reveal>
          </> : <Reveal delay={45}>
            <View style={styles.emptyPanel}>
              <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.emptyIllustration}>
                <View style={styles.emptyHalo} />
                <View style={styles.emptyHeart}><Ionicons name="heart-outline" size={48} color={colors.primary} /></View>
                <View style={styles.emptyLeaf}><Ionicons name="leaf" size={19} color={colors.primaryDark} /></View>
              </View>
              <Text style={styles.emptyEyebrow}>AQUÍ EMPIEZA TU SELECCIÓN</Text>
              <Text accessibilityRole="header" style={styles.emptyTitle}>Aún no tienes favoritos</Text>
              <Text style={styles.emptyCopy}>Hay un aroma para cada momento. Explora la colección y encuentra los que querrás tener siempre cerca.</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Explorar catálogo" onPress={openCatalog}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <Ionicons accessible={false} name="leaf-outline" size={18} color={colors.white} />
                <Text style={styles.primaryButtonText}>Explorar catálogo</Text>
                <Ionicons accessible={false} name="arrow-forward" size={18} color={colors.white} />
              </Pressable>
            </View>
          </Reveal>}
        </>}

        <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.footer}>
          <Ionicons name="leaf-outline" size={14} color={colors.primary} /><Text style={styles.footerText}>Cada aroma, un momento para ti.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusPanel({ title, message, busy = false, actionBusy = false, actionLabel, onAction }: {
  title: string; message: string; busy?: boolean; actionBusy?: boolean; actionLabel?: string; onAction?(): void;
}) {
  return <View accessibilityLiveRegion="polite" style={styles.emptyPanel}>
    {busy ? <ActivityIndicator accessibilityLabel={title} color={colors.primary} size="large" />
      : <Ionicons accessible={false} name="heart-outline" size={38} color={colors.primary} />}
    <Text accessibilityRole="header" style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyCopy}>{message}</Text>
    {onAction && <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction}
      accessibilityState={{ disabled: actionBusy, busy: actionBusy }} disabled={actionBusy}
      style={({ pressed }) => [styles.primaryButton, actionBusy && styles.disabled, pressed && styles.pressed]}>
      <Text style={styles.primaryButtonText}>{actionLabel}</Text>
    </Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { alignSelf: 'center', maxWidth: 620, padding: 22, paddingBottom: 30, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 27 },
  brand: { height: 43, width: 148 },
  headerHeart: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderRadius: 23, borderWidth: 1, height: 46, justifyContent: 'center', width: 46 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  title: { color: colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -1.2, marginTop: 6 },
  dot: { color: colors.accent },
  intro: { color: colors.textMuted, fontSize: 14, lineHeight: 22, marginTop: 8 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.6 },
  selectionCard: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 24, flexDirection: 'row', gap: 14, marginTop: 16, overflow: 'hidden', padding: 22 },
  selectionCopy: { flex: 1, minWidth: 0 },
  selectionEyebrow: { color: '#D0E4C9', fontSize: 8, fontWeight: '700', letterSpacing: 1.7 },
  selectionTitle: { color: colors.white, fontSize: 25, fontWeight: '800', letterSpacing: -0.6, lineHeight: 30, marginTop: 8 },
  selectionBody: { color: '#E1EDDD', fontSize: 11, lineHeight: 18, marginTop: 8 },
  selectionSymbol: { alignItems: 'center', backgroundColor: '#286D42', borderColor: '#43885A', borderRadius: 37, borderWidth: 1, height: 74, justifyContent: 'center', width: 74 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 16, marginTop: 28 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  sectionDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 4 },
  countBadge: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderRadius: 16, borderWidth: 1, justifyContent: 'center', minHeight: 32, minWidth: 32, padding: 5 },
  countText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  cards: { gap: 14 },
  secondaryButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 20, minHeight: 50, padding: 15 },
  secondaryButtonText: { color: colors.primaryDark, flexShrink: 1, fontSize: 13, fontWeight: '800' },
  emptyPanel: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 25, borderWidth: 1, marginTop: 22, paddingHorizontal: 23, paddingVertical: 30 },
  emptyIllustration: { alignItems: 'center', height: 122, justifyContent: 'center', marginBottom: 18, width: 136 },
  emptyHalo: { backgroundColor: '#F1F7EC', borderColor: '#E6EFDE', borderRadius: 61, borderWidth: 1, height: 122, position: 'absolute', width: 122 },
  emptyHeart: { alignItems: 'center', backgroundColor: '#E8F2DE', borderRadius: 46, height: 92, justifyContent: 'center', width: 92 },
  emptyLeaf: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, bottom: 4, height: 36, justifyContent: 'center', position: 'absolute', right: 9, width: 36 },
  emptyEyebrow: { color: colors.primary, fontSize: 8, fontWeight: '800', letterSpacing: 1.3, lineHeight: 15, textAlign: 'center' },
  emptyTitle: { color: colors.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.7, lineHeight: 32, marginTop: 9, textAlign: 'center' },
  emptyCopy: { color: colors.textMuted, fontSize: 13, lineHeight: 22, marginBottom: 24, marginTop: 12, textAlign: 'center' },
  primaryButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.primaryDark, borderRadius: 15, flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', minHeight: 52, paddingHorizontal: 13, paddingVertical: 15 },
  primaryButtonText: { color: colors.white, flexShrink: 1, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  refreshButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18, minHeight: 44, paddingVertical: 8 },
  refreshText: { color: colors.primaryDark, flexShrink: 1, fontSize: 12, fontWeight: '700' },
  errorNotice: { alignItems: 'flex-start', backgroundColor: colors.dangerSoft, borderRadius: 14, flexDirection: 'row', gap: 8, marginTop: 18, padding: 13 },
  errorCopy: { color: colors.danger, flex: 1, fontSize: 12, lineHeight: 20 },
  footer: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginTop: 27 },
  footerText: { color: colors.textMuted, flexShrink: 1, fontSize: 10, textAlign: 'center' },
});
