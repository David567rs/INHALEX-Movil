import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { getCatalogImage } from '@/features/catalog/presentation/assets/catalogImages';
import { AppScreen } from '@/shared/components/AppScreen';
import { BackButton } from '@/shared/components/ScreenHeader';
import { FeedbackBanner, LoadingState, ScreenState } from '@/shared/components/ScreenFeedback';
import type { ReceiptOrder } from '../../domain/models/OrderReceipt';
import { formatReceiptDate as date, formatReceiptPrice as price, useOrderReceiptViewModel } from '../viewModels/useOrderReceiptViewModel';
import { orderReceiptStyles as styles } from './orderReceiptStyles';

const receiptLabel = (order: ReceiptOrder) => order.receiptStatus === 'confirmed' ? 'Confirmada'
  : order.receiptStatus === 'issue_reported' ? 'Con incidencia' : 'Por confirmar';
const units = (count: number) => `${count} ${count === 1 ? 'unidad' : 'unidades'}`;

export function OrderReceiptScreen({ developmentPanel, onLeaveForTest }: {
  developmentPanel?: ReactNode;
  onLeaveForTest?: () => void;
} = {}) {
  const vm = useOrderReceiptViewModel();
  const order = vm.order;
  const confirmed = order?.receiptStatus === 'confirmed';
  const issue = order?.receiptStatus === 'issue_reported';
  const gated = vm.status === 'anonymous' || vm.status === 'session-expired' || vm.status === 'recovery-error';
  const openHistory = () => onLeaveForTest ? onLeaveForTest() : router.navigate('/historial-pedidos');
  return <>
    <AppScreen title="Confirmar recepción" eyebrow="Tus pedidos" includeBottomInset
      action={<BackButton onPress={() => order && !vm.busy ? vm.selectOrder(null)
        : onLeaveForTest ? onLeaveForTest() : router.canGoBack() ? router.back() : router.navigate('/(tabs)/cuenta')} />}>
      {__DEV__ ? developmentPanel : null}
      {vm.status === 'checking' ? <LoadingState label="Comprobando tu sesión…" /> : gated ? <>
        <ScreenState icon="person-circle-outline" title="Tus pedidos, contigo"
          message={vm.error || 'Inicia sesión para consultar y confirmar la recepción de tus pedidos.'}
          actionLabel={vm.openingSignIn ? 'Abriendo…' : 'Iniciar sesión'} actionBusy={vm.openingSignIn}
          onAction={() => void vm.prepareSignIn().then((ready) => { if (ready) router.push('/sign-in'); })} />
        {vm.status === 'recovery-error' ? <ReceiptButton label="Reintentar sesión" secondary onPress={() => void vm.restoreSession()} /> : null}
      </> : <>
        {vm.status === 'loading' ? <LoadingState label="Consultando tus recepciones…" /> : <ReceiptButton
          label={vm.refreshing ? 'Actualizando…' : 'Actualizar recepciones'} secondary busy={vm.refreshing}
          disabled={!vm.canRefresh} onPress={() => void vm.refresh()} />}
        {vm.error || vm.confirmError ? <FeedbackBanner message={vm.error || vm.confirmError!}
          retryLabel={vm.confirmError ? 'Verificar recepción' : 'Reintentar'} disabled={!vm.canRefresh}
          busy={vm.refreshing} onRetry={() => void vm.refresh()} /> : null}
        {vm.requiresRefresh && !vm.error && !vm.confirmError ? <FeedbackBanner tone="info"
          message="Verifica el estado del pedido antes de confirmar su recepción."
          retryLabel="Verificar recepción" disabled={!vm.canRefresh} busy={vm.refreshing}
          onRetry={() => void vm.refresh()} /> : null}
        {vm.notice ? <FeedbackBanner message={vm.notice} tone="success" /> : null}

        {order ? <>
          {vm.orders && vm.orders.length > 1 ? <ReceiptButton label="Elegir otro pedido" secondary disabled={vm.busy}
            onPress={() => vm.selectOrder(null)} /> : null}
          <View style={[styles.intro, issue && styles.issueIntro]}>
            <View accessible={false} aria-hidden style={styles.introIcon}>
              <Ionicons name={confirmed ? 'checkmark-done-outline' : issue ? 'chatbubble-ellipses-outline' : 'cube-outline'}
                size={30} color={colors.primaryDark} />
            </View>
            <View style={styles.flexCopy}>
              <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={styles.introTitle}>
                {confirmed ? 'Recepción confirmada' : issue ? 'Tu incidencia está registrada' : '¿Ya recibiste tu pedido?'}
              </Text>
              <Text style={styles.body}>{confirmed ? 'Gracias por confirmar que llegó a tus manos.'
                : issue ? 'La confirmación no está disponible mientras este pedido tiene una incidencia.'
                  : 'Revisa tu selección antes de confirmar que llegó completa.'}</Text>
            </View>
          </View>
          <View style={styles.card}>
            <View style={styles.orderHeading}>
              <View style={styles.flexCopy}><Text style={styles.label}>TU PEDIDO</Text>
                <Text selectable style={styles.reference}>{order.reference}</Text></View>
              <ReceiptBadge order={order} />
            </View>
            <Text style={styles.caption}>Pedido completado · {date(order.completedAt)}</Text>
            <View style={styles.divider} />
            <View style={styles.selectionHeading}><Text accessibilityRole="header" style={styles.sectionTitle}>Tu selección</Text>
              <Text style={styles.caption}>{units(order.totalItems)}</Text></View>
            {order.items.map((item) => <View key={item.id} style={styles.item}>
              <ReceiptImage imageUrl={item.imageUrl} />
              <View style={styles.flexCopy}>
                <Text style={styles.productName}>{item.name}</Text>
                {item.presentation ? <Text style={styles.caption}>{item.presentation}</Text> : null}
                <Text style={styles.caption}>{units(item.quantity)}</Text>
                <Text style={styles.itemPrice}>{price(item.subtotal)}</Text>
              </View>
            </View>)}
            <View style={styles.total}><Text style={styles.caption}>Subtotal de productos</Text>
              <Text style={styles.totalValue}>{price(order.subtotal)}</Text></View>
          </View>
          {confirmed ? <View style={styles.confirmedNote}>
            <Ionicons accessible={false} name="checkmark-circle-outline" size={21} color={colors.primary} />
            <View style={styles.flexCopy}><Text style={styles.noteTitle}>
              {order.confirmedAt ? `Confirmada el ${date(order.confirmedAt)}` : 'Tu recepción quedó registrada'}
            </Text></View>
          </View> : <>
            <ReceiptButton label={vm.confirming ? 'Confirmando…' : 'Confirmar recepción'} busy={vm.confirming}
              onPress={vm.openDialog} disabled={!vm.canConfirm} />
            {!issue ? <Text style={styles.helper}>{vm.requiresRefresh ? 'Verifica la recepción para saber si tu confirmación quedó guardada.'
              : 'Si aún no lo recibes, puedes volver más tarde.'}</Text> : null}
          </>}
          <ReceiptButton label={onLeaveForTest ? 'Salir de la prueba' : 'Volver a mis pedidos'} secondary onPress={openHistory} />
        </> : vm.orders ? vm.orders.length === 0 ? <ScreenState icon="cube-outline" title="No hay recepciones disponibles"
          message="Cuando tengas un pedido completado, podrás confirmar aquí que lo recibiste."
          actionLabel="Ver mis pedidos" onAction={openHistory} /> : <>
          <Text accessibilityRole="header" style={styles.listHeading}>Elige tu pedido</Text>
          <Text style={styles.listNote}>Hasta 12 pedidos completados de tu cuenta.</Text>
          {vm.orders.map((item) => <Pressable key={item.id} accessibilityRole="button"
            accessibilityLabel={`Abrir pedido ${item.reference}. Recepción ${receiptLabel(item).toLowerCase()}. ${units(item.totalItems)}. ${price(item.subtotal)}`}
            accessibilityState={{ disabled: !vm.canSelect }} disabled={!vm.canSelect} onPress={() => vm.selectOrder(item.id)}
            style={({ pressed }) => [styles.listRow, pressed && styles.pressed, !vm.canSelect && styles.disabled]}>
            <View style={styles.orderHeading}><Text style={[styles.reference, styles.flexCopy]}>{item.reference}</Text><ReceiptBadge order={item} /></View>
            <Text style={styles.caption}>{date(item.completedAt)} · {units(item.totalItems)}</Text>
            <View style={styles.listFooter}><Text style={styles.itemPrice}>{price(item.subtotal)}</Text>
              <Text style={styles.link}>Ver recepción →</Text></View>
          </Pressable>)}
        </> : null}
      </>}
    </AppScreen>

    <Modal visible={vm.dialogOpen} transparent animationType="none" onRequestClose={vm.closeDialog}>
      <SafeAreaView style={styles.overlay}>
        <View accessibilityViewIsModal style={styles.dialog}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.dialogContent}>
            <View style={styles.dialogHeading}>
              <View accessible={false} aria-hidden style={styles.dialogIcon}><Ionicons name="cube-outline" size={30} color={colors.primaryDark} /></View>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar confirmación" onPress={vm.closeDialog}
                style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
                <Ionicons accessible={false} name="close" size={23} color={colors.primaryDark} />
              </Pressable>
            </View>
            <Text style={styles.label}>PEDIDO {order?.reference}</Text>
            <Text accessibilityRole="header" style={styles.dialogTitle}>¿Recibiste todo?</Text>
            <Text style={styles.dialogBody}>Confirma solo cuando tengas todos los productos de este pedido.</Text>
            <View style={styles.dialogSummary}><Text style={styles.caption}>{units(order?.totalItems ?? 0)}</Text>
              <Text style={styles.itemPrice}>{price(order?.subtotal ?? 0)}</Text></View>
            <ReceiptButton label="Sí, recibí mi pedido" disabled={!vm.canConfirm} onPress={vm.confirmReceipt} />
            <ReceiptButton label="Todavía no" secondary onPress={vm.closeDialog} />
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  </>;
}

