import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AppScreen } from '@/shared/components/AppScreen';
import { Reveal, SoftPressable } from '@/shared/components/Motion';
import type { OrderHistoryDetail, OrderHistorySummary } from '../../domain/models/OrderHistory';
import { useOrderHistoryViewModel, formatHistoryDate, formatHistoryPrice, historyStatusLabel,
  type HistoryFilter } from '../viewModels/useOrderHistoryViewModel';

const filters: readonly { id: HistoryFilter; label: string }[] = [
  { id: 'all', label: 'Todos' }, { id: 'in-progress', label: 'En curso' }, { id: 'completed', label: 'Completados' },
];

export function OrderHistoryScreen() {
  const vm = useOrderHistoryViewModel();
  const checking = vm.status === 'checking';
  const gated = vm.status === 'anonymous' || vm.status === 'session-expired' || vm.status === 'recovery-error';
  return <AppScreen title="Mis pedidos" eyebrow="Tu historia con INHALEX" includeBottomInset
    action={<SoftPressable accessibilityRole="button" accessibilityLabel="Volver a Cuenta"
      onPress={() => router.replace('/(tabs)/cuenta')} style={styles.back}>
      <Ionicons accessible={false} aria-hidden name="arrow-back" size={21} color={colors.primaryDark} />
    </SoftPressable>}>
    <Reveal><View style={styles.hero}>
      <View style={styles.heroCopy}>
        <Text style={styles.overline}>HISTORIAL DE PEDIDOS</Text>
        <Text accessibilityRole="header" style={styles.heroTitle}>{'Cada aroma tiene\nsu historia.'}</Text>
        <Text style={styles.heroDescription}>Un lugar para volver a los momentos que elegiste para ti.</Text>
      </View>
      <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.heroIcon}>
        <Ionicons name="receipt-outline" size={29} color={colors.primaryDark} />
      </View>
    </View></Reveal>
    {checking ? <Loading label="Comprobando tu sesión…" /> : gated ? <View style={styles.empty}>
      <Ionicons accessible={false} aria-hidden name="person-circle-outline" size={48} color={colors.primary} />
      <Text accessibilityRole="header" style={styles.emptyTitle}>Tu historia empieza contigo</Text>
      <Text accessibilityLiveRegion="polite" style={styles.emptyCopy}>
        {vm.error || 'Inicia sesión para consultar los pedidos de tu cuenta.'}
      </Text>
      {vm.status === 'recovery-error' ? <Action label="Reintentar sesión" onPress={() => void vm.restoreSession()} />
        : <Action label={vm.openingSignIn ? 'Abriendo…' : 'Iniciar sesión'} disabled={vm.openingSignIn}
          onPress={() => void vm.prepareSignIn().then((ready) => { if (ready) router.push('/sign-in'); })} />}
    </View> : <>
      <SoftPressable accessibilityRole="button" accessibilityLabel="Actualizar historial"
        accessibilityState={{ disabled: !vm.canRefresh, busy: vm.refreshing }} disabled={!vm.canRefresh}
        onPress={() => void vm.refresh()} style={[styles.refresh, !vm.canRefresh && styles.disabled]}>
        <Ionicons accessible={false} aria-hidden name="refresh-outline" size={17} color={colors.primary} />
        <Text accessibilityLiveRegion="polite" style={styles.selectionLabel}>{vm.refreshing ? 'Actualizando…' : 'Actualizar historial'}</Text>
      </SoftPressable>
      {vm.error ? <Notice message={vm.error} disabled={!vm.canRefresh} onRetry={() => void vm.refresh()} /> : null}
      {vm.status === 'loading' ? <Loading label="Consultando tus pedidos…" /> : vm.isEmpty ? <View style={styles.empty}>
        <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.emptyIcon}>
          <Ionicons name="receipt-outline" size={35} color={colors.primary} />
        </View>
        <Text accessibilityRole="header" style={styles.emptyTitle}>Aún no tienes pedidos</Text>
        <Text style={styles.emptyCopy}>Cuando hagas tu primer pedido, su historia comenzará aquí.</Text>
        <Action label="Explorar catálogo" onPress={() => router.push('/(tabs)/catalogo')} />
      </View> : vm.status === 'ready' ? <>
        <View style={styles.sectionHeading}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Tu recorrido</Text>
          <Text style={styles.orderCount}>{vm.totalLoaded} {vm.nextCursor ? 'cargados' : vm.totalLoaded === 1 ? 'pedido' : 'pedidos'}</Text>
        </View>
        <View style={styles.filters}>
          {filters.map((filter) => <SoftPressable key={filter.id} accessibilityRole="button"
            accessibilityLabel={filter.label} accessibilityState={{ selected: vm.filter === filter.id, disabled: vm.busy }}
            aria-pressed={vm.filter === filter.id} disabled={vm.busy} onPress={() => vm.selectFilter(filter.id)}
            style={[styles.filter, vm.filter === filter.id && styles.filterActive]}>
            <Text style={[styles.filterLabel, vm.filter === filter.id && styles.filterLabelActive]}>{filter.label}</Text>
          </SoftPressable>)}
        </View>
        <Text style={styles.ordering}>Del más reciente al más antiguo.{vm.nextCursor ? ' Filtros sobre los pedidos cargados.' : ''}</Text>
        {vm.orders.length ? <View style={styles.orders}>{vm.orders.map((order) => <HistoryCard key={order.id}
          order={order} selected={vm.selectedOrderId === order.id} disabled={vm.busy}
          onSelect={() => void vm.selectOrder(order.id)}
          detail={vm.selectedOrderId === order.id ? vm.detail : null}
          loading={vm.selectedOrderId === order.id && vm.detailLoading}
          error={vm.selectedOrderId === order.id ? vm.detailError : null}
          onRetry={() => void vm.retryDetail()} />)}</View> : <View style={styles.empty}>
          <Text accessibilityRole="header" style={styles.emptyTitle}>No hay pedidos en este filtro</Text>
          <Text style={styles.emptyCopy}>{vm.nextCursor ? 'Puedes cargar más pedidos o consultar todos los que ya están disponibles.' : 'Consulta todos tus pedidos para ver el resto de tu historia.'}</Text>
          <Action label="Ver todos" onPress={() => vm.selectFilter('all')} disabled={vm.busy} />
        </View>}
        {vm.loadMoreError ? <Notice message={vm.loadMoreError} disabled={vm.busy} onRetry={() => void vm.loadMore()} /> : null}
        {vm.nextCursor ? <Action label={vm.loadingMore ? 'Cargando más pedidos…' : 'Cargar más pedidos'}
          disabled={vm.busy} onPress={() => void vm.loadMore()} /> : null}
      </> : null}
    </>}
  </AppScreen>;
}

