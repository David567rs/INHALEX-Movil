import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { Reveal, SoftPressable } from '@/shared/components/Motion';

import type { ShippingAddress } from '../../domain/models/ShippingAddress';
import { ShippingAddressForm } from '../components/ShippingAddressForm';
import { useShippingAddressesViewModel } from '../viewModels/useShippingAddressesViewModel';

function AddressCard({ address, disabled, pending, confirming, onEdit, onSelect, onAskRemove, onCancelRemove, onRemove }: {
  address: ShippingAddress; disabled: boolean; pending: boolean; confirming: boolean;
  onEdit(): void; onSelect(): void; onAskRemove(): void; onCancelRemove(): void; onRemove(): void;
}) {
  return <View style={styles.addressCard}>
    <View style={styles.cardHeading}>
      <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.placeIcon}>
        <Ionicons name={address.isDefault ? 'home-outline' : 'business-outline'} size={23} color={colors.primaryDark} />
      </View>
      <View style={styles.cardHeadingCopy}>
        <Text accessibilityRole="header" style={styles.cardTitle}>{address.label}</Text>
        {address.isDefault && <Text style={styles.defaultBadge}>Dirección principal</Text>}
      </View>
    </View>
    <Text style={styles.recipient}>{address.recipientName}</Text>
    <Text style={styles.addressLine}>{address.street} {address.exteriorNumber}{address.interiorNumber ? `, int. ${address.interiorNumber}` : ''}</Text>
    <Text style={styles.addressLine}>{address.neighborhood}</Text>
    <Text style={styles.addressLine}>{address.municipality}, {address.state}</Text>
    <Text style={styles.addressLine}>C.P. {address.postalCode}</Text>
    <Text style={styles.contact}>Tel. {address.phone}</Text>
    {!!address.references && <View style={styles.reference}><Text style={styles.referenceText}>{address.references}</Text></View>}
    <View style={styles.cardActions}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Editar dirección ${address.label}`} onPress={onEdit} disabled={disabled} accessibilityState={{ disabled }}
        style={({ pressed }) => [styles.editButton, pressed && styles.pressed, disabled && styles.disabled]}>
        <Ionicons accessible={false} name="create-outline" size={17} color={colors.primaryDark} />
        <Text style={styles.editLabel}>Editar</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Eliminar dirección ${address.label}`} onPress={onAskRemove} accessibilityState={{ disabled }} disabled={disabled} style={[styles.deleteButton, disabled && styles.disabled]}>
        <Ionicons accessible={false} name="trash-outline" size={17} color={colors.textMuted} />
        <Text style={styles.inactiveLabel}>Eliminar</Text>
      </Pressable>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Usar ${address.label} como dirección principal`} onPress={onSelect} accessibilityState={{ disabled: disabled || address.isDefault, selected: address.isDefault, busy: pending }} disabled={disabled || address.isDefault} style={[styles.selectButton, address.isDefault && styles.selectedButton, disabled && styles.disabled]}>
      {pending ? <ActivityIndicator color={colors.primary} /> : <Ionicons accessible={false} name={address.isDefault ? 'checkmark-circle' : 'ellipse-outline'} size={17} color={colors.primary} />}
      <Text style={styles.editLabel}>{address.isDefault ? 'Dirección principal' : 'Usar como principal'}</Text>
    </Pressable>
    {confirming && <View style={styles.removeNotice} accessibilityLiveRegion="polite">
      <Text style={styles.removeText}>¿Eliminar «{address.label}» de tus direcciones?</Text>
      <View style={styles.cardActions}>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancelar eliminación de dirección" onPress={onCancelRemove} disabled={disabled} style={styles.editButton}><Text style={styles.editLabel}>Conservar</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Confirmar eliminación de ${address.label}`} onPress={onRemove} disabled={disabled} style={styles.deleteButton}><Text style={styles.removeText}>Eliminar dirección</Text></Pressable>
      </View>
    </View>}
  </View>;
}

