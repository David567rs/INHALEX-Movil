import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AppScreen } from '@/shared/components/AppScreen';
import { SoftPressable } from '@/shared/components/Motion';
import { useOrderTrackingViewModel, formatTrackingDate, formatTrackingPrice,
  type OrderTrackingStep } from '../viewModels/useOrderTrackingViewModel';
import { trackingStyles as styles } from './orderTrackingStyles';

const openHistory = () => router.navigate('/historial-pedidos');

export function OrderTrackingScreen({ orderId }: { orderId: string | null }) {
  const vm = useOrderTrackingViewModel(orderId);
  const order = vm.order;
  const cancelled = order?.status === 'cancelled';
  const gated = vm.status === 'anonymous' || vm.status === 'recovery-error' || vm.status === 'session-expired';
  return <AppScreen title="Seguimiento" eyebrow="Tu pedido, paso a paso" includeBottomInset
    action={<SoftPressable accessibilityRole="button" accessibilityLabel="Volver"
      onPress={() => router.canGoBack() ? router.back() : openHistory()} style={styles.back}>
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
    {vm.status === 'checking' ? <Loading label="Comprobando tu sesión…" /> : gated ? <View style={styles.empty}>
      <DecorativeIcon name="person-circle-outline" />
      <Text accessibilityRole="header" style={styles.emptyTitle}>El recorrido empieza contigo</Text>
      <Text accessibilityLiveRegion="polite" style={styles.emptyCopy}>{vm.error || 'Inicia sesión para consultar el estado de tus pedidos.'}</Text>
      {vm.status === 'recovery-error' ? <Action label="Reintentar sesión" onPress={() => void vm.restoreSession()} />
        : <Action label={vm.openingSignIn ? 'Abriendo…' : 'Iniciar sesión'} disabled={vm.openingSignIn}
          onPress={() => void vm.prepareSignIn().then((ready) => { if (ready) router.push('/sign-in'); })} />}
    </View> : vm.status === 'idle' ? <View style={styles.empty}>
      <DecorativeIcon name="receipt-outline" />
      <Text accessibilityRole="header" style={styles.emptyTitle}>Elige un pedido para seguir su historia</Text>
      <Text style={styles.emptyCopy}>Abre Mis pedidos, selecciona uno y consulta su seguimiento.</Text>
      <Action label="Ver mis pedidos" onPress={openHistory} />
    </View> : vm.status === 'loading' ? <Loading label="Consultando tu pedido…" />
      : vm.status === 'not-found' ? <View style={styles.empty}>
        <DecorativeIcon name="receipt-outline" />
        <Text accessibilityRole="header" style={styles.emptyTitle}>No encontramos este pedido</Text>
        <Text style={styles.emptyCopy}>{vm.error}</Text>
        <Action label="Ver mis pedidos" onPress={openHistory} />
        {vm.canRefresh ? <Action label="Reintentar" onPress={() => void vm.refresh()} secondary /> : null}
      </View> : vm.status === 'error' && !order ? <View style={styles.empty}>
        <DecorativeIcon name="cloud-offline-outline" />
        <Text accessibilityRole="header" style={styles.emptyTitle}>No pudimos cargar el seguimiento</Text>
        <Text accessibilityRole="alert" style={styles.emptyCopy}>{vm.error}</Text>
        {vm.canRefresh ? <Action label="Reintentar" onPress={() => void vm.refresh()} /> : null}
        <Action label="Ver mis pedidos" onPress={openHistory} secondary />
      </View> : order ? <>
        <SoftPressable accessibilityRole="button" accessibilityLabel="Actualizar seguimiento"
          accessibilityState={{ disabled: !vm.canRefresh, busy: vm.refreshing }} disabled={!vm.canRefresh}
          onPress={() => void vm.refresh()} style={[styles.refresh, !vm.canRefresh && styles.disabled]}>
          <Ionicons accessible={false} aria-hidden name="refresh-outline" size={17} color={colors.primary} />
          <Text accessibilityLiveRegion="polite" style={styles.actionLabel}>{vm.refreshing ? 'Actualizando…' : 'Actualizar seguimiento'}</Text>
        </SoftPressable>
        {vm.error ? <View style={styles.notice}>
          <Text accessibilityRole="alert" style={styles.noticeCopy}>{vm.error}</Text>
          <Action label="Reintentar" onPress={() => void vm.refresh()} disabled={!vm.canRefresh} secondary />
        </View> : null}
        <View style={styles.card}>
          <View style={styles.cardHeading}>
            <View style={styles.flexCopy}><Text style={styles.label}>TU PEDIDO</Text>
              <Text style={styles.reference}>{order.reference}</Text></View>
            <View style={[styles.status, cancelled && styles.statusCancelled, order.status === 'pending_review' && styles.statusPending]}>
              <Text accessibilityLiveRegion="polite" style={[styles.statusLabel, cancelled && styles.cancelledText,
                order.status === 'pending_review' && styles.pendingText]}>{vm.statusLabel}</Text>
            </View>
          </View>
          <Text style={styles.date}>Creado el {formatTrackingDate(order.createdAt)}</Text>
          <View style={styles.divider} />
          <Text accessibilityRole="header" style={styles.cardTitle}>Estado del pedido</Text>
          <Text style={styles.body}>Consulta el progreso registrado por INHALEX.</Text>
          <View style={styles.timeline}>{vm.timeline.map((step, index) => <TimelineStep key={step.id} step={step}
            last={index === vm.timeline.length - 1} cancelled={cancelled} />)}</View>
          <Text style={[styles.footnote, cancelled && styles.cancelledText]}>
            {cancelled ? 'El recorrido de este pedido termina aquí.' : order.status === 'completed'
              ? 'El pedido figura como completado.' : 'Consulta la información más reciente con Actualizar seguimiento.'}
          </Text>
        </View>
        <View style={styles.card}>
          <View style={styles.cardHeading}><Text accessibilityRole="header" style={styles.cardTitle}>Tu selección</Text>
            <Text style={styles.label}>{order.unitCount} {order.unitCount === 1 ? 'unidad' : 'unidades'}</Text></View>
          {order.items.map((item) => <View key={item.productId} style={styles.item}>
            <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.itemIcon}>
              <Ionicons name="leaf-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.flexCopy}><Text style={styles.itemName}>{item.productName}</Text>
              <Text style={styles.body}>{item.presentation} · {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}</Text>
              <Text style={styles.body}>{formatTrackingPrice(item.unitPrice)} por unidad</Text>
            </View>
            <Text style={styles.itemPrice}>{formatTrackingPrice(item.subtotal)}</Text>
          </View>)}
          <View style={styles.total}><Text style={styles.totalLabel}>Subtotal de productos</Text>
            <Text style={styles.totalValue}>{formatTrackingPrice(order.subtotal)}</Text></View>
        </View>
        {order.shippingAddress ? <View style={styles.address}>
          <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.addressIcon}>
            <Ionicons name="location-outline" size={21} color={colors.primary} />
          </View>
          <View style={styles.flexCopy}><Text accessibilityRole="header" style={styles.addressTitle}>Dirección de este pedido</Text>
            <Text style={styles.body}>{order.shippingAddress.label} · {order.shippingAddress.recipientName}</Text>
            <Text style={styles.body}>{order.shippingAddress.street} {order.shippingAddress.exteriorNumber}{order.shippingAddress.interiorNumber ? `, Int. ${order.shippingAddress.interiorNumber}` : ''}, {order.shippingAddress.neighborhood}</Text>
            <Text style={styles.body}>{order.shippingAddress.municipality}, {order.shippingAddress.state} · C.P. {order.shippingAddress.postalCode}</Text>
          </View>
        </View> : null}
      </> : null}
    {order ? <SoftPressable accessibilityRole="button" accessibilityLabel="Ver mis pedidos" onPress={openHistory} style={styles.footer}>
      <Text style={styles.actionLabel}>Ver mis pedidos</Text>
      <Ionicons accessible={false} aria-hidden name="arrow-forward-outline" size={17} color={colors.primary} />
    </SoftPressable> : null}
  </AppScreen>;
}

