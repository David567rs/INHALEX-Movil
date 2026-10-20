import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { getCatalogImage } from '@/features/catalog/presentation/assets/catalogImages';
import { Reveal } from '@/shared/components/Motion';
import type { OrderContactField } from '../../domain/models/OrderCreation';
import { useOrderCreationViewModel } from '../viewModels/useOrderCreationViewModel';

type ViewModel = ReturnType<typeof useOrderCreationViewModel>;
const statusLabels = { pending_review: 'En revisión', confirmed: 'Confirmado', completed: 'Completado', cancelled: 'Cancelado' } as const;
const fields: readonly { key: OrderContactField; label: string; maxLength: number; keyboardType: 'default' | 'email-address' | 'phone-pad' }[] = [
  { key: 'customerName', label: 'Nombre de contacto', maxLength: 120, keyboardType: 'default' },
  { key: 'customerEmail', label: 'Correo electrónico', maxLength: 120, keyboardType: 'email-address' },
  { key: 'customerPhone', label: 'Teléfono de contacto', maxLength: 15, keyboardType: 'phone-pad' },
  { key: 'notes', label: 'Notas del pedido (opcional)', maxLength: 600, keyboardType: 'default' },
];

export function OrderCreationScreen() {
  const vm = useOrderCreationViewModel();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 350 || fontScale > 1.25;
  const needsSession = vm.status === 'anonymous' || vm.status === 'expired';
  function returnToBag() {
    if (router.canGoBack()) router.back(); else router.replace('/(tabs)/bolsa');
  }
  async function signIn() { if (await vm.prepareSignIn()) router.push('/sign-in'); }

  return <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver a Bolsa" onPress={returnToBag}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons accessible={false} name="arrow-back" size={21} color={colors.primaryDark} />
          </Pressable>
          <Image accessibilityLabel="INHALEX, el respiro que alivia" resizeMode="contain"
            source={require('../../../../../assets/home/brand.png')} style={styles.brand} />
        </View>
        <Reveal>
          <Text style={styles.eyebrow}>CREACIÓN DE PEDIDO</Text>
          <Text accessibilityRole="header" style={styles.title}>{vm.receipt ? 'Tu pedido' : 'Revisa tu pedido'}<Text style={styles.dot}>.</Text></Text>
          <Text style={styles.intro}>{vm.receipt ? 'Un paso más cerca de tu próxima pausa.' : 'Cada detalle cuenta para tu próxima pausa.'}</Text>
        </Reveal>

        {needsSession ? <StatusPanel title={vm.status === 'expired' ? 'Vuelve a iniciar sesión' : 'Tu pedido empieza contigo'}
          copy="Inicia sesión para consultar tu bolsa y elegir una dirección de envío."
          action={vm.openingSignIn ? 'Abriendo…' : 'Iniciar sesión'} busy={vm.openingSignIn} onAction={() => { void signIn(); }} />
          : vm.status === 'recovery-error' ? <StatusPanel title="No pudimos comprobar tu sesión"
            copy="Revisa tu conexión e intenta recuperar la sesión." action="Reintentar sesión" onAction={() => { void vm.restoreSession(); }} />
          : vm.status === 'checking' ? <StatusPanel title="Comprobando tu sesión" copy="Estamos preparando el siguiente paso." busy />
          : vm.receipt ? <Receipt vm={vm} onReturn={returnToBag} />
          : vm.uncertain ? <StatusPanel title="La confirmación está pendiente"
            copy="La solicitud pudo llegar a INHALEX. Reintentaremos la misma confirmación para evitar registrar el pedido dos veces."
            message={vm.message} action={vm.recovering ? 'Recuperando…' : 'Reintentar confirmación'} busy={vm.recovering}
            onAction={() => { void vm.retryConfirmation(); }} />
          : <>
            {vm.message && <View accessibilityLiveRegion="polite" style={styles.notice}><Text style={styles.noticeCopy}>{vm.message}</Text></View>}
            <Pressable accessibilityRole="button" accessibilityLabel={vm.requiresRefresh ? 'Reintentar resumen del pedido' : 'Actualizar resumen del pedido'}
              accessibilityState={{ disabled: vm.busy, busy: vm.loading }} disabled={vm.busy}
              onPress={() => { void vm.refresh(); }} style={({ pressed }) => [styles.refreshButton, vm.busy && styles.disabled, pressed && styles.pressed]}>
              {vm.loading ? <ActivityIndicator color={colors.primary} size="small" /> : <Ionicons accessible={false} name="refresh-outline" size={17} color={colors.primaryDark} />}
              <Text style={styles.refreshText}>{vm.loading ? 'Actualizando…' : vm.requiresRefresh ? 'Reintentar' : 'Actualizar resumen'}</Text>
            </Pressable>
            {!vm.context ? vm.loading ? <StatusPanel title="Preparando tu pedido" copy="Consultamos tu bolsa, tus direcciones y la disponibilidad actual." busy /> : null
              : vm.context.cart.items.length === 0 ? <StatusPanel title="Tu pedido empieza en la bolsa"
                copy="Elige tus aromas favoritos antes de preparar tu pedido." action="Explorar catálogo"
                onAction={() => router.navigate('/(tabs)/catalogo')} />
              : <>
                {vm.quote && <Reveal>
                  <SectionHeading number="01" title="Tu selección" detail={`${vm.itemCount} ${vm.itemCount === 1 ? 'producto' : 'productos'} · ${vm.unitCount} ${vm.unitCount === 1 ? 'unidad' : 'unidades'}`} />
                  <View style={styles.products}>{vm.items.map((item) => <OrderItem key={`${item.productId}:${item.image}`} item={item} stacked={stacked} />)}</View>
                  {vm.quote.issues.length > 0 && <View accessibilityLiveRegion="polite" style={styles.issues}>
                    <Text accessibilityRole="header" style={styles.issueHeading}>Revisa la disponibilidad</Text>
                    {vm.quote.issues.map((issue, index) => <View key={`${issue.code}:${issue.productId}:${index}`} style={styles.issue}>
                      <Text style={styles.issueTitle}>{issue.title}</Text><Text style={styles.issueCopy}>{issue.description}</Text>
                    </View>)}
                  </View>}
                  {vm.quote.items.length === 0 && <Text style={styles.intro}>Los productos de tu bolsa no están disponibles para este pedido. Revisa tu selección en Bolsa.</Text>}
                  {vm.quote.needsManualReview && <Text style={styles.help}>Este pedido requiere una revisión de disponibilidad por parte de INHALEX.</Text>}
                </Reveal>}

                <Reveal delay={35}>
                  <SectionHeading number="02" title="Dirección de envío" detail="Elige dónde quieres recibir este pedido." />
                  {vm.addresses.length === 0 ? <StatusPanel title="Un destino para tu selección"
                    copy="Agrega una dirección de envío y vuelve para continuar." action="Agregar dirección"
                    onAction={() => router.push('/direcciones-envio')} />
                    : <View accessibilityRole="radiogroup" accessibilityLabel="Direcciones de envío" style={styles.addresses}>
                      {vm.addresses.map((address) => {
                        const selected = vm.selectedAddressId === address.id;
                        return <Pressable key={address.id} accessibilityRole="radio"
                          accessibilityLabel={`${address.label}, ${address.addressLine}`}
                          accessibilityState={{ checked: selected, disabled: !vm.canEdit }} aria-checked={selected}
                          disabled={!vm.canEdit} onPress={() => vm.selectAddress(address.id)}
                          style={({ pressed }) => [styles.address, selected && styles.addressSelected, !vm.canEdit && styles.disabled, pressed && styles.pressed]}>
                          <View style={styles.addressHeading}>
                            <View accessible={false} style={[styles.radio, selected && styles.radioSelected]}>{selected && <View style={styles.radioDot} />}</View>
                            <Text style={styles.addressLabel}>{address.label}</Text>
                            {selected && <Text style={styles.selectedLabel}>Seleccionada</Text>}
                          </View>
                          <Text style={styles.recipient}>{address.recipientName}</Text>
                          <Text style={styles.addressLine}>{address.addressLine}</Text>
                          <Text style={styles.addressLine}>{address.locationLine}</Text>
                          <Text style={styles.addressLine}>Tel. {address.phone}</Text>
                          {!!address.references && <Text style={styles.addressLine}>Referencia: {address.references}</Text>}
                        </Pressable>;
                      })}
                    </View>}
                  {vm.fieldErrors.shippingAddressId && <Text accessibilityLiveRegion="polite" style={styles.fieldError}>{vm.fieldErrors.shippingAddressId}</Text>}
                  {vm.addresses.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel="Administrar direcciones"
                    accessibilityState={{ disabled: !vm.canEdit }} disabled={!vm.canEdit} onPress={() => router.push('/direcciones-envio')}
                    style={[styles.refreshButton, !vm.canEdit && styles.disabled]}><Text style={styles.refreshText}>Administrar direcciones</Text></Pressable>}

                  {vm.contact && <View style={styles.contact}>
                    <Text accessibilityRole="header" style={styles.contactTitle}>Contacto del pedido</Text>
                    <Text style={styles.help}>Confirma los datos que usaremos para comunicarnos contigo sobre este pedido.</Text>
                    {fields.map((field) => <View key={field.key} style={styles.field}>
                      <Text nativeID={`order-${field.key}-label`} style={styles.fieldLabel}>{field.label}</Text>
                      <TextInput accessibilityLabel={field.label} aria-invalid={!!vm.fieldErrors[field.key]}
                        editable={vm.canEdit} value={vm.contact?.[field.key] ?? ''} maxLength={field.maxLength}
                        keyboardType={field.keyboardType} autoCapitalize={field.key === 'customerEmail' ? 'none' : 'sentences'}
                        autoCorrect={field.key === 'customerName' || field.key === 'notes'} multiline={field.key === 'notes'}
                        onChangeText={(value) => vm.editContact(field.key, value)}
                        style={[styles.input, field.key === 'notes' && styles.notesInput, !!vm.fieldErrors[field.key] && styles.invalidInput, !vm.canEdit && styles.disabled]} />
                      {vm.fieldErrors[field.key] && <Text accessibilityLiveRegion="polite" style={styles.fieldError}>{vm.fieldErrors[field.key]}</Text>}
                    </View>)}
                  </View>}
                </Reveal>

                {vm.quote && <Reveal delay={60}>
                  <SectionHeading number="03" title="Resumen del pedido" detail="Revisa tu selección antes de confirmar." />
                  <View style={styles.summary}>
                    <View style={styles.summaryTop}><Text style={styles.summaryEyebrow}>TU PRÓXIMO RESPIRO</Text><Ionicons accessible={false} name="leaf-outline" size={19} color={colors.primary} /></View>
                    <SummaryRow label="Productos" value={String(vm.itemCount)} />
                    <SummaryRow label="Unidades" value={String(vm.unitCount)} />
                    <SummaryRow label="Enviar a" value={vm.selectedAddress?.label ?? 'Por seleccionar'} />
                    <SummaryRow label="Envío" value="Por definir" />
                    <View style={[styles.totalRow, stacked && styles.stacked]}>
                      <View style={styles.totalCopy}><Text style={styles.totalTitle}>Subtotal de productos</Text><Text style={styles.totalHint}>El envío se definirá por separado.</Text></View>
                      <Text style={styles.totalPrice}>{vm.subtotalLabel}</Text>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel={vm.confirming ? 'Confirmando pedido' : 'Confirmar pedido'}
                      accessibilityState={{ disabled: !vm.canConfirm, busy: vm.confirming }} disabled={!vm.canConfirm}
                      onPress={() => { void vm.confirm(); }} style={[styles.primaryButton, !vm.canConfirm && styles.disabled]}>
                      {vm.confirming ? <ActivityIndicator color={colors.white} size="small" /> : null}
                      <Text style={styles.primaryText}>{vm.confirming ? 'Confirmando…' : 'Confirmar pedido'}</Text>
                      {!vm.confirming && <Ionicons accessible={false} name="arrow-forward" size={18} color={colors.white} />}
                    </Pressable>
                    <Text style={styles.confirmHint}>Tu pedido será enviado a revisión de INHALEX.</Text>
                  </View>
                </Reveal>}
              </>}
          </>}

        {!vm.receipt && <Pressable accessibilityRole="button" accessibilityLabel="Volver a Bolsa" onPress={returnToBag}
          style={({ pressed }) => [styles.returnButton, pressed && styles.pressed]}>
          <Ionicons accessible={false} name="arrow-back" size={17} color={colors.primaryDark} /><Text style={styles.returnText}>Volver a mi bolsa</Text>
        </Pressable>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function Receipt({ vm, onReturn }: { vm: ViewModel; onReturn(): void }) {
  const receipt = vm.receipt!;
  return <Reveal><View accessibilityLiveRegion="polite" style={styles.receipt}>
    <View accessible={false} style={styles.receiptIcon}><Ionicons name="checkmark" size={36} color={colors.primaryDark} /></View>
    <Text accessibilityRole="header" style={styles.receiptTitle}>Tu pedido está registrado</Text>
    <Text selectable style={styles.reference}>{receipt.reference}</Text>
    <Text style={styles.receiptStatus}>{statusLabels[receipt.status]}</Text>
    <View style={styles.receiptDetails}><SummaryRow label="Unidades" value={String(receipt.totalItems)} />
      <SummaryRow label="Subtotal de productos" value={vm.receiptSubtotalLabel ?? ''} /></View>
    {vm.message && <Text style={styles.noticeCopy}>{vm.message}</Text>}
    {(vm.cleanupPending || vm.uncertain) && <Pressable accessibilityRole="button"
      accessibilityLabel={vm.uncertain ? 'Recuperar confirmación' : 'Reintentar actualización de bolsa'}
      accessibilityState={{ disabled: vm.busy, busy: vm.recovering }} disabled={vm.busy}
      onPress={() => { void (vm.uncertain ? vm.retryConfirmation() : vm.reconcileCart()); }}
      style={[styles.secondaryButton, vm.busy && styles.disabled]}>
      <Text style={styles.secondaryText}>{vm.recovering ? 'Actualizando…' : vm.uncertain ? 'Recuperar confirmación' : 'Reintentar actualización de bolsa'}</Text>
    </Pressable>}
    <Pressable accessibilityRole="button" accessibilityLabel="Volver a Bolsa" onPress={onReturn} style={styles.primaryButton}>
      <Text style={styles.primaryText}>Volver a mi bolsa</Text><Ionicons accessible={false} name="arrow-forward" size={18} color={colors.white} />
    </Pressable>
  </View></Reveal>;
}

function StatusPanel({ title, copy, action, message, busy, onAction }: {
  title: string; copy: string; action?: string; message?: string | null; busy?: boolean; onAction?: () => void;
}) {
  return <View accessibilityLiveRegion="polite" style={styles.panel}>
    {busy && <ActivityIndicator color={colors.primary} />}
    <Text accessibilityRole="header" style={styles.panelTitle}>{title}</Text><Text style={styles.panelCopy}>{copy}</Text>
    {message && <Text style={styles.noticeCopy}>{message}</Text>}
    {action && onAction && <Pressable accessibilityRole="button" accessibilityLabel={action} disabled={busy}
      accessibilityState={{ disabled: !!busy, busy: !!busy }} onPress={onAction} style={[styles.secondaryButton, busy && styles.disabled]}>
      <Text style={styles.secondaryText}>{action}</Text>
    </Pressable>}
  </View>;
}

function SectionHeading({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <View style={styles.sectionHeading}><View accessible={false} style={styles.step}><Text style={styles.stepText}>{number}</Text></View>
    <View style={styles.sectionCopy}><Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionDetail}>{detail}</Text></View></View>;
}
function SummaryRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>;
}
function OrderItem({ item, stacked }: { item: ViewModel['items'][number]; stacked: boolean }) {
  const [failed, setFailed] = useState(false);
  const source = failed ? null : getCatalogImage(item.image);
  return <View style={styles.product}>
    <View style={styles.productMain}>
      <View style={styles.productImage}>{source ? <Image accessibilityLabel={`Imagen de ${item.productName}`} source={source} resizeMode="contain"
        onError={() => setFailed(true)} style={styles.photo} /> : <Ionicons accessibilityLabel="Imagen no disponible" name="leaf-outline" size={26} color={colors.primary} />}</View>
      <View style={styles.productCopy}><Text style={styles.productEyebrow}>ESENCIA INHALEX</Text><Text style={styles.productName}>{item.productName}</Text>
        <Text style={styles.productNote}>{item.category}</Text><Text style={styles.productNote}>{item.presentation}</Text></View>
    </View>
    <View style={[styles.productBottom, stacked && styles.stacked]}><Text style={styles.quantity}>{item.quantity} × {item.unitPriceLabel}</Text><Text style={styles.lineTotal}>{item.lineTotalLabel}</Text></View>
    {!!item.message && <Text style={styles.help}>{item.message}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { alignSelf: 'center', maxWidth: 620, padding: 22, paddingBottom: 32, width: '100%' },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 26 },
  backButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, height: 48, justifyContent: 'center', width: 48 },
  brand: { height: 41, width: 145 }, eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.8, lineHeight: 18 },
  title: { color: colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -1.1, lineHeight: 42, marginTop: 5 }, dot: { color: colors.accent },
  intro: { color: colors.textMuted, fontSize: 14, lineHeight: 23, marginTop: 9 },
  refreshButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 8, marginTop: 17, minHeight: 44, paddingVertical: 9 },
  refreshText: { color: colors.primaryDark, fontSize: 12, fontWeight: '700', lineHeight: 21 },
  notice: { backgroundColor: colors.warningSoft, borderRadius: 14, marginTop: 20, padding: 14 }, noticeCopy: { color: colors.text, fontSize: 12, lineHeight: 22 },
  sectionHeading: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, marginBottom: 16, marginTop: 27 },
  step: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderRadius: 12, borderWidth: 1, justifyContent: 'center', minHeight: 37, minWidth: 37, padding: 7 },
  stepText: { color: colors.primaryDark, fontSize: 11, fontWeight: '800', lineHeight: 20 }, sectionCopy: { flex: 1, minWidth: 0 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.5, lineHeight: 26 }, sectionDetail: { color: colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: 3 },
  products: { gap: 13 }, product: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, padding: 15 },
  productMain: { alignItems: 'center', flexDirection: 'row', gap: 13 }, productImage: { alignItems: 'center', backgroundColor: '#F5F5F7', borderRadius: 14, height: 88, justifyContent: 'center', overflow: 'hidden', width: 72 }, photo: { height: '100%', width: '100%' },
  productCopy: { flex: 1, minWidth: 0 }, productEyebrow: { color: colors.primary, fontSize: 8, fontWeight: '800', letterSpacing: 1, lineHeight: 15 },
  productName: { color: colors.text, fontSize: 19, fontWeight: '800', lineHeight: 26, marginTop: 2 }, productNote: { color: colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: 3 },
  productBottom: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'space-between', marginTop: 14, paddingTop: 13 },
  stacked: { alignItems: 'flex-start', flexDirection: 'column' }, quantity: { color: colors.textMuted, flexShrink: 1, fontSize: 11, lineHeight: 19 }, lineTotal: { color: colors.primaryDark, flexShrink: 1, fontSize: 15, fontWeight: '800', lineHeight: 23 },
  issues: { backgroundColor: colors.warningSoft, borderRadius: 15, marginTop: 15, padding: 15 }, issueHeading: { color: colors.text, fontSize: 13, fontWeight: '800', lineHeight: 22 },
  issue: { marginTop: 11 }, issueTitle: { color: colors.text, fontSize: 12, fontWeight: '700', lineHeight: 21 }, issueCopy: { color: colors.textMuted, fontSize: 12, lineHeight: 21 },
  help: { color: colors.textMuted, fontSize: 11, lineHeight: 20, marginTop: 10 }, addresses: { gap: 12 },
  address: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 19, borderWidth: 1, padding: 17 }, addressSelected: { backgroundColor: '#F0F7EE', borderColor: colors.primary },
  addressHeading: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, radio: { alignItems: 'center', borderColor: colors.textMuted, borderRadius: 10, borderWidth: 1.5, height: 20, justifyContent: 'center', width: 20 },
  radioSelected: { borderColor: colors.primary }, radioDot: { backgroundColor: colors.primary, borderRadius: 5, height: 10, width: 10 }, addressLabel: { color: colors.text, flexShrink: 1, fontSize: 15, fontWeight: '800', lineHeight: 23 },
  selectedLabel: { backgroundColor: colors.surface, borderRadius: 7, color: colors.primaryDark, fontSize: 9, fontWeight: '800', lineHeight: 16, paddingHorizontal: 7, paddingVertical: 3 },
  recipient: { color: colors.text, fontSize: 12, fontWeight: '700', lineHeight: 21, marginTop: 12 }, addressLine: { color: colors.textMuted, fontSize: 12, lineHeight: 21, marginTop: 2 },
  contact: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 20, borderWidth: 1, marginTop: 20, padding: 17 }, contactTitle: { color: colors.primaryDark, fontSize: 15, fontWeight: '800', lineHeight: 23 },
  field: { marginTop: 17 }, fieldLabel: { color: colors.text, fontSize: 12, fontWeight: '700', lineHeight: 21, marginBottom: 7 }, input: { backgroundColor: colors.background, borderColor: colors.border, borderRadius: 12, borderWidth: 1, color: colors.text, fontSize: 14, minHeight: 50, paddingHorizontal: 12, paddingVertical: 12 },
  notesInput: { minHeight: 96, textAlignVertical: 'top' }, invalidInput: { borderColor: colors.danger }, fieldError: { color: colors.danger, fontSize: 11, lineHeight: 20, marginTop: 6 },
  summary: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, padding: 20 }, summaryTop: { alignItems: 'center', flexDirection: 'row', gap: 10, justifyContent: 'space-between', marginBottom: 24 },
  summaryEyebrow: { color: colors.primary, flexShrink: 1, fontSize: 9, fontWeight: '800', letterSpacing: 1.3, lineHeight: 17 }, summaryRow: { alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', marginBottom: 14 },
  summaryLabel: { color: colors.textMuted, flexShrink: 1, fontSize: 12, lineHeight: 21 }, summaryValue: { color: colors.text, flexShrink: 1, fontSize: 12, fontWeight: '700', lineHeight: 21 },
  totalRow: { alignItems: 'center', borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', marginBottom: 23, marginTop: 3, paddingTop: 20 }, totalCopy: { flexShrink: 1 },
  totalTitle: { color: colors.primaryDark, fontSize: 13, fontWeight: '800', lineHeight: 22 }, totalHint: { color: colors.textMuted, fontSize: 10, lineHeight: 18, marginTop: 3 }, totalPrice: { color: colors.primaryDark, flexShrink: 1, fontSize: 23, fontWeight: '800', letterSpacing: -0.6, lineHeight: 32 },
  primaryButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.primaryDark, borderRadius: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', minHeight: 54, padding: 14 }, primaryText: { color: colors.white, flexShrink: 1, fontSize: 13, fontWeight: '800', lineHeight: 22, textAlign: 'center' },
  confirmHint: { color: colors.textMuted, fontSize: 10, lineHeight: 18, marginTop: 12, textAlign: 'center' }, secondaryButton: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderRadius: 14, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 20, minHeight: 52, padding: 14 }, secondaryText: { color: colors.primaryDark, flexShrink: 1, fontSize: 12, fontWeight: '800', lineHeight: 22, textAlign: 'center' },
  panel: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 23, borderWidth: 1, marginTop: 22, padding: 24 }, panelTitle: { color: colors.text, fontSize: 23, fontWeight: '800', letterSpacing: -0.6, lineHeight: 32, marginTop: 9, textAlign: 'center' }, panelCopy: { color: colors.textMuted, fontSize: 13, lineHeight: 22, marginTop: 12, textAlign: 'center' },
  receipt: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: 1, gap: 18, marginTop: 24, padding: 23 }, receiptIcon: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 38, height: 76, justifyContent: 'center', width: 76 }, receiptTitle: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.6, lineHeight: 34, textAlign: 'center' },
  reference: { color: colors.primaryDark, fontSize: 17, fontWeight: '800', lineHeight: 27, textAlign: 'center' }, receiptStatus: { backgroundColor: colors.surfaceSoft, borderRadius: 9, color: colors.primaryDark, fontSize: 12, fontWeight: '700', lineHeight: 22, paddingHorizontal: 12, paddingVertical: 5 }, receiptDetails: { alignSelf: 'stretch', borderTopColor: colors.border, borderTopWidth: 1, marginTop: 6, paddingTop: 20 },
  returnButton: { alignItems: 'center', alignSelf: 'center', flexDirection: 'row', gap: 8, marginTop: 23, minHeight: 48, padding: 10 }, returnText: { color: colors.primaryDark, flexShrink: 1, fontSize: 12, fontWeight: '700', lineHeight: 21 }, disabled: { opacity: 0.55 }, pressed: { opacity: 0.75 },
});
