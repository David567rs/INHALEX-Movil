import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AppScreen } from '@/shared/components/AppScreen';
import { SoftPressable } from '@/shared/components/Motion';
import type { Notice } from '../../domain/models/Notice';
import { useNoticesViewModel, formatNoticeDate as formatDate, noticeTypeLabel } from '../viewModels/useNoticesViewModel';
import { noticesStyles as styles } from './noticesStyles';

export function NoticesScreen() {
  const vm = useNoticesViewModel();
  const selected = vm.selectedNotice;
  const hasUnreadOutsideList = vm.unread !== null && vm.unread > 0;
  const gated = vm.status === 'anonymous' || vm.status === 'recovery-error' || vm.status === 'session-expired';
  const goBack = () => selected ? vm.selectNotice(null)
    : router.canGoBack() ? router.back() : router.navigate('/cuenta');

  return <AppScreen title="Avisos" eyebrow="Siempre cerca de ti" includeBottomInset
    action={<SoftPressable accessibilityRole="button" accessibilityLabel={selected ? 'Volver a la bandeja de avisos' : 'Volver a Cuenta'}
      onPress={goBack} style={styles.back}>
      <Ionicons accessible={false} aria-hidden name="arrow-back" size={21} color={colors.primaryDark} />
    </SoftPressable>}>
    <View style={styles.hero}>
      <View style={styles.heroCopy}>
        <Text style={styles.overline}>TU BANDEJA INHALEX</Text>
        <Text accessibilityRole="header" style={styles.heroTitle}>{'Las novedades,\na tu ritmo.'}</Text>
        <Text style={styles.heroDescription}>Un espacio para los avisos de tus pedidos y tu cuenta.</Text>
      </View>
      <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.heroIcon}>
        <Ionicons name="notifications-outline" size={30} color={colors.primaryDark} />
        <View style={styles.iconDot} />
      </View>
    </View>

    {vm.status === 'checking' ? <Loading label="Comprobando tu sesión…" /> : gated ? <View style={styles.empty}>
      <StateIcon name="person-circle-outline" />
      <Text accessibilityRole="header" style={styles.emptyTitle}>Tus novedades empiezan contigo</Text>
      <Text accessibilityLiveRegion="polite" style={styles.emptyCopy}>{vm.error || 'Inicia sesión para consultar los avisos de tu cuenta.'}</Text>
      {vm.status === 'recovery-error' ? <Action label="Reintentar sesión" onPress={() => void vm.restoreSession()} />
        : <Action label={vm.openingSignIn ? 'Abriendo…' : 'Iniciar sesión'} disabled={vm.openingSignIn}
          onPress={() => void vm.prepareSignIn().then((ready) => { if (ready) router.push('/sign-in'); })} />}
    </View> : vm.status === 'loading' ? <Loading label="Consultando tus avisos…" /> : <>
      <SoftPressable accessibilityRole="button" accessibilityLabel="Actualizar avisos"
        accessibilityState={{ disabled: !vm.canRefresh, busy: vm.refreshing }} disabled={!vm.canRefresh}
        onPress={() => void vm.refresh()} style={[styles.refresh, !vm.canRefresh && styles.disabled]}>
        <Ionicons accessible={false} aria-hidden name="refresh-outline" size={18} color={colors.primary} />
        <Text accessibilityLiveRegion="polite" style={styles.refreshLabel}>{vm.refreshing ? 'Actualizando…' : 'Actualizar avisos'}</Text>
      </SoftPressable>
      {vm.error ? <View style={styles.notice}>
        <Text accessibilityRole="alert" style={styles.noticeCopy}>{vm.error}</Text>
        <Action label="Reintentar" secondary disabled={!vm.canRefresh} onPress={() => void vm.refresh()} />
      </View> : null}

      {selected ? <View style={styles.detail}>
        <View style={styles.detailTop}><NoticeIcon type={selected.type} /><ReadBadge read={selected.readAt !== null} /></View>
        <Text style={styles.kindLabel}>{noticeTypeLabel(selected.type).toLocaleUpperCase('es-MX')}</Text>
        <Text accessibilityRole="header" style={styles.detailTitle}>{selected.title}</Text>
        <Text style={styles.date}>{formatDate(selected.createdAt)}</Text>
        <View style={styles.divider} />
        <Text selectable style={styles.message}>{selected.message}</Text>
        {selected.readAt ? <Text style={styles.footnote}>Leído el {formatDate(selected.readAt)}</Text> : null}
        {vm.readError ? <Text accessibilityRole="alert" style={styles.readError}>{vm.readError}</Text> : null}
        {!selected.readAt ? <Action label={vm.markingReadId === selected.id ? 'Marcando como leído…'
          : vm.readError ? 'Intentar marcar como leído' : 'Marcar como leído'} disabled={!vm.canMarkRead}
          busy={vm.markingReadId === selected.id} onPress={() => void vm.markSelectedRead()} /> : null}
        <Action label="Volver a avisos" secondary onPress={() => vm.selectNotice(null)} />
      </View> : vm.isEmpty ? <View style={styles.empty}>
        <StateIcon name="notifications-off-outline" />
        <Text accessibilityRole="header" style={styles.emptyTitle}>{hasUnreadOutsideList
          ? 'No hay avisos recientes disponibles' : 'Aún no tienes avisos'}</Text>
        <Text style={styles.emptyCopy}>{hasUnreadOutsideList
          ? `Tienes ${vm.unread} avisos sin leer en tu cuenta. Actualiza la bandeja para consultar los recientes.`
          : 'Aquí encontrarás las novedades de tus pedidos y tu cuenta. Por ahora, disfruta de tu momento.'}</Text>
        {hasUnreadOutsideList ? <Action label="Volver a consultar" disabled={!vm.canRefresh} onPress={() => void vm.refresh()} />
          : <Action label="Explorar catálogo" onPress={() => router.navigate('/catalogo')} />}
      </View> : vm.totalLoaded > 0 ? <>
        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Tu bandeja</Text>
            <Text accessibilityLiveRegion="polite" style={styles.sectionDescription}>{vm.unread === null
              ? 'Actualiza para consultar cuántos quedan sin leer.' : `${vm.unread} sin leer en tu cuenta`}</Text>
          </View>
          <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.count}>
            <Text style={styles.countLabel}>{vm.unread ?? '—'}</Text>
          </View>
        </View>
        <Text style={styles.scopeNote}>Se muestran hasta 12 avisos recientes. El filtro se aplica a esta lista.</Text>
        <View style={styles.filters}>
          {([['all', 'Todos'], ['unread', 'No leídos']] as const).map(([filter, label]) => <SoftPressable key={filter}
            accessibilityRole="button" accessibilityState={{ selected: vm.filter === filter, disabled: vm.busy }}
            aria-pressed={vm.filter === filter} disabled={vm.busy} onPress={() => vm.selectFilter(filter)}
            style={[styles.filter, vm.filter === filter && styles.filterActive, vm.busy && styles.disabled]}>
            <Text style={[styles.filterLabel, vm.filter === filter && styles.filterActiveLabel]}>{label}</Text>
          </SoftPressable>)}
        </View>
        {vm.isFilterEmpty ? <View style={styles.empty}>
          <StateIcon name="checkmark-done-outline" />
          <Text accessibilityRole="header" style={styles.emptyTitle}>Tus avisos recientes están al día</Text>
          <Text style={styles.emptyCopy}>No hay avisos sin leer entre los recientes.{vm.unread !== null && vm.unread > 0
            ? ' El contador de tu cuenta incluye también avisos anteriores.' : ''}</Text>
          <Action label="Ver todos los recientes" onPress={() => vm.selectFilter('all')} />
        </View> : <View style={styles.list}>{vm.items.map((notice) => <SoftPressable key={notice.id} accessibilityRole="button"
          accessibilityLabel={`${notice.readAt ? 'Leído' : 'No leído'}. ${notice.title}. ${formatDate(notice.createdAt)}. Abrir detalle.`}
          onPress={() => vm.selectNotice(notice.id)} style={[styles.card, !notice.readAt && styles.unreadCard]}>
          <View style={styles.cardTop}><NoticeIcon type={notice.type} /><ReadBadge read={notice.readAt !== null} /></View>
          <Text style={styles.cardKind}>{noticeTypeLabel(notice.type)}</Text>
          <Text style={styles.cardTitle}>{notice.title}</Text>
          <Text numberOfLines={2} style={styles.cardMessage}>{notice.message}</Text>
          <View style={styles.cardBottom}><Text style={styles.date}>{formatDate(notice.createdAt)}</Text>
            <View style={styles.detailLink}><Text style={styles.detailLinkLabel}>Ver detalle</Text>
              <Ionicons accessible={false} aria-hidden name="arrow-forward" size={16} color={colors.primary} />
            </View>
          </View>
        </SoftPressable>)}</View>}
        <Text style={styles.listFootnote}>Las novedades más recientes aparecen primero.</Text>
      </> : null}
    </>}
  </AppScreen>;
}

