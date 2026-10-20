import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AppScreen } from '@/shared/components/AppScreen';
import { SoftPressable } from '@/shared/components/Motion';
import type { OrderTrackingPreviewScenario, OrderTrackingPreviewStep } from '../../domain/models/OrderTrackingPreview';
import type { LoadOrderTrackingPreview } from '../../domain/useCases/loadOrderTrackingPreview';
import { useOrderTrackingPreviewViewModel } from '../viewModels/useOrderTrackingPreviewViewModel';

const scenes: readonly { id: OrderTrackingPreviewScenario; label: string }[] = [
  { id: 'pending_review', label: 'En revisión' }, { id: 'confirmed', label: 'Confirmado' },
  { id: 'completed', label: 'Completado' }, { id: 'cancelled', label: 'Cancelado' },
  { id: 'not-found', label: 'No encontrado' }, { id: 'connection-error', label: 'Sin conexión' },
];

export function OrderTrackingPreviewScreen({ loadPreview }: { loadPreview: LoadOrderTrackingPreview }) {
  const vm = useOrderTrackingPreviewViewModel(loadPreview);
  const order = vm.state.status === 'ready' ? vm.state.order : null;
  const cancelled = order?.status === 'cancelled';
  return <AppScreen title="Seguimiento" eyebrow="Tu pedido, paso a paso" includeBottomInset
    action={<SoftPressable accessibilityRole="button" accessibilityLabel="Volver a Cuenta"
      onPress={() => router.replace('/(tabs)/cuenta')} style={styles.back}>
      <Ionicons accessible={false} aria-hidden name="arrow-back" size={21} color={colors.primaryDark} />
    </SoftPressable>}>
    <View style={styles.hero}>
      <View style={styles.heroCopy}>
        <Text style={styles.overline}>SEGUIMIENTO DEL PEDIDO</Text>
        <Text accessibilityRole="header" style={styles.heroTitle}>{'Tu selección,\npaso a paso.'}</Text>
        <Text style={styles.heroDescription}>Cada estado, en un solo lugar.</Text>
      </View>
      <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.heroIcon}>
        <Ionicons name="git-branch-outline" size={29} color={colors.primaryDark} />
      </View>
    </View>
    <View style={styles.previewBadge}>
      <Ionicons accessible={false} aria-hidden name="sparkles-outline" size={14} color={colors.primary} />
      <Text style={styles.previewLabel}>Vista previa · Datos de ejemplo</Text>
    </View>
    <Text style={styles.previewCopy}>Elige una escena para revisar el diseño. Estas muestras no pertenecen a tu cuenta.</Text>
    <Text accessibilityRole="header" style={styles.sectionTitle}>Explora los estados</Text>
    <View style={styles.scenes}>
      {scenes.map((scene) => <Pressable key={scene.id} accessibilityRole="button"
        accessibilityLabel={`Mostrar ejemplo: ${scene.label}`} accessibilityState={{ selected: vm.scenario === scene.id }}
        aria-pressed={vm.scenario === scene.id} onPress={() => vm.showScenario(scene.id)}
        style={({ pressed }) => [styles.scene, vm.scenario === scene.id && styles.sceneActive, pressed && styles.pressed]}>
        <Text style={[styles.sceneLabel, vm.scenario === scene.id && styles.sceneLabelActive]}>{scene.label}</Text>
      </Pressable>)}
    </View>
    {vm.notice ? <View style={styles.notice}><Text accessibilityLiveRegion="polite" style={styles.noticeCopy}>{vm.notice}</Text></View> : null}
    {order ? <>
      <SoftPressable accessibilityRole="button" accessibilityLabel="Actualizar ejemplo" onPress={vm.refreshPreview} style={styles.refresh}>
        <Ionicons accessible={false} aria-hidden name="refresh-outline" size={17} color={colors.primary} />
        <Text style={styles.actionLabel}>Actualizar ejemplo</Text>
      </SoftPressable>
      <View style={styles.card}>
        <View style={styles.cardHeading}>
          <View style={styles.flexCopy}><Text style={styles.label}>PEDIDO DE EJEMPLO</Text>
            <Text style={styles.reference}>{order.reference}</Text></View>
          <View style={[styles.status, cancelled && styles.statusCancelled, order.status === 'pending_review' && styles.statusPending]}>
            <Text style={[styles.statusLabel, cancelled && styles.cancelledText, order.status === 'pending_review' && styles.pendingText]}>{order.statusLabel}</Text>
          </View>
        </View>
        <Text style={styles.date}>Creado el {order.dateLabel}</Text>
        <View style={styles.divider} />
        <Text accessibilityRole="header" style={styles.cardTitle}>Estado del pedido</Text>
        <Text style={styles.body}>Así se presenta el progreso de esta muestra.</Text>
        <View style={styles.timeline}>{order.timeline.map((step, index) => <TimelineStep key={step.id} step={step}
          last={index === order.timeline.length - 1} cancelled={cancelled} />)}</View>
        {cancelled ? <Text style={[styles.footnote, styles.cancelledText]}>El recorrido de este ejemplo termina aquí.</Text>
          : <Text style={styles.footnote}>Las etapas pendientes aún no han ocurrido en este ejemplo.</Text>}
      </View>
      <View style={styles.card}>
        <View style={styles.cardHeading}><Text accessibilityRole="header" style={styles.cardTitle}>Tu selección</Text>
          <Text style={styles.label}>{order.unitCount} unidades</Text></View>
        {order.items.map((item) => <View key={item.id} style={styles.item}>
          <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.itemIcon}>
            <Ionicons name="leaf-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.flexCopy}><Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.body}>{item.presentation} · {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}</Text>
            <Text style={styles.body}>{vm.formatPrice(item.unitPrice)} por unidad</Text>
          </View>
          <Text style={styles.itemPrice}>{vm.formatPrice(item.lineTotal)}</Text>
        </View>)}
        <View style={styles.total}><Text style={styles.totalLabel}>Subtotal de productos</Text>
          <Text style={styles.totalValue}>{vm.formatPrice(order.subtotal)}</Text></View>
      </View>
      {order.address ? <View style={styles.address}>
        <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.addressIcon}>
          <Ionicons name="location-outline" size={21} color={colors.primary} />
        </View>
        <View style={styles.flexCopy}><Text accessibilityRole="header" style={styles.addressTitle}>{order.address.label}</Text>
          <Text style={styles.body}>{order.address.recipientName}</Text>
          {order.address.lines.map((line) => <Text key={line} style={styles.body}>{line}</Text>)}
        </View>
      </View> : null}
    </> : vm.state.status !== 'ready' ? <View style={styles.empty}>
      <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.emptyIcon}>
        <Ionicons name={vm.state.status === 'not-found' ? 'receipt-outline' : 'cloud-offline-outline'} size={35} color={colors.primary} />
      </View>
      <Text accessibilityRole="header" style={styles.emptyTitle}>{vm.state.title}</Text>
      <Text style={styles.emptyCopy}>{vm.state.message}</Text>
      <Action label={vm.state.status === 'not-found' ? 'Mostrar un ejemplo' : 'Reintentar ejemplo'} onPress={vm.retryPreview} />
    </View> : null}
    <SoftPressable accessibilityRole="button" accessibilityLabel="Volver a Cuenta" onPress={() => router.replace('/(tabs)/cuenta')} style={styles.footer}>
      <Text style={styles.actionLabel}>Volver a Cuenta</Text>
      <Ionicons accessible={false} aria-hidden name="arrow-forward-outline" size={17} color={colors.primary} />
    </SoftPressable>
  </AppScreen>;
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return <SoftPressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.primaryButton}>
    <Text style={styles.primaryLabel}>{label}</Text>
  </SoftPressable>;
}

