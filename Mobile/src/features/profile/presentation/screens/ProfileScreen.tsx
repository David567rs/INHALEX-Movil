import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { Reveal, SoftPressable } from '@/shared/components/Motion';
import { ProfileForm } from '../components/ProfileForm';
import { useProfileViewModel } from '../viewModels/useProfileViewModel';

export function ProfileScreen() {
  const vm = useProfileViewModel();
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 360 || fontScale > 1.25;
  const scroll = useRef<ScrollView>(null);
  useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [vm.mode]);
  useEffect(() => {
    if (vm.error || vm.saveError) scroll.current?.scrollTo({ y: 0, animated: false });
  }, [vm.error, vm.saveError]);
  const needsSession = vm.status === 'anonymous' || vm.status === 'session-expired';
  async function openSignIn() {
    if (await vm.prepareSignIn()) router.push('/sign-in');
  }

  function returnToAccount() {
    Keyboard.dismiss();
    router.navigate('/(tabs)/cuenta');
  }

  return <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : Platform.OS === 'android' ? 'height' : undefined}>
      <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver a Cuenta" onPress={returnToAccount}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Ionicons accessible={false} name="arrow-back" size={20} color={colors.primaryDark} />
          </Pressable>
          <Image source={require('../../../../../assets/home/brand.png')} accessibilityLabel="INHALEX, el respiro que alivia"
            resizeMode="contain" style={styles.brand} />
        </View>
        <Reveal>
          <Text style={styles.eyebrow}>TU ESPACIO PERSONAL</Text>
          <Text accessibilityRole="header" style={styles.title}>Tu perfil<Text style={styles.dot}>.</Text></Text>
          <Text style={styles.intro}>Lo esencial de ti, en un solo lugar.</Text>
        </Reveal>

        {needsSession ? <ProfileStatus title={vm.status === 'session-expired' ? 'Vuelve a iniciar sesión' : 'Un perfil muy tuyo'}
          message="Inicia sesión para consultar y actualizar tus datos personales."
          action={vm.openingSignIn ? 'Abriendo…' : 'Iniciar sesión'} disabled={vm.openingSignIn}
          onAction={() => { void openSignIn(); }} />
          : vm.status === 'recovery-error' ? <ProfileStatus title="No pudimos comprobar tu sesión"
            message="Comprueba tu conexión e intenta recuperar tu sesión."
            action="Reintentar sesión" onAction={() => { void vm.restoreSession(); }} />
          : !vm.profile && vm.busy ? <ProfileStatus title={vm.status === 'checking' ? 'Comprobando tu sesión' : 'Preparando tu perfil'} message="Un momento, estamos consultando tus datos." busy />
          : !vm.profile && vm.status === 'error' ? <ProfileStatus title="No pudimos cargar tu perfil"
            message={vm.error || 'Comprueba tu conexión e inténtalo de nuevo.'} action="Reintentar" onAction={() => { void vm.refresh(); }} /> : null}

        {vm.profile && <>
        {(vm.error || vm.saveError || vm.requiresRefresh) && <View accessibilityLiveRegion="polite" style={styles.errorNotice}>
          {(vm.saveError || vm.error) && <Text style={styles.errorText}>{vm.saveError || vm.error}</Text>}
          {vm.requiresRefresh && <Text style={styles.errorText}>{vm.mode === 'edit' ? 'Tu borrador se conserva. ' : ''}Reintenta la carga para comprobar los datos guardados antes de volver a guardar.</Text>}
        </View>}
        {vm.notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{vm.notice}</Text>}
        <Pressable accessibilityRole="button" accessibilityLabel={vm.error || vm.requiresRefresh ? 'Reintentar carga de perfil' : 'Actualizar perfil'}
          accessibilityState={{ disabled: !vm.canRefresh, busy: vm.refreshing }} disabled={!vm.canRefresh}
          onPress={() => { void vm.refresh(); }} style={[styles.refreshButton, !vm.canRefresh && styles.disabled]}>
          {vm.refreshing ? <ActivityIndicator color={colors.primary} /> : <Ionicons accessible={false} name="refresh-outline" size={17} color={colors.primary} />}
          <Text style={styles.refreshText}>{vm.refreshing ? 'Actualizando…' : vm.error || vm.requiresRefresh ? 'Reintentar' : 'Actualizar perfil'}</Text>
        </Pressable>

        {vm.mode === 'summary' ? <>
          <Reveal delay={40}>
            <View style={[styles.identity, compact && styles.identityCompact]}>
              <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.avatar}>
                <Text style={styles.initials}>{vm.initials}</Text>
              </View>
              <View style={[styles.identityCopy, compact && styles.identityCopyCompact]}>
                <Text style={styles.identityEyebrow}>UN ESPACIO MUY TUYO</Text>
                <Text accessibilityRole="header" style={styles.name}>{vm.fullName}</Text>
                <Text style={styles.identityCaption}>Miembro de INHALEX</Text>
              </View>
              <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.identityLeaf}>
                <Ionicons name="leaf-outline" color="#9FCA9B" size={60} />
              </View>
            </View>
          </Reveal>

          <Reveal delay={70}>
            <View style={styles.sectionHeading}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>Información personal</Text>
              <Text style={styles.sectionHint}>Un perfil que habla de ti.</Text>
            </View>
            <View style={styles.card}>
              <InfoRow icon="person-outline" label="Nombres" value={vm.profile.firstName} />
              <InfoRow icon="people-outline" label="Apellidos" value={vm.profile.lastName} last />
            </View>
            <View style={styles.sectionHeading}>
              <Text accessibilityRole="header" style={styles.sectionTitle}>Datos de contacto</Text>
              <Text style={styles.sectionHint}>Para estar más cerca de ti.</Text>
            </View>
            <View style={styles.card}>
              <InfoRow icon="mail-outline" label="Correo electrónico" value={vm.profile.email} hint="Identifica tu cuenta" />
              <InfoRow icon="call-outline" label="Teléfono" value={vm.profile.phone} last />
            </View>
            <SoftPressable accessibilityRole="button" accessibilityLabel="Editar datos del perfil" disabled={!vm.canEdit}
              accessibilityState={{ disabled: !vm.canEdit }} onPress={vm.beginEdit}
              style={({ pressed }) => [styles.editButton, pressed && styles.pressed, !vm.canEdit && styles.disabled]}>
              <Ionicons accessible={false} name="create-outline" size={20} color={colors.white} />
              <Text style={styles.editText}>Editar datos</Text>
              <Ionicons accessible={false} name="arrow-forward" size={18} color={colors.white} />
            </SoftPressable>
            <Text style={styles.stageHint}>Mantén al día la información de tu cuenta.</Text>
          </Reveal>
        </> : <Reveal delay={40}>
          <View style={styles.editHeading}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Editar tus datos</Text>
            <Text style={styles.sectionHint}>Actualiza tus nombres, apellidos y teléfono.</Text>
          </View>
          {vm.draft && <ProfileForm draft={vm.draft} email={vm.profile.email} onChange={vm.updateField} onCancel={vm.cancelEdit}
            onSave={() => { void vm.save(); }} saving={vm.saving} refreshing={vm.refreshing} canSave={vm.canSave} errors={vm.fieldErrors} />}
        </Reveal>}
        </>}

        <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.footer}>
          <View style={styles.footerLine} />
          <Image source={require('../../../../../assets/inhalex-mark.png')} resizeMode="contain" style={styles.mark} />
          <View style={styles.footerLine} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

