import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AppScreen } from '@/shared/components/AppScreen';
import { SoftPressable } from '@/shared/components/Motion';
import type { LoadNoticesPreview } from '../../domain/useCases/loadNoticesPreview';
import type { NoticePreview } from '../../domain/models/NoticePreview';
import { useNoticesPreviewViewModel } from '../viewModels/useNoticesPreviewViewModel';
import { noticesStyles as styles } from './noticesStyles';

export function NoticesPreviewScreen({ action }: { action: LoadNoticesPreview }) {
  const vm = useNoticesPreviewViewModel(action);
  const selected = vm.selectedNotice;
  const goBack = () => selected ? vm.closeDetail()
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

    <View style={styles.preview}>
      <View style={styles.previewHeading}>
        <Ionicons accessible={false} aria-hidden name="color-palette-outline" size={16} color={colors.primaryDark} />
        <Text style={styles.previewTitle}>Vista previa</Text>
      </View>
      <Text style={styles.previewCopy}>Datos de ejemplo para revisar el diseño.</Text>
      <View style={styles.scenes}>
        {([
          ['inbox', 'Bandeja'], ['empty', 'Sin avisos'], ['error', 'Error de carga'],
        ] as const).map(([scene, label]) => <SoftPressable key={scene} accessibilityRole="button"
          accessibilityLabel={`Ver muestra: ${label}`} accessibilityState={{ selected: vm.scene === scene }} aria-pressed={vm.scene === scene}
          onPress={() => vm.selectScene(scene)} style={[styles.scene, vm.scene === scene && styles.sceneActive]}>
          <Text style={[styles.sceneLabel, vm.scene === scene && styles.sceneActiveLabel]}>{label}</Text>
        </SoftPressable>)}
      </View>
    </View>

    {selected ? <View style={styles.detail}>
      <View style={styles.detailTop}><NoticeIcon kind={selected.kind} /><ReadBadge read={selected.read} /></View>
      <Text style={styles.kindLabel}>{selected.kind === 'order' ? 'SOBRE TU PEDIDO' : 'SOBRE TU CUENTA'}</Text>
      <Text accessibilityRole="header" style={styles.detailTitle}>{selected.title}</Text>
      <Text style={styles.date}>{selected.dateLabel}</Text>
      <View style={styles.divider} />
      <Text selectable style={styles.message}>{selected.message}</Text>
      {selected.reference ? <View style={styles.reference}>
        <Ionicons accessible={false} aria-hidden name="receipt-outline" size={18} color={colors.primaryDark} />
        <Text selectable style={styles.referenceText}>Pedido de ejemplo · {selected.reference}</Text>
      </View> : null}
      <Text style={styles.footnote}>Esta muestra conserva su estado de lectura.</Text>
      <Action label="Volver a avisos" onPress={vm.closeDetail} />
    </View> : vm.error ? <View style={styles.empty}>
      <StateIcon name="cloud-offline-outline" />
      <Text accessibilityRole="header" style={styles.emptyTitle}>No pudimos cargar los avisos</Text>
      <Text style={styles.emptyCopy}>{vm.error}</Text>
      <Action label="Reintentar muestra" onPress={() => vm.selectScene('inbox')} />
    </View> : vm.items.length === 0 ? <View style={styles.empty}>
      <StateIcon name="notifications-off-outline" />
      <Text accessibilityRole="header" style={styles.emptyTitle}>Aún no tienes avisos</Text>
      <Text style={styles.emptyCopy}>Aquí encontrarás las novedades de tus pedidos y tu cuenta. Por ahora, disfruta de tu momento.</Text>
      <Action label="Volver a la muestra" onPress={() => vm.selectScene('inbox')} />
    </View> : <>
      <View style={styles.sectionHeading}>
        <View style={styles.sectionCopy}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>Tu bandeja</Text>
          <Text style={styles.sectionDescription}>{vm.unreadCount} sin leer · {vm.totalCount} avisos de ejemplo</Text>
        </View>
        <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.count}>
          <Text style={styles.countLabel}>{vm.unreadCount}</Text>
        </View>
      </View>
      <View style={styles.filters}>
        {([['all', 'Todos'], ['unread', 'No leídos']] as const).map(([filter, label]) => <SoftPressable key={filter}
          accessibilityRole="button" accessibilityState={{ selected: vm.filter === filter }} aria-pressed={vm.filter === filter} onPress={() => vm.setFilter(filter)}
          style={[styles.filter, vm.filter === filter && styles.filterActive]}>
          <Text style={[styles.filterLabel, vm.filter === filter && styles.filterActiveLabel]}>{label}</Text>
        </SoftPressable>)}
      </View>
      <View style={styles.list}>{vm.items.map((notice) => <SoftPressable key={notice.id} accessibilityRole="button"
        accessibilityLabel={`${notice.read ? 'Leído' : 'No leído'}. ${notice.title}. ${notice.dateLabel}. Abrir detalle de ejemplo.`}
        onPress={() => vm.selectNotice(notice.id)} style={[styles.card, !notice.read && styles.unreadCard]}>
        <View style={styles.cardTop}><NoticeIcon kind={notice.kind} /><ReadBadge read={notice.read} /></View>
        <Text style={styles.cardKind}>{notice.kind === 'order' ? 'Tu pedido' : 'Tu cuenta'}</Text>
        <Text style={styles.cardTitle}>{notice.title}</Text>
        <Text numberOfLines={2} style={styles.cardMessage}>{notice.message}</Text>
        <View style={styles.cardBottom}><Text style={styles.date}>{notice.dateLabel}</Text>
          <View style={styles.detailLink}><Text style={styles.detailLinkLabel}>Ver detalle</Text>
            <Ionicons accessible={false} aria-hidden name="arrow-forward" size={16} color={colors.primary} />
          </View>
        </View>
      </SoftPressable>)}</View>
      <Text style={styles.listFootnote}>Tus novedades, ordenadas de la más reciente a la anterior.</Text>
    </>}
  </AppScreen>;
}

function NoticeIcon({ kind }: { kind: NoticePreview['kind'] }) {
  return <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.noticeIcon}>
    <Ionicons name={kind === 'order' ? 'cube-outline' : 'leaf-outline'} size={23} color={colors.primaryDark} />
  </View>;
}

function ReadBadge({ read }: { read: boolean }) {
  return <View style={[styles.badge, read && styles.readBadge]}>
    {!read ? <View style={styles.badgeDot} /> : null}
    <Text style={[styles.badgeText, read && styles.readBadgeText]}>{read ? 'Leído' : 'Nuevo'}</Text>
  </View>;
}

function StateIcon({ name }: { name: 'cloud-offline-outline' | 'notifications-off-outline' }) {
  return <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden style={styles.emptyIcon}>
    <Ionicons name={name} size={30} color={colors.primary} />
  </View>;
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return <SoftPressable accessibilityRole="button" onPress={onPress} style={styles.action}>
    <Text style={styles.actionLabel}>{label}</Text>
    <Ionicons accessible={false} aria-hidden name="arrow-forward" size={18} color={colors.white} />
  </SoftPressable>;
}

