import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import type { CatalogProduct } from '@/features/catalog/domain/models/Catalog';
import { useCartViewModel } from '../viewModels/useCartViewModel';

export function AddToCartButton({ product }: { product: CatalogProduct }) {
  const vm = useCartViewModel();
  const quantity = vm.cart?.items.find((item) => item.productId === product.id)?.quantity ?? 0;
  const pending = vm.pendingProductId !== null;
  const busy = vm.busy || vm.refreshing || pending || vm.openingSignIn;
  let label: string;
  let disabled = busy;
  let onPress: () => void;
  if (vm.status === 'anonymous' || vm.status === 'session-expired') {
    label = vm.openingSignIn ? 'Abriendo…' : 'Iniciar sesión para agregar';
    onPress = () => { void vm.prepareSignIn().then((open) => { if (open) router.push('/sign-in'); }); };
  } else if (vm.status === 'recovery-error') {
    label = 'Reintentar sesión';
    onPress = () => { void vm.restoreSession(); };
  } else if (busy) {
    label = pending ? 'Actualizando bolsa…' : 'Cargando bolsa…';
    onPress = () => {};
  } else if (!vm.canMutate) {
    label = 'Reintentar bolsa';
    disabled = !vm.canRefresh;
    onPress = () => { void vm.refresh(); };
  } else {
    label = !product.inStock ? 'Producto agotado' : quantity >= 25 ? 'Máximo de 25 unidades' : 'Agregar a mi bolsa';
    disabled = !product.inStock || quantity >= 25;
    onPress = () => { void vm.add(product); };
  }
  const needsSession = vm.status === 'session-expired' || vm.status === 'recovery-error';
  return <View style={styles.container}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${product.name}`}
      accessibilityState={{ disabled, busy }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => [styles.button, disabled && styles.disabled, pressed && styles.pressed]}>
      {busy ? <ActivityIndicator color={colors.white} size="small" />
        : <Ionicons accessible={false} name="bag-add-outline" size={21} color={colors.white} />}
      <Text style={styles.label}>{label}</Text>
    </Pressable>
    {needsSession && <Text accessibilityLiveRegion="polite" style={styles.hint}>{vm.error}</Text>}
    {!needsSession && (vm.error || vm.mutationError) && <Text accessibilityLiveRegion="polite" style={styles.error}>{vm.mutationError || vm.error}</Text>}
    {vm.notice && !needsSession && <Text accessibilityLiveRegion="polite" style={styles.hint}>{vm.notice}</Text>}
  </View>;
}

const styles = StyleSheet.create({
  container: { marginTop: 16 },
  button: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 16, flexDirection: 'row',
    flexWrap: 'wrap', gap: 9, justifyContent: 'center', minHeight: 54, paddingHorizontal: 15, paddingVertical: 14 },
  label: { color: colors.white, flexShrink: 1, fontSize: 13, fontWeight: '700', lineHeight: 22, textAlign: 'center' },
  hint: { color: colors.textMuted, fontSize: 12, lineHeight: 20, marginTop: 9 },
  error: { color: colors.danger, fontSize: 12, lineHeight: 20, marginTop: 9 },
  disabled: { opacity: 0.6 }, pressed: { opacity: 0.75 },
});
