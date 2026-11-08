import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { AppScreen } from '@/shared/components/AppScreen';
import { BackButton } from '@/shared/components/ScreenHeader';
import { ScreenState } from '@/shared/components/ScreenFeedback';
import type { ReadReceiptPreview } from '../../domain/useCases/ReadReceiptPreview';
import { formatReceiptPreviewPrice as price, receiptPreviewScenes,
  useReceiptPreviewViewModel } from '../viewModels/useReceiptPreviewViewModel';
import { receiptPreviewStyles as styles } from './receiptPreviewStyles';

const images = {
  lavanda: require('../../../../../assets/products/lavanda.jpg'),
  menta: require('../../../../../assets/products/menta.jpg'),
};

export function ReceiptPreviewScreen({ readPreview }: { readPreview: ReadReceiptPreview }) {
  const vm = useReceiptPreviewViewModel(readPreview);
  const order = vm.order;
  const confirmed = order?.receiptStatus === 'confirmed';
  const issue = order?.receiptStatus === 'issue_reported';
  return <>
    <AppScreen title="Confirmar recepción" eyebrow="Tus pedidos" includeBottomInset
      action={<BackButton onPress={() => router.canGoBack() ? router.back() : router.navigate('/(tabs)/cuenta')} />}>
      <View style={styles.preview}>
        <View style={styles.previewHeading}>
          <Ionicons accessible={false} name="eye-outline" size={17} color={colors.primary} />
          <Text style={styles.previewTitle}>Vista previa</Text>
        </View>
        <Text style={styles.caption}>Datos de ejemplo. Ninguna acción modifica tus pedidos.</Text>
        <View style={styles.scenes}>
          {receiptPreviewScenes.map((scene) => <Pressable key={scene.id} accessibilityRole="button"
            accessibilityLabel={`Ver ejemplo: ${scene.label}`} accessibilityState={{ selected: vm.scene === scene.id }}
            onPress={() => vm.selectScene(scene.id)}
            style={({ pressed }) => [styles.scene, vm.scene === scene.id && styles.sceneSelected, pressed && styles.pressed]}>
            <Text style={[styles.sceneLabel, vm.scene === scene.id && styles.sceneLabelSelected]}>{scene.label}</Text>
          </Pressable>)}
        </View>
      </View>

      {!order ? <ScreenState icon="cube-outline" title="No hay recepciones pendientes"
        message="Cuando tengas un pedido completado, podrás confirmar aquí que lo recibiste."
        actionLabel="Ver mis pedidos" onAction={() => router.navigate('/historial-pedidos')} /> : <>
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
            <View style={styles.flexCopy}>
              <Text style={styles.label}>PEDIDO DE EJEMPLO</Text>
              <Text selectable style={styles.reference}>{order.reference}</Text>
            </View>
            <View style={[styles.badge, issue && styles.issueBadge]}>
              <Text style={[styles.badgeText, issue && styles.issueText]}>
                {confirmed ? 'Confirmada' : issue ? 'Con incidencia' : 'Por confirmar'}
              </Text>
            </View>
          </View>
          <Text style={styles.caption}>Pedido completado · {order.completedOn}</Text>
          <View style={styles.divider} />
          <View style={styles.selectionHeading}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Tu selección</Text>
            <Text style={styles.caption}>{order.unitCount} unidades</Text>
          </View>
          {order.items.map((item) => <View key={item.id} style={styles.item}>
            <View style={styles.imageFrame}>
              <Image accessible={false} source={images[item.imageKey]} resizeMode="cover" style={styles.image} />
            </View>
            <View style={styles.flexCopy}>
              <Text style={styles.productName}>{item.name}</Text>
              <Text style={styles.caption}>{item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}</Text>
              <Text style={styles.itemPrice}>{price(item.subtotal)}</Text>
            </View>
          </View>)}
          <View style={styles.total}>
            <Text style={styles.caption}>Subtotal de productos</Text>
            <Text style={styles.totalValue}>{price(order.subtotal)}</Text>
          </View>
        </View>

        {confirmed ? <View style={styles.confirmedNote}>
          <Ionicons accessible={false} name="checkmark-circle-outline" size={21} color={colors.primary} />
          <View style={styles.flexCopy}>
            <Text style={styles.noteTitle}>Confirmada el {order.confirmedOn}</Text>
            <Text style={styles.caption}>Ejemplo visual; no se guardó una confirmación real.</Text>
          </View>
        </View> : <>
          <ReceiptButton label="Confirmar recepción" onPress={vm.openDialog} disabled={!vm.canPreviewConfirmation} />
          {!issue ? <Text style={styles.helper}>Si aún no lo recibes, puedes volver más tarde.</Text> : null}
        </>}
        <ReceiptButton label="Volver a mis pedidos" secondary onPress={() => router.navigate('/historial-pedidos')} />
      </>}
    </AppScreen>

    <Modal visible={vm.dialogOpen} transparent animationType="none" onRequestClose={vm.closeDialog}>
      <SafeAreaView style={styles.overlay}>
        <View accessibilityViewIsModal style={styles.dialog}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.dialogContent}>
            <View style={styles.dialogHeading}>
              <View accessible={false} aria-hidden style={styles.dialogIcon}>
                <Ionicons name="cube-outline" size={30} color={colors.primaryDark} />
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar confirmación"
                onPress={vm.closeDialog} style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
                <Ionicons accessible={false} name="close" size={23} color={colors.primaryDark} />
              </Pressable>
            </View>
            <Text style={styles.label}>PEDIDO {order?.reference}</Text>
            <Text accessibilityRole="header" style={styles.dialogTitle}>¿Recibiste todo?</Text>
            <Text style={styles.dialogBody}>Confirma solo cuando tengas todos los productos de este pedido.</Text>
            <View style={styles.dialogSummary}>
              <Text style={styles.caption}>{order?.unitCount} unidades</Text>
              <Text style={styles.itemPrice}>{price(order?.subtotal ?? 0)}</Text>
            </View>
            <Text style={styles.caption}>Esta es una demostración del diseño. Tu pedido real no cambiará.</Text>
            <ReceiptButton label="Sí, recibí mi pedido" onPress={vm.previewConfirmation} />
            <ReceiptButton label="Todavía no" secondary onPress={vm.closeDialog} />
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  </>;
}

function ReceiptButton({ label, onPress, secondary = false, disabled = false }: {
  label: string; onPress(): void; secondary?: boolean; disabled?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress}
    style={({ pressed }) => [secondary ? styles.secondaryButton : styles.primaryButton,
      disabled && styles.disabled, pressed && styles.pressed]}>
    <Text style={secondary ? styles.secondaryLabel : styles.primaryLabel}>{label}</Text>
    {!secondary ? <Ionicons accessible={false} name="checkmark-outline" size={20} color={colors.white} /> : null}
  </Pressable>;
}