function TimelineStep({ step, last, cancelled }: { step: OrderTrackingPreviewStep; last: boolean; cancelled: boolean }) {
  const current = step.state === 'current';
  const upcoming = step.state === 'upcoming';
  const terminal = current && cancelled;
  const stateLabel = current ? 'Estado actual' : upcoming ? 'Pendiente' : 'Etapa anterior';
  return <View style={styles.step}>
    <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.stepRail}>
      <View style={[styles.stepMarker, upcoming && styles.markerUpcoming, current && styles.markerCurrent, terminal && styles.markerCancelled]}>
        <Ionicons name={terminal ? 'close' : upcoming ? 'ellipse-outline' : current ? 'ellipse' : 'checkmark'} size={15}
          color={terminal ? colors.danger : upcoming ? colors.textMuted : current ? colors.primary : colors.white} />
      </View>
      {!last ? <View style={[styles.stepLine, (current || upcoming) && styles.lineUpcoming]} /> : null}
    </View>
    <View style={[styles.stepCopy, last && styles.lastStep]}>
      <Text style={[styles.stepState, terminal && styles.cancelledText]}>{stateLabel}</Text>
      <Text style={[styles.stepTitle, upcoming && styles.upcomingText, terminal && styles.cancelledText]}>{step.label}</Text>
      <Text style={styles.body}>{step.description}</Text>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  back: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: 'center', marginLeft: 6, width: 44 },
  hero: { backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 8, marginBottom: 20, padding: 20 },
  heroCopy: { flex: 1, minWidth: 0 },
  overline: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 1, lineHeight: 16 },
  heroTitle: { color: colors.primaryDark, fontSize: 27, fontWeight: '800', letterSpacing: -0.7, lineHeight: 34, marginTop: 9 },
  heroDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 20, marginTop: 10 },
  heroIcon: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.background, borderRadius: 19, height: 56, justifyContent: 'center', marginTop: 24, width: 56 },
  previewBadge: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.surfaceSoft, borderRadius: 9, flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 9 },
  previewLabel: { color: colors.primaryDark, flexShrink: 1, fontSize: 10, fontWeight: '700', lineHeight: 17 },
  previewCopy: { color: colors.textMuted, fontSize: 11, lineHeight: 19, marginBottom: 24, marginTop: 9 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '800', lineHeight: 26, marginBottom: 12 },
  scenes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  scene: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexBasis: '45%', flexGrow: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 9, paddingVertical: 11 },
  sceneActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  sceneLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', lineHeight: 18, textAlign: 'center' },
  sceneLabelActive: { color: colors.white },
  pressed: { opacity: 0.75 },
  refresh: { alignItems: 'center', alignSelf: 'flex-end', flexDirection: 'row', gap: 7, marginBottom: 12, minHeight: 44, padding: 8 },
  actionLabel: { color: colors.primary, fontSize: 12, fontWeight: '700', lineHeight: 20 },
  notice: { backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderRadius: 12, borderWidth: 1, marginBottom: 14, padding: 12 },
  noticeCopy: { color: colors.primaryDark, fontSize: 11, lineHeight: 19 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, marginBottom: 16, padding: 18 },
  cardHeading: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  flexCopy: { flex: 1, minWidth: 0 },
  label: { color: colors.textMuted, fontSize: 10, fontWeight: '600', lineHeight: 17 },
  reference: { color: colors.primaryDark, fontSize: 17, fontWeight: '800', lineHeight: 25, marginTop: 4 },
  status: { backgroundColor: colors.surfaceSoft, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 },
  statusCancelled: { backgroundColor: colors.dangerSoft },
  statusPending: { backgroundColor: colors.warningSoft },
  statusLabel: { color: colors.primaryDark, fontSize: 10, fontWeight: '700', lineHeight: 17 },
  cancelledText: { color: colors.danger },
  pendingText: { color: '#855000' },
  date: { color: colors.textMuted, fontSize: 11, lineHeight: 19, marginTop: 12 },
  divider: { backgroundColor: colors.border, height: 1, marginVertical: 19 },
  cardTitle: { color: colors.primaryDark, fontSize: 16, fontWeight: '800', lineHeight: 24 },
  body: { color: colors.textMuted, fontSize: 11, lineHeight: 19, marginTop: 3 },
  timeline: { marginTop: 22 },
  step: { flexDirection: 'row', gap: 12 },
  stepRail: { alignItems: 'center', width: 27 },
  stepMarker: { alignItems: 'center', backgroundColor: colors.primary, borderColor: colors.primary, borderRadius: 14, borderWidth: 1, height: 27, justifyContent: 'center', width: 27 },
  markerUpcoming: { backgroundColor: colors.background, borderColor: colors.border },
  markerCurrent: { backgroundColor: colors.surfaceSoft, borderColor: colors.primary },
  markerCancelled: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  stepLine: { backgroundColor: colors.primary, flex: 1, marginVertical: 5, minHeight: 26, width: 2 },
  lineUpcoming: { backgroundColor: colors.border },
  stepCopy: { flex: 1, minWidth: 0, paddingBottom: 25 },
  lastStep: { paddingBottom: 0 },
  stepState: { color: colors.primary, fontSize: 9, fontWeight: '800', letterSpacing: 0.4, lineHeight: 16 },
  stepTitle: { color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 23 },
  upcomingText: { color: colors.textMuted },
  footnote: { color: colors.textMuted, fontSize: 10, lineHeight: 18, marginTop: 18 },
  item: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 17 },
  itemIcon: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 12, height: 40, justifyContent: 'center', width: 40 },
  itemName: { color: colors.text, fontSize: 13, fontWeight: '700', lineHeight: 21 },
  itemPrice: { color: colors.primaryDark, fontSize: 12, fontWeight: '700', lineHeight: 21 },
  total: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', paddingTop: 16 },
  totalLabel: { color: colors.textMuted, fontSize: 11, lineHeight: 19 },
  totalValue: { color: colors.text, fontSize: 20, fontWeight: '800', lineHeight: 29 },
  address: { backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, padding: 17 },
  addressIcon: { paddingTop: 2 },
  addressTitle: { color: colors.primaryDark, fontSize: 13, fontWeight: '700', lineHeight: 21 },
  empty: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: 1, paddingHorizontal: 21, paddingVertical: 30 },
  emptyIcon: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 24, height: 76, justifyContent: 'center', marginBottom: 20, width: 76 },
  emptyTitle: { color: colors.primaryDark, fontSize: 21, fontWeight: '800', lineHeight: 29, textAlign: 'center' },
  emptyCopy: { color: colors.textMuted, fontSize: 12, lineHeight: 21, marginTop: 12, textAlign: 'center' },
  primaryButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 14, justifyContent: 'center', marginTop: 24, minHeight: 50, padding: 14 },
  primaryLabel: { color: colors.white, fontSize: 12, fontWeight: '700', lineHeight: 20 },
  footer: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 17, minHeight: 50, padding: 12 },
});