function Action({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <SoftPressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled}
    accessibilityState={{ disabled }} onPress={onPress} style={[styles.primaryButton, disabled && styles.disabled]}>
    <Text style={styles.primaryLabel}>{label}</Text>
  </SoftPressable>;
}
function Loading({ label }: { label: string }) {
  return <View accessibilityRole="progressbar" accessibilityLabel={label} style={styles.loading}>
    <ActivityIndicator color={colors.primary} /><Text accessibilityLiveRegion="polite" style={styles.emptyCopy}>{label}</Text>
  </View>;
}
function Notice({ message, onRetry, disabled }: { message: string; onRetry: () => void; disabled: boolean }) {
  return <View style={styles.notice}>
    <Text accessibilityRole="alert" style={styles.noticeCopy}>{message}</Text>
    <SoftPressable accessibilityRole="button" accessibilityLabel="Reintentar" disabled={disabled}
      accessibilityState={{ disabled }} onPress={onRetry} style={styles.retry}>
      <Text style={styles.selectionLabel}>Reintentar</Text>
    </SoftPressable>
  </View>;
}
function HistoryCard({ order, selected, disabled, onSelect, detail, loading, error, onRetry }: {
  order: OrderHistorySummary; selected: boolean; disabled: boolean; onSelect: () => void;
  detail: OrderHistoryDetail | null; loading: boolean; error: string | null; onRetry: () => void;
}) {
  const pending = order.status === 'pending_review';
  const cancelled = order.status === 'cancelled';
  return <View style={[styles.card, selected && styles.cardSelected]}>
    <SoftPressable accessibilityRole="button"
      accessibilityLabel={`${selected ? 'Ocultar' : 'Ver'} resumen de ${order.reference}. ${formatHistoryDate(order.createdAt)}. ${historyStatusLabel(order.status)}. Subtotal de productos: ${formatHistoryPrice(order.subtotal)}. ${order.unitCount} ${order.unitCount === 1 ? 'unidad' : 'unidades'}.`}
      accessibilityState={{ expanded: selected, disabled }} aria-expanded={selected} disabled={disabled}
      onPress={onSelect} style={styles.cardButton}>
      <View style={styles.cardTop}>
        <Text style={styles.reference}>{order.reference}</Text>
        <View style={[styles.status, pending && styles.statusPending, cancelled && styles.statusCancelled]}>
          <View style={[styles.statusDot, pending && styles.dotPending, cancelled && styles.dotCancelled]} />
          <Text style={[styles.statusLabel, pending && styles.statusLabelPending, cancelled && styles.statusLabelCancelled]}>{historyStatusLabel(order.status)}</Text>
        </View>
      </View>
      <Text style={styles.date}>{formatHistoryDate(order.createdAt)}</Text>
      <View style={styles.cardSummary}>
        <View style={styles.amountColumn}><Text style={styles.amountLabel}>Subtotal de productos</Text>
          <Text style={styles.amount}>{formatHistoryPrice(order.subtotal)}</Text></View>
        <Text style={styles.units}>{order.unitCount} {order.unitCount === 1 ? 'unidad' : 'unidades'}</Text>
      </View>
      <View style={styles.cardFooter}><Text style={styles.selectionLabel}>{selected ? 'Ocultar resumen' : 'Ver resumen'}</Text>
        <Ionicons accessible={false} aria-hidden name={selected ? 'chevron-up-outline' : 'chevron-down-outline'} size={17} color={colors.primary} />
      </View>
    </SoftPressable>
    {selected ? <View style={styles.details}>
      {loading ? <Loading label="Consultando el resumen…" /> : null}
      {error ? <Notice message={error} onRetry={onRetry} disabled={loading || disabled} /> : null}
      {detail && detail.id === order.id ? <>
        <Text accessibilityRole="header" style={styles.detailsTitle}>Productos del pedido</Text>
        {detail.items.map((item) => <View key={item.productId} style={styles.item}>
          <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.itemIcon}>
            <Ionicons name="leaf-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.itemCopy}><Text style={styles.itemName}>{item.productName}</Text>
            <Text style={styles.itemDescription}>{item.presentation} · {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}</Text>
            <Text style={styles.itemPrice}>{formatHistoryPrice(item.subtotal)}</Text>
          </View>
        </View>)}
        <View style={styles.detailTotal}><Text style={styles.detailTotalLabel}>Subtotal de productos</Text>
          <Text style={styles.detailTotalValue}>{formatHistoryPrice(detail.subtotal)}</Text></View>
        {detail.shippingAddress ? <View style={styles.address}>
          <Text accessibilityRole="header" style={styles.detailsTitle}>Dirección de este pedido</Text>
          <Text style={styles.itemName}>{detail.shippingAddress.label} · {detail.shippingAddress.recipientName}</Text>
          <Text style={styles.itemDescription}>{detail.shippingAddress.street} {detail.shippingAddress.exteriorNumber}{detail.shippingAddress.interiorNumber ? `, Int. ${detail.shippingAddress.interiorNumber}` : ''}, {detail.shippingAddress.neighborhood}</Text>
          <Text style={styles.itemDescription}>{detail.shippingAddress.municipality}, {detail.shippingAddress.state} · C.P. {detail.shippingAddress.postalCode}</Text>
        </View> : null}
        <Action label="Ver seguimiento del pedido" disabled={loading || disabled}
          onPress={() => router.push({ pathname: '/seguimiento-pedido', params: { id: order.id } })} />
      </> : null}
    </View> : null}
  </View>;
}