function ReceiptBadge({ order }: { order: ReceiptOrder }) {
  const issue = order.receiptStatus === 'issue_reported';
  return <View style={[styles.badge, issue && styles.issueBadge]}>
    <Text style={[styles.badgeText, issue && styles.issueText]}>{receiptLabel(order)}</Text>
  </View>;
}
function ReceiptImage({ imageUrl }: { imageUrl: string | null }) {
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const source = imageUrl !== failedImage ? getCatalogImage(imageUrl) : null;
  return <View style={styles.imageFrame}>{source ? <Image accessible={false} source={source} resizeMode="cover"
    onError={() => setFailedImage(imageUrl)} style={styles.image} /> : <View style={styles.photoFallback}>
      <Ionicons accessible={false} name="leaf-outline" size={24} color={colors.primary} />
    </View>}</View>;
}
function ReceiptButton({ label, onPress, secondary = false, disabled = false, busy = false }: {
  label: string; onPress(): void; secondary?: boolean; disabled?: boolean; busy?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: disabled || busy, busy }}
    disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => [secondary ? styles.secondaryButton : styles.primaryButton,
      (disabled || busy) && styles.disabled, pressed && styles.pressed]}>
    {busy ? <ActivityIndicator accessible={false} size="small" color={secondary ? colors.primaryDark : colors.white} /> : null}
    <Text style={secondary ? styles.secondaryLabel : styles.primaryLabel}>{label}</Text>
    {!secondary && !busy ? <Ionicons accessible={false} name="checkmark-outline" size={20} color={colors.white} /> : null}
  </Pressable>;
}
