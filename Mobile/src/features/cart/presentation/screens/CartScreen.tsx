import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { Reveal, SoftPressable } from '@/shared/components/Motion';
import { CartItemCard } from '../components/CartItemCard';
import { useCartViewModel } from '../viewModels/useCartViewModel';

export function CartScreen() {
  const vm = useCartViewModel();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 350 || fontScale > 1.25;
  const openCatalog = () => router.navigate('/(tabs)/catalogo');
  const refresh = () => { void vm.refresh(); };
  const needsSession = vm.status === 'anonymous' || vm.status === 'session-expired';
  const recovering = vm.status === 'recovery-error';
  const showCollection = vm.loaded && !needsSession && !recovering;
  async function openSignIn() {
    if (await vm.prepareSignIn()) router.push('/sign-in');
  }

  return <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Reveal>
        <View style={styles.header}>
          <Image accessibilityLabel="INHALEX, el respiro que alivia" resizeMode="contain"
            source={require('../../../../../assets/home/brand.png')} style={styles.brand} />
          <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.headerBag}>
            <Ionicons name="bag-handle-outline" size={22} color={colors.primaryDark} />
          </View>
        </View>
        <Text style={styles.eyebrow}>TU PRÓXIMA PAUSA</Text>
        <Text accessibilityRole="header" style={styles.title}>Tu bolsa<Text style={styles.dot}>.</Text></Text>
        <Text style={styles.intro}>Tus aromas elegidos, un paso más cerca de ti.</Text>

      </Reveal>

      {vm.checkoutLocked && <Text accessibilityLiveRegion="polite" style={styles.notice}>Estamos confirmando tu pedido. Tu bolsa se actualizará al terminar.</Text>}
      {(vm.status === 'error' || vm.loaded && vm.items.length === 0) && !needsSession && !recovering && <Pressable
        accessibilityRole="button" accessibilityLabel="Revisar pedido pendiente"
        onPress={() => router.push('/creacion-pedido')} style={styles.refreshButton}>
        <Ionicons accessible={false} name="receipt-outline" size={18} color={colors.primaryDark} />
        <Text style={styles.refreshText}>Revisar pedido pendiente</Text>
      </Pressable>}

      {needsSession ? <StatusPanel title={vm.status === 'session-expired' ? 'Vuelve a iniciar sesión' : 'Tu selección te espera'}
        message={vm.status === 'session-expired' ? 'Inicia sesión de nuevo para consultar tu bolsa.' : 'Inicia sesión para agregar productos y preparar tu selección.'}
        actionLabel={vm.openingSignIn ? 'Abriendo…' : 'Iniciar sesión'} actionBusy={vm.openingSignIn}
        onAction={() => { void openSignIn(); }} />
        : recovering ? <StatusPanel title="No pudimos comprobar tu sesión" message="Comprueba tu conexión e intenta recuperar tu sesión para consultar la bolsa."
          actionLabel="Reintentar sesión" onAction={() => { void vm.restoreSession(); }} />
        : !vm.loaded && vm.busy ? <StatusPanel title={vm.status === 'checking' ? 'Comprobando tu sesión' : 'Preparando tu bolsa'}
          message="Estamos consultando tu selección." busy />
        : !vm.loaded && vm.status === 'error' ? <StatusPanel title="No pudimos cargar tu bolsa"
          message={vm.error || 'Comprueba tu conexión e inténtalo de nuevo.'} actionLabel="Reintentar" onAction={refresh} /> : null}

      {showCollection && <>
        {(vm.error || vm.mutationError) && <View accessibilityLiveRegion="polite" style={styles.errorNotice}>
          <Text style={styles.errorCopy}>{vm.mutationError || vm.error} Se conservan los últimos datos confirmados. Reintenta para comprobar el estado actual.</Text>
        </View>}
        {vm.notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{vm.notice}</Text>}
        <Pressable accessibilityRole="button" accessibilityLabel={vm.error || vm.mutationError ? 'Reintentar carga de bolsa' : 'Actualizar bolsa'}
          accessibilityState={{ disabled: !vm.canRefresh, busy: vm.refreshing }} disabled={!vm.canRefresh}
          onPress={refresh} style={[styles.refreshButton, !vm.canRefresh && styles.disabled]}>
          {vm.refreshing ? <ActivityIndicator color={colors.primary} /> : <Ionicons accessible={false} name="refresh-outline" size={17} color={colors.primary} />}
          <Text style={styles.refreshText}>{vm.refreshing ? 'Actualizando…' : vm.error || vm.mutationError ? 'Reintentar' : 'Actualizar bolsa'}</Text>
        </Pressable>
      </>}

      {showCollection && (vm.items.length > 0 ? <>
        <Reveal delay={45}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionCopy}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>Una selección para ti</Text>
              <Text style={styles.sectionDescription}>{vm.itemCount} {vm.itemCount === 1 ? 'producto' : 'productos'} · {vm.unitCount} {vm.unitCount === 1 ? 'unidad' : 'unidades'}</Text>
            </View>
            <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.countBadge}>
              <Text style={styles.countText}>{vm.unitCount}</Text>
            </View>
          </View>
          <View style={styles.cards}>{vm.items.map((item) => <CartItemCard key={item.id} item={item} stacked={stacked} canMutate={vm.canMutate}
            onQuantity={(quantity) => { void vm.updateQuantity(item.id, quantity); }}
            onRemove={() => { void vm.remove(item.id); }}
            onOpen={() => router.push({ pathname: '/producto/[id]', params: { id: item.id } })} />)}</View>
        </Reveal>

        <Reveal delay={85}>
          <View style={styles.summary}>
            <View style={styles.summaryHeading}>
              <Text accessibilityRole="header" style={styles.summaryTitle}>Tu selección, en detalle</Text>
              <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                <Ionicons name="receipt-outline" size={20} color={colors.primary} />
              </View>
            </View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>{vm.subtotalLabel}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Envío</Text><Text style={styles.shippingLabel}>Por definir</Text></View>
            <View style={styles.totalRow}>
              <View style={styles.totalCopy}><Text style={styles.totalTitle}>Total de productos</Text><Text style={styles.totalHint}>Solo productos · no incluye envío</Text></View>
              <Text style={styles.totalPrice}>{vm.totalLabel}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Continuar con mi pedido"
              accessibilityState={{ disabled: !vm.canMutate }} disabled={!vm.canMutate}
              onPress={() => router.push('/creacion-pedido')} style={[styles.continueButton, !vm.canMutate && styles.disabled]}>
              <Text style={styles.continueText}>Continuar con mi pedido</Text>
              <Ionicons accessible={false} name="arrow-forward" size={18} color={colors.white} />
            </Pressable>
            <Text style={styles.summaryHint}>Revisa tus productos y tu dirección antes de confirmar.</Text>
          </View>
          <View style={styles.stageNote}>
            <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
            </View>
            <Text style={styles.stageNoteText}>Puedes elegir entre 1 y 25 unidades por producto. Usa Quitar para eliminarlo de tu bolsa.</Text>
          </View>
          <SoftPressable accessibilityRole="button" accessibilityLabel="Explorar catálogo" onPress={openCatalog}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Seguir explorando</Text>
            <Ionicons accessible={false} name="arrow-forward" size={18} color={colors.primaryDark} />
          </SoftPressable>
        </Reveal>
      </> : <Reveal delay={45}>
        <View style={styles.emptyPanel}>
          <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.emptyIllustration}>
            <View style={styles.emptyHalo} />
            <View style={styles.emptyBag}><Ionicons name="bag-handle-outline" size={49} color={colors.primary} /></View>
            <View style={styles.emptyLeaf}><Ionicons name="leaf" size={20} color={colors.primaryDark} /></View>
          </View>
          <Text style={styles.emptyEyebrow}>CADA ELECCIÓN EMPIEZA AQUÍ</Text>
          <Text accessibilityRole="header" style={styles.emptyTitle}>Tu bolsa aún está vacía</Text>
          <Text style={styles.emptyCopy}>Explora nuestra colección y encuentra los aromas que quieres tener cerca.</Text>
          <SoftPressable accessibilityRole="button" accessibilityLabel="Explorar catálogo" onPress={openCatalog}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Ionicons accessible={false} name="leaf-outline" size={18} color={colors.white} />
            <Text style={styles.primaryText}>Explorar catálogo</Text>
            <Ionicons accessible={false} name="arrow-forward" size={18} color={colors.white} />
          </SoftPressable>
        </View>
      </Reveal>)}

      <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.footer}>
        <Ionicons name="leaf-outline" size={14} color={colors.primary} />
        <Text style={styles.footerText}>Cada aroma, un momento para ti.</Text>
      </View>
    </ScrollView>
  </SafeAreaView>;
}