const styles = StyleSheet.create({
  back: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: 'center', marginLeft: 6, width: 44 },
  hero: { backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 8, marginBottom: 27, overflow: 'hidden', padding: 21 },
  heroCopy: { flex: 1, minWidth: 0 },
  overline: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1.1, lineHeight: 16 },
  heroTitle: { color: colors.primaryDark, fontSize: 24, fontWeight: '800', letterSpacing: -0.7, lineHeight: 30, marginTop: 9 },
  heroDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 20, marginTop: 10 },
  heroIcon: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.background, borderRadius: 19, height: 58, justifyContent: 'center', marginTop: 24, width: 58 },
  refresh: { alignItems: 'center', alignSelf: 'flex-end', flexDirection: 'row', gap: 8, marginBottom: 18, minHeight: 44, padding: 8 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between', marginBottom: 16 },
  sectionTitle: { color: colors.text, flex: 1, fontSize: 19, fontWeight: '800' },
  orderCount: { color: colors.textMuted, fontSize: 11 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  filter: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexGrow: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 10, paddingVertical: 10 },
  filterActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  filterLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  filterLabelActive: { color: colors.white },
  ordering: { color: colors.textMuted, fontSize: 10, lineHeight: 17, marginBottom: 15, marginTop: 12 },
  orders: { gap: 14 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  cardSelected: { borderColor: colors.primary },
  cardButton: { padding: 17 },
  cardTop: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  reference: { color: colors.primaryDark, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
  status: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 8, flexDirection: 'row', gap: 5, paddingHorizontal: 9, paddingVertical: 6 },
  statusPending: { backgroundColor: colors.warningSoft },
  statusCancelled: { backgroundColor: colors.dangerSoft },
  statusDot: { backgroundColor: colors.primary, borderRadius: 3, height: 5, width: 5 },
  dotPending: { backgroundColor: colors.warning },
  dotCancelled: { backgroundColor: colors.danger },
  statusLabel: { color: colors.primaryDark, fontSize: 10, fontWeight: '700' },
  statusLabelPending: { color: '#855000' },
  statusLabelCancelled: { color: colors.danger },
  date: { color: colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: 8 },
  cardSummary: { alignItems: 'flex-end', flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', marginTop: 16 },
  amountColumn: { minWidth: 0 },
  amountLabel: { color: colors.textMuted, fontSize: 10, lineHeight: 17 },
  amount: { color: colors.text, fontSize: 21, fontWeight: '800', letterSpacing: -0.5, lineHeight: 30, marginTop: 2 },
  units: { color: colors.textMuted, fontSize: 11, lineHeight: 20, paddingBottom: 3 },
  cardFooter: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'space-between', marginTop: 16, paddingTop: 13 },
  selectionLabel: { color: colors.primary, flexShrink: 1, fontSize: 11, fontWeight: '700', lineHeight: 18 },
  details: { backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 1, padding: 17 },
  detailsTitle: { color: colors.primaryDark, fontSize: 14, fontWeight: '700', lineHeight: 22, marginBottom: 7 },
  item: { alignItems: 'flex-start', flexDirection: 'row', gap: 11, paddingVertical: 12 },
  itemIcon: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 12, height: 41, justifyContent: 'center', width: 41 },
  itemCopy: { flex: 1, minWidth: 0 },
  itemName: { color: colors.text, fontSize: 13, fontWeight: '700', lineHeight: 21 },
  itemDescription: { color: colors.textMuted, fontSize: 10, lineHeight: 18, marginTop: 1 },
  itemPrice: { color: colors.primaryDark, fontSize: 12, fontWeight: '600', lineHeight: 19, marginTop: 3 },
  detailTotal: { borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'space-between', marginTop: 8, paddingTop: 14 },
  detailTotalLabel: { color: colors.textMuted, fontSize: 11, lineHeight: 19 },
  detailTotalValue: { color: colors.text, fontSize: 13, fontWeight: '800', lineHeight: 19 },
  address: { borderTopColor: colors.border, borderTopWidth: 1, marginTop: 18, paddingTop: 16 },
  empty: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: 1, paddingHorizontal: 22, paddingVertical: 31 },
  emptyIcon: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 24, height: 76, justifyContent: 'center', marginBottom: 21, width: 76 },
  emptyTitle: { color: colors.primaryDark, fontSize: 21, fontWeight: '800', lineHeight: 28, textAlign: 'center' },
  emptyCopy: { color: colors.textMuted, fontSize: 12, lineHeight: 21, marginTop: 12, textAlign: 'center' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 14, justifyContent: 'center', marginTop: 25, minHeight: 50, padding: 14 },
  primaryLabel: { color: colors.white, fontSize: 12, fontWeight: '700' },
  loading: { alignItems: 'center', paddingVertical: 25 },
  notice: { backgroundColor: colors.warningSoft, borderRadius: 14, marginBottom: 16, padding: 14 },
  noticeCopy: { color: colors.text, fontSize: 12, lineHeight: 20 },
  retry: { alignItems: 'center', alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44, paddingHorizontal: 8 },
  disabled: { opacity: 0.55 },
});