function NoticeIcon({ type }: { type: Notice['type'] }) {
  const name = type === 'order' ? 'cube-outline' : type === 'review' ? 'star-outline' : 'leaf-outline';
  return <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.noticeIcon}>
    <Ionicons name={name} size={23} color={colors.primaryDark} />
  </View>;
}

function ReadBadge({ read }: { read: boolean }) {
  return <View style={[styles.badge, read && styles.readBadge]}>
    {!read ? <View style={styles.badgeDot} /> : null}
    <Text style={[styles.badgeText, read && styles.readBadgeText]}>{read ? 'Leído' : 'Nuevo'}</Text>
  </View>;
}

function StateIcon({ name }: { name: 'person-circle-outline' | 'notifications-off-outline' | 'checkmark-done-outline' }) {
  return <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.emptyIcon}>
    <Ionicons name={name} size={30} color={colors.primary} />
  </View>;
}

function Loading({ label }: { label: string }) {
  return <View style={styles.empty}><ActivityIndicator color={colors.primary} size="large" />
    <Text accessibilityLiveRegion="polite" style={styles.emptyCopy}>{label}</Text></View>;
}

function Action({ label, onPress, disabled = false, secondary = false, busy = false }: {
  label: string; onPress: () => void; disabled?: boolean; secondary?: boolean; busy?: boolean;
}) {
  return <SoftPressable accessibilityRole="button" accessibilityState={{ disabled, busy }} disabled={disabled}
    onPress={onPress} style={[styles.action, secondary && styles.secondaryAction, disabled && styles.disabled]}>
    <Text style={[styles.actionLabel, secondary && styles.secondaryLabel]}>{label}</Text>
    <Ionicons accessible={false} aria-hidden name="arrow-forward" size={18} color={secondary ? colors.primaryDark : colors.white} />
  </SoftPressable>;
}