function StatusPanel({ title, message, busy = false, actionBusy = false, actionLabel, onAction }: {
  title: string; message: string; busy?: boolean; actionBusy?: boolean; actionLabel?: string; onAction?(): void;
}) {
  return <View accessibilityLiveRegion="polite" style={styles.emptyPanel}>
    {busy ? <ActivityIndicator accessibilityLabel={title} color={colors.primary} size="large" />
      : <Ionicons accessible={false} name="bag-handle-outline" size={38} color={colors.primary} />}
    <Text accessibilityRole="header" style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyCopy}>{message}</Text>
    {onAction && <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction}
      accessibilityState={{ disabled: actionBusy, busy: actionBusy }} disabled={actionBusy}
      style={[styles.primaryButton, actionBusy && styles.disabled]}><Text style={styles.primaryText}>{actionLabel}</Text></Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  refreshButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 8, marginTop: 18, minHeight: 44, paddingVertical: 8 },
  refreshText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700' },
  errorNotice: { backgroundColor: colors.dangerSoft, borderRadius: 14, marginTop: 18, padding: 13 },
  errorCopy: { color: colors.danger, fontSize: 12, lineHeight: 20 },
  notice: { color: colors.primaryDark, fontSize: 12, lineHeight: 20, marginTop: 18 },
  disabled: { opacity: 0.6 },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { alignSelf: 'center', maxWidth: 620, padding: 22, paddingBottom: 30, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 27 },
  brand: { height: 43, width: 148 },
  headerBag: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderRadius: 23, borderWidth: 1, height: 46, justifyContent: 'center', width: 46 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  title: { color: colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -1.2, marginTop: 6 },
  dot: { color: colors.accent },
  intro: { color: colors.textMuted, fontSize: 14, lineHeight: 22, marginTop: 8 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 16, marginTop: 27 },
  sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  sectionDescription: { color: colors.textMuted, fontSize: 11, lineHeight: 19, marginTop: 4 },
  countBadge: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderRadius: 16, borderWidth: 1, justifyContent: 'center', minHeight: 32, minWidth: 32, padding: 5 },
  countText: { color: colors.primaryDark, fontSize: 12, fontWeight: '800' },
  cards: { gap: 14 },
  summary: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, marginTop: 23, padding: 20 },
  summaryHeading: { alignItems: 'center', flexDirection: 'row', gap: 12, justifyContent: 'space-between', marginBottom: 22 },
  summaryTitle: { color: colors.text, flexShrink: 1, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  summaryRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', marginBottom: 13 },
  summaryLabel: { color: colors.textMuted, flexShrink: 1, fontSize: 12, lineHeight: 20 },
  summaryValue: { color: colors.text, flexShrink: 1, fontSize: 13, fontWeight: '600', lineHeight: 20 },
  shippingLabel: { color: colors.textMuted, flexShrink: 1, fontSize: 12, lineHeight: 20 },
  totalRow: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginBottom: 20, marginTop: 4, paddingTop: 19 },
  totalCopy: { flexShrink: 1 },
  totalTitle: { color: colors.primaryDark, fontSize: 14, fontWeight: '800', lineHeight: 22 },
  totalHint: { color: colors.textMuted, fontSize: 10, lineHeight: 17, marginTop: 2 },
  totalPrice: { color: colors.primaryDark, flexShrink: 1, fontSize: 22, fontWeight: '800', lineHeight: 30 },
  continueButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center', minHeight: 52, padding: 14 },
  continueText: { color: colors.white, flexShrink: 1, fontSize: 12, fontWeight: '800', lineHeight: 21, textAlign: 'center' },
  summaryHint: { color: colors.textMuted, fontSize: 10, lineHeight: 17, marginTop: 11, textAlign: 'center' },
  stageNote: { alignItems: 'flex-start', flexDirection: 'row', gap: 7, marginBottom: 19, marginTop: 17 },
  stageNoteText: { color: colors.textMuted, flex: 1, fontSize: 11, lineHeight: 18 },
  secondaryButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', gap: 10, justifyContent: 'center', minHeight: 50, padding: 15 },
  secondaryText: { color: colors.primaryDark, flexShrink: 1, fontSize: 13, fontWeight: '800' },
  emptyPanel: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 25, borderWidth: 1, marginTop: 22, paddingHorizontal: 23, paddingVertical: 30 },
  emptyIllustration: { alignItems: 'center', height: 122, justifyContent: 'center', marginBottom: 18, width: 136 },
  emptyHalo: { backgroundColor: '#F1F7EC', borderColor: '#E6EFDE', borderRadius: 61, borderWidth: 1, height: 122, position: 'absolute', width: 122 },
  emptyBag: { alignItems: 'center', backgroundColor: '#E8F2DE', borderRadius: 46, height: 92, justifyContent: 'center', width: 92 },
  emptyLeaf: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, bottom: 4, height: 36, justifyContent: 'center', position: 'absolute', right: 9, width: 36 },
  emptyEyebrow: { color: colors.primary, fontSize: 8, fontWeight: '800', letterSpacing: 1.3, lineHeight: 15, textAlign: 'center' },
  emptyTitle: { color: colors.text, fontSize: 25, fontWeight: '800', letterSpacing: -0.7, lineHeight: 32, marginTop: 9, textAlign: 'center' },
  emptyCopy: { color: colors.textMuted, fontSize: 13, lineHeight: 22, marginBottom: 24, marginTop: 12, textAlign: 'center' },
  primaryButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.primaryDark, borderRadius: 15, flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', minHeight: 52, paddingHorizontal: 13, paddingVertical: 15 },
  primaryText: { color: colors.white, flexShrink: 1, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  footer: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginTop: 27 },
  footerText: { color: colors.textMuted, flexShrink: 1, fontSize: 10, textAlign: 'center' },
  pressed: { opacity: 0.75 },
});