function DecorativeIcon({ name }: { name: 'person-circle-outline' | 'receipt-outline' | 'cloud-offline-outline' }) {
  return <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.emptyIcon}>
    <Ionicons name={name} size={35} color={colors.primary} />
  </View>;
}
function Loading({ label }: { label: string }) {
  return <View accessibilityRole="progressbar" accessibilityLabel={label} style={styles.loading}>
    <ActivityIndicator color={colors.primary} /><Text accessibilityLiveRegion="polite" style={styles.body}>{label}</Text>
  </View>;
}
function Action({ label, onPress, disabled = false, secondary = false }: {
  label: string; onPress: () => void; disabled?: boolean; secondary?: boolean;
}) {
  return <SoftPressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled}
    accessibilityState={{ disabled }} onPress={onPress}
    style={[secondary ? styles.secondaryButton : styles.primaryButton, disabled && styles.disabled]}>
    <Text style={secondary ? styles.actionLabel : styles.primaryLabel}>{label}</Text>
  </SoftPressable>;
}
function TimelineStep({ step, last, cancelled }: { step: OrderTrackingStep; last: boolean; cancelled: boolean }) {
  const current = step.state === 'current';
  const upcoming = step.state === 'upcoming';
  const terminal = current && cancelled;
  return <View style={styles.step}>
    <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.stepRail}>
      <View style={[styles.stepMarker, upcoming && styles.markerUpcoming, current && styles.markerCurrent, terminal && styles.markerCancelled]}>
        <Ionicons name={terminal ? 'close' : upcoming ? 'ellipse-outline' : current ? 'ellipse' : 'checkmark'} size={15}
          color={terminal ? colors.danger : upcoming ? colors.textMuted : current ? colors.primary : colors.white} />
      </View>
      {!last ? <View style={[styles.stepLine, (current || upcoming) && styles.lineUpcoming]} /> : null}
    </View>
    <View style={[styles.stepCopy, last && styles.lastStep]}>
      <Text style={[styles.stepState, terminal && styles.cancelledText]}>{current ? 'Estado actual' : upcoming ? 'Pendiente' : 'Registrado'}</Text>
      <Text style={[styles.stepTitle, upcoming && styles.upcomingText, terminal && styles.cancelledText]}>{step.label}</Text>
      <Text style={styles.body}>{step.description}</Text>
      {step.dateLabel ? <Text style={styles.timestamp}>{step.dateLabel}</Text> : current ? <Text style={styles.footnote}>Fecha de esta etapa no disponible.</Text> : null}
    </View>
  </View>;
}