export function ShippingAddressesScreen() {
  const viewModel = useShippingAddressesViewModel();
  const [removeTarget, setRemoveTarget] = useState<ShippingAddress | null>(null);
  const scroll = useRef<ScrollView>(null);
  const isList = viewModel.mode === 'list';
  const locked = viewModel.loading || viewModel.refreshing || viewModel.saving;
  const canMutate = viewModel.status === 'ready' && viewModel.addresses !== null && !locked && !viewModel.requiresRefresh;
  const needsSession = viewModel.status === 'anonymous' || viewModel.status === 'expired';
  const needsRetry = viewModel.requiresRefresh || (!!viewModel.message && Object.keys(viewModel.fieldErrors).length === 0);

  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [viewModel.mode]);
  useEffect(() => { if (viewModel.message) scroll.current?.scrollTo({ y: 0, animated: false }); }, [viewModel.message]);

  async function openSignIn() {
    if (await viewModel.prepareSignIn()) router.push('/sign-in');
  }

  function back() {
    Keyboard.dismiss();
    router.navigate('/(tabs)/cuenta');
  }

  return <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.screen}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined} style={styles.screen}>
      <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver a Cuenta" onPress={back} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <Ionicons accessible={false} name="arrow-back" size={22} color={colors.primaryDark} />
          </Pressable>
          <Image accessibilityLabel="INHALEX" source={require('../../../../../assets/home/brand.png')} resizeMode="contain" style={styles.brand} />
          <View style={styles.topSpacer} />
        </View>
        <Reveal>
          <View style={styles.eyebrowRow}><View style={styles.eyebrowLine} /><Text style={styles.eyebrow}>CERCA DE TI</Text></View>
          <Text accessibilityRole="header" style={styles.title}>{isList ? 'Tus direcciones.' : viewModel.mode === 'create' ? 'Un nuevo destino.' : 'Cada detalle cuenta.'}</Text>
          <Text style={styles.introduction}>{isList ? 'Un espacio para los lugares donde quieres recibir INHALEX.' : viewModel.mode === 'create' ? 'Agrega el lugar donde quieres recibir tu próxima entrega.' : 'Actualiza los datos de tu dirección.'}</Text>
        </Reveal>
        {needsSession ? <AddressStatus title={viewModel.status === 'expired' ? 'Vuelve a iniciar sesión' : 'Tus destinos, en tu cuenta'} message="Inicia sesión para consultar y guardar tus direcciones de envío."
          action={viewModel.openingSignIn ? 'Abriendo…' : 'Iniciar sesión'} disabled={viewModel.openingSignIn} onAction={() => { void openSignIn(); }} />
          : viewModel.status === 'recovery-error' ? <AddressStatus title="No pudimos comprobar tu sesión" message="Revisa tu conexión e intenta recuperar tu sesión." action="Reintentar sesión" onAction={() => { void viewModel.restoreSession(); }} />
          : viewModel.addresses === null && (viewModel.status === 'checking' || viewModel.loading) ? <AddressStatus title={viewModel.status === 'checking' ? 'Comprobando tu sesión' : 'Preparando tus direcciones'} message="Un momento, estamos consultando tus datos." busy />
          : viewModel.addresses === null ? <AddressStatus title="No pudimos cargar tus direcciones" message={viewModel.message || 'Comprueba tu conexión e inténtalo otra vez.'} action="Reintentar" disabled={!viewModel.canRefresh} onAction={() => { void viewModel.refresh(); }} /> : null}

        {viewModel.addresses !== null && <>
          {(viewModel.message || viewModel.requiresRefresh) && <View accessibilityLiveRegion="polite" style={styles.errorNotice}>
            {!!viewModel.message && <Text style={styles.removeText}>{viewModel.message}</Text>}
            {viewModel.requiresRefresh && <Text style={styles.removeText}>{viewModel.draft ? 'Tu borrador se conserva. ' : ''}Reintenta la carga para comprobar las direcciones guardadas antes de hacer otro cambio.</Text>}
          </View>}
          {!!viewModel.confirmation && <Text accessibilityLiveRegion="polite" style={styles.confirmation}>{viewModel.confirmation}</Text>}
          <Pressable accessibilityRole="button" accessibilityLabel={needsRetry ? 'Reintentar carga de direcciones' : 'Actualizar direcciones'} disabled={!viewModel.canRefresh}
            accessibilityState={{ disabled: !viewModel.canRefresh, busy: viewModel.refreshing }} onPress={() => { setRemoveTarget(null); void viewModel.refresh(); }} style={[styles.refreshButton, !viewModel.canRefresh && styles.disabled]}>
            {viewModel.refreshing ? <ActivityIndicator color={colors.primary} /> : <Ionicons accessible={false} name="refresh-outline" size={17} color={colors.primary} />}
            <Text style={styles.editLabel}>{viewModel.refreshing ? 'Actualizando…' : needsRetry ? 'Reintentar' : 'Actualizar direcciones'}</Text>
          </Pressable>
        {isList ? <Reveal delay={60}>
          <View style={styles.sectionHeading}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Tus lugares</Text>
            <Text style={styles.count}>{viewModel.addresses.length} de 5 direcciones</Text>
          </View>
          {viewModel.addresses.length ? <View style={styles.cards}>{viewModel.addresses.map((address) => <AddressCard key={address.id} address={address} disabled={!canMutate} pending={viewModel.pendingId === address.id}
            confirming={removeTarget === address} onAskRemove={() => setRemoveTarget(address)} onCancelRemove={() => setRemoveTarget(null)}
            onRemove={() => { setRemoveTarget(null); void viewModel.remove(address.id); }} onSelect={() => { setRemoveTarget(null); void viewModel.select(address.id); }}
            onEdit={() => { setRemoveTarget(null); viewModel.openEdit(address.id); }} />)}</View>
            : <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}><Ionicons accessible={false} name="location-outline" size={36} color={colors.primary} /></View>
              <Text accessibilityRole="header" style={styles.emptyTitle}>Aún no tienes direcciones</Text>
              <Text style={styles.emptyCopy}>Tu próxima entrega tendrá su lugar. Agrega una dirección para tenerla lista en tu cuenta.</Text>
            </View>}
          <SoftPressable accessibilityRole="button" accessibilityLabel="Nueva dirección" disabled={!viewModel.canCreate} accessibilityState={{ disabled: !viewModel.canCreate }} onPress={viewModel.openCreate} style={[styles.newButton, !viewModel.canCreate && styles.disabled]}>
            <Ionicons accessible={false} name="add-outline" size={21} color={colors.white} /><Text style={styles.newLabel}>Nueva dirección</Text>
          </SoftPressable>
          <Text style={styles.footerHint}>{viewModel.addresses.length >= 5 ? 'Llegaste al máximo de cinco direcciones. Puedes editar o quitar una.' : 'Puedes guardar hasta cinco direcciones. La principal queda seleccionada en tu cuenta.'}</Text>
        </Reveal> : <Reveal key={viewModel.mode} delay={30}>
          <Text accessibilityRole="header" style={styles.formTitle}>{viewModel.mode === 'create' ? 'Nueva dirección' : 'Editar dirección'}</Text>
          {viewModel.draft && <ShippingAddressForm draft={viewModel.draft} mode={viewModel.mode === 'edit' ? 'edit' : 'create'} onChange={viewModel.updateField} onCancel={viewModel.cancelForm}
            onSave={() => { void viewModel.save(); }} onToggleDefault={viewModel.toggleDefault} errors={viewModel.fieldErrors} canSave={viewModel.canSave} locked={locked} saving={viewModel.saving}
            defaultLocked={viewModel.mode === 'edit' && !!viewModel.addresses.find((address) => address.id === viewModel.editingId)?.isDefault} />}
        </Reveal>}
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function AddressStatus({ title, message, action, onAction, busy = false, disabled = false }: {
  title: string; message: string; action?: string; onAction?: () => void; busy?: boolean; disabled?: boolean;
}) {
  return <View style={styles.emptyCard} accessibilityLiveRegion="polite">
    {busy && <ActivityIndicator color={colors.primary} />}
    <Text accessibilityRole="header" style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyCopy}>{message}</Text>
    {action && <Pressable accessibilityRole="button" onPress={onAction} disabled={disabled} accessibilityState={{ disabled }} style={[styles.newButton, disabled && styles.disabled]}><Text style={styles.newLabel}>{action}</Text></Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { alignSelf: 'center', maxWidth: 620, paddingBottom: 34, paddingHorizontal: 22, width: '100%' },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28, marginTop: 10 },
  backButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 15, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  brand: { height: 41, width: 136 }, topSpacer: { width: 44 },
  eyebrowRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 10 }, eyebrowLine: { backgroundColor: colors.accent, height: 2, width: 23 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 2, lineHeight: 18 },
  title: { color: colors.primaryDark, fontSize: 35, fontWeight: '800', letterSpacing: -1.3, lineHeight: 43 },
  introduction: { color: colors.textMuted, fontSize: 13, lineHeight: 22, marginBottom: 22, marginTop: 9 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between', marginBottom: 14, marginTop: 25 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '800', lineHeight: 28 }, count: { color: colors.textMuted, fontSize: 11, lineHeight: 19 },
  cards: { gap: 17 }, addressCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: 1, padding: 20 },
  cardHeading: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 20 }, cardHeadingCopy: { flex: 1, minWidth: 0 },
  placeIcon: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 14, height: 48, justifyContent: 'center', width: 48 },
  cardTitle: { color: colors.primaryDark, fontSize: 19, fontWeight: '800', lineHeight: 27 },
  defaultBadge: { alignSelf: 'flex-start', color: colors.primary, fontSize: 10, fontWeight: '700', lineHeight: 18, marginTop: 2 },
  recipient: { color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 23, marginBottom: 5 },
  addressLine: { color: colors.textMuted, fontSize: 12, lineHeight: 21 }, contact: { color: colors.text, fontSize: 12, lineHeight: 21, marginTop: 10 },
  reference: { borderColor: colors.border, borderTopWidth: 1, marginTop: 16, paddingTop: 13 }, referenceText: { color: colors.textMuted, fontSize: 10, lineHeight: 18 },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  editButton: { alignItems: 'center', flexDirection: 'row', flexGrow: 1, flexWrap: 'wrap', gap: 6, justifyContent: 'center', minHeight: 44, paddingHorizontal: 5, paddingVertical: 10 },
  editLabel: { color: colors.primaryDark, fontSize: 11, fontWeight: '700', lineHeight: 19 },
  deleteButton: { alignItems: 'center', flexDirection: 'row', flexGrow: 1, flexWrap: 'wrap', gap: 6, justifyContent: 'center', minHeight: 44, paddingHorizontal: 5, paddingVertical: 10 },
  inactiveLabel: { color: colors.textMuted, flexShrink: 1, fontSize: 11, fontWeight: '600', lineHeight: 19, textAlign: 'center' },
  selectButton: { alignItems: 'center', borderColor: colors.border, borderRadius: 12, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 7, justifyContent: 'center', marginTop: 4, minHeight: 44, padding: 10 },
  selectedButton: { backgroundColor: colors.surfaceSoft },
  disabled: { opacity: 0.55 },
  errorNotice: { backgroundColor: colors.dangerSoft, borderColor: colors.danger, borderRadius: 15, borderWidth: 1, gap: 6, marginBottom: 12, padding: 15 },
  removeNotice: { backgroundColor: colors.dangerSoft, borderRadius: 15, marginTop: 15, padding: 13 },
  removeText: { color: colors.danger, fontSize: 12, lineHeight: 20 },
  confirmation: { backgroundColor: colors.surfaceSoft, borderRadius: 13, color: colors.primaryDark, fontSize: 13, lineHeight: 21, marginBottom: 12, padding: 15 },
  refreshButton: { alignItems: 'center', alignSelf: 'flex-end', flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 44, marginBottom: 12, padding: 10 },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: 1, paddingHorizontal: 24, paddingVertical: 32 },
  emptyIcon: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 28, height: 76, justifyContent: 'center', marginBottom: 20, width: 76 },
  emptyTitle: { color: colors.primaryDark, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, lineHeight: 30, textAlign: 'center' },
  emptyCopy: { color: colors.textMuted, fontSize: 12, lineHeight: 21, marginTop: 10, textAlign: 'center' },
  newButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 15, flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 23, minHeight: 52, paddingHorizontal: 16, paddingVertical: 15 },
  newLabel: { color: colors.white, flexShrink: 1, fontSize: 13, fontWeight: '800', lineHeight: 22, textAlign: 'center' },
  footerHint: { color: colors.textMuted, fontSize: 10, lineHeight: 18, marginTop: 14, textAlign: 'center' },
  formTitle: { color: colors.primaryDark, fontSize: 22, fontWeight: '800', lineHeight: 30, marginBottom: 24 }, pressed: { opacity: 0.75 },
});
