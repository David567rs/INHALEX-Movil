import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import type { CatalogProduct } from '@/features/catalog/domain/models/Catalog';
import { useFavoritesViewModel } from '../viewModels/useFavoritesViewModel';

export function FavoriteProductButton({ product }: { product: CatalogProduct }) {
  const vm = useFavoritesViewModel();
  const saved = vm.products.some((favorite) => favorite.id === product.id);
  const pending = vm.pendingProductIds.includes(product.id);
  const busy = vm.busy || vm.refreshing || pending || vm.openingSignIn;
  let label: string;
  let accessibilityLabel: string;
  let disabled = busy;
  let onPress: () => void;

  if (vm.status === 'anonymous' || vm.status === 'session-expired') {
    label = vm.openingSignIn ? 'Abriendo…' : 'Iniciar sesión para guardar';
    accessibilityLabel = `Iniciar sesión para guardar ${product.name} en favoritos`;
    onPress = () => {
      void vm.prepareSignIn().then((open) => { if (open) router.push('/sign-in'); });
    };
  } else if (vm.status === 'recovery-error') {
    label = 'Reintentar sesión';
    accessibilityLabel = 'Reintentar sesión para consultar favoritos';
    onPress = () => { void vm.restoreSession(); };
  } else if (busy) {
    label = pending ? saved ? 'Quitando de favoritos…' : 'Guardando en favoritos…' : 'Cargando favoritos…';
    accessibilityLabel = label;
    onPress = () => {};
  } else if (!vm.loaded || vm.status !== 'ready') {
    label = 'Reintentar favoritos';
    accessibilityLabel = 'Reintentar carga de favoritos antes de guardar o quitar';
    disabled = !vm.canRefresh;
    onPress = () => { void vm.refresh(); };
  } else {
    label = saved ? 'Quitar de favoritos' : 'Guardar en favoritos';
    accessibilityLabel = `${saved ? 'Quitar' : 'Guardar'} ${product.name} ${saved ? 'de' : 'en'} favoritos`;
    disabled = !vm.canMutate;
    onPress = () => { void (saved ? vm.remove(product.id) : vm.add(product)); };
  }

  const sessionHint = vm.status === 'session-expired' ? 'Tu sesión ya no está disponible. Vuelve a iniciar sesión.'
    : vm.status === 'recovery-error' ? 'No pudimos comprobar tu sesión. Comprueba tu conexión e inténtalo de nuevo.' : null;

  return <View style={styles.container}>
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled, busy, selected: vm.loaded && saved }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.button, saved && styles.savedButton, disabled && styles.disabled, pressed && styles.pressed]}>
      {busy ? <ActivityIndicator color={colors.primaryDark} size="small" />
        : <Ionicons accessible={false} name={saved ? 'heart' : 'heart-outline'} size={21} color={colors.primaryDark} />}
      <Text accessibilityLiveRegion="polite" style={styles.label}>{label}</Text>
    </Pressable>
    {sessionHint && <Text accessibilityLiveRegion="polite" style={styles.hint}>{sessionHint}</Text>}
    {!sessionHint && vm.error && <Text accessibilityLiveRegion="polite" style={styles.error}>{vm.error}</Text>}
    {vm.mutationError && <Text accessibilityLiveRegion="polite" style={styles.error}>{vm.mutationError}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  container: { marginTop: 20 },
  button: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center', minHeight: 54, paddingHorizontal: 15, paddingVertical: 14 },
  savedButton: { backgroundColor: colors.surfaceSoft, borderColor: colors.primary },
  label: { color: colors.primaryDark, flexShrink: 1, fontSize: 13, fontWeight: '700', lineHeight: 22, textAlign: 'center' },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 20, marginTop: 9 },
  error: { color: colors.danger, fontSize: 12, lineHeight: 20, marginTop: 9 },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.75 },
});