function ProfileStatus({ title, message, action, onAction, busy = false, disabled = false }: {
  title: string; message: string; action?: string; onAction?: () => void; busy?: boolean; disabled?: boolean;
}) {
  return <View style={styles.statusPanel} accessibilityLiveRegion="polite">
    {busy && <ActivityIndicator color={colors.primary} />}
    <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionHint}>{message}</Text>
    {action && <Pressable accessibilityRole="button" disabled={disabled} accessibilityState={{ disabled }} onPress={onAction}
      style={[styles.editButton, disabled && styles.disabled]}><Text style={styles.editText}>{action}</Text></Pressable>}
  </View>;
}

function InfoRow({ icon, label, value, hint, last = false }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string; hint?: string; last?: boolean;
}) {
  return <View style={[styles.infoRow, !last && styles.rowBorder]}>
    <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.infoIcon}>
      <Ionicons name={icon} size={20} color={colors.primary} />
    </View>
    <View style={styles.infoCopy}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text selectable style={styles.infoValue}>{value}</Text>
      {hint && <Text style={styles.infoHint}>{hint}</Text>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 }, flex: { flex: 1 },
  content: { alignSelf: 'center', maxWidth: 620, padding: 22, paddingBottom: 30, width: '100%' },
  topBar: { alignItems: 'center', flexDirection: 'row', gap: 16, justifyContent: 'space-between', marginBottom: 29 },
  back: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderRadius: 23, borderWidth: 1, height: 46, justifyContent: 'center', width: 46 },
  brand: { height: 42, width: 140 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  title: { color: colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -1.1, marginTop: 6 },
  dot: { color: colors.accent }, intro: { color: colors.textMuted, fontSize: 14, lineHeight: 22, marginTop: 8, marginBottom: 20 },
  statusPanel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 21, borderWidth: 1, gap: 10, marginTop: 5, padding: 22 },
  errorNotice: { backgroundColor: colors.dangerSoft, borderColor: colors.danger, borderWidth: 1, borderRadius: 15, gap: 6, marginBottom: 12, padding: 15 },
  errorText: { color: colors.danger, fontSize: 12, lineHeight: 20 },
  notice: { backgroundColor: colors.surfaceSoft, borderRadius: 13, color: colors.primaryDark, fontSize: 13, lineHeight: 21, marginBottom: 12, padding: 15 },
  refreshButton: { alignItems: 'center', alignSelf: 'flex-end', flexDirection: 'row', gap: 7, justifyContent: 'center', minHeight: 44, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 10 },
  refreshText: { color: colors.primaryDark, flexShrink: 1, fontSize: 12, fontWeight: '700' },
  disabled: { opacity: 0.55 },
  identity: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 24, flexDirection: 'row', gap: 17, overflow: 'hidden', padding: 23 },
  identityCompact: { alignItems: 'flex-start', flexDirection: 'column', gap: 16 },
  avatar: { alignItems: 'center', backgroundColor: '#E1EED5', borderColor: '#9CC887', borderRadius: 35, borderWidth: 1, height: 70, justifyContent: 'center', width: 70 },
  initials: { color: colors.primaryDark, fontSize: 24, fontWeight: '700', letterSpacing: -0.7 },
  identityCopy: { flex: 1, maxWidth: '100%', minWidth: 0, zIndex: 1 },
  identityCopyCompact: { flex: 0, width: '100%' },
  identityEyebrow: { color: '#CDE5BF', fontSize: 8, fontWeight: '700', letterSpacing: 1.1 },
  name: { color: colors.white, fontSize: 25, fontWeight: '800', letterSpacing: -0.7, lineHeight: 31, marginTop: 7 },
  identityCaption: { color: '#DEEBDD', fontSize: 10, lineHeight: 18, marginTop: 8 },
  identityLeaf: { bottom: -16, opacity: 0.12, position: 'absolute', right: -6, transform: [{ rotate: '-24deg' }] },
  sectionHeading: { gap: 4, marginBottom: 13, marginTop: 25 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.4, lineHeight: 27 },
  sectionHint: { color: colors.textMuted, fontSize: 12, lineHeight: 20 },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 21, borderWidth: 1, paddingHorizontal: 17 },
  infoRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 13, paddingVertical: 19 },
  rowBorder: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  infoIcon: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 11, height: 38, justifyContent: 'center', width: 38 },
  infoCopy: { flex: 1, minWidth: 0 },
  infoLabel: { color: colors.textMuted, fontSize: 10, lineHeight: 17 },
  infoValue: { color: colors.text, flexShrink: 1, fontSize: 14, fontWeight: '600', lineHeight: 23, marginTop: 2 },
  infoHint: { color: colors.textMuted, fontSize: 10, lineHeight: 17, marginTop: 4 },
  editButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 15, flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center', marginTop: 23, minHeight: 54, paddingHorizontal: 16, paddingVertical: 15 },
  editText: { color: colors.white, flexShrink: 1, fontSize: 13, fontWeight: '700', lineHeight: 21, textAlign: 'center' },
  stageHint: { color: colors.textMuted, fontSize: 11, lineHeight: 19, marginTop: 10, textAlign: 'center' },
  editHeading: { gap: 5, marginBottom: 18 },
  footer: { alignItems: 'center', flexDirection: 'row', gap: 13, justifyContent: 'center', marginTop: 29 },
  footerLine: { backgroundColor: colors.border, height: 1, width: 38 }, mark: { height: 25, opacity: 0.6, width: 25 },
  pressed: { opacity: 0.75 },
});
