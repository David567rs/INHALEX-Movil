import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { Reveal, SoftPressable } from '@/shared/components/Motion';
import type { ListProductLines } from '../../domain/useCases/listProductLines';
import { useProductLinesViewModel } from '../viewModels/useProductLinesViewModel';

export function ProductLinesScreen({ listLines }: { listLines: ListProductLines }) {
  const vm = useProductLinesViewModel(listLines);
  const { fontScale } = useWindowDimensions();
  const largeText = fontScale > 1.25;

  function returnToCatalog() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/catalogo');
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Reveal>
          <View style={styles.topBar}>
            <Pressable accessibilityRole="button" accessibilityLabel="Volver al catálogo"
              onPress={returnToCatalog} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Ionicons accessible={false} name="arrow-back" size={21} color={colors.primaryDark} />
            </Pressable>
            <Image accessibilityLabel="INHALEX, el respiro que alivia" resizeMode="contain"
              source={require('../../../../../assets/home/brand.png')} style={styles.brand} />
          </View>

          <View style={styles.heading}>
            <View style={styles.eyebrowRow}>
              <Text style={styles.eyebrow}>LÍNEAS INHALEX</Text>
            </View>
            <Text accessibilityRole="header" style={styles.title}>Encuentra{'\n'}tu línea<Text style={styles.dot}>.</Text></Text>
            <Text style={styles.description}>Una misma esencia, distintas formas de descubrirla. Explora los productos de cada línea.</Text>
          </View>

          <View style={styles.intro}>
            <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.botanical}>
              <View style={styles.botanicalCircle} />
              <Ionicons name="leaf-outline" size={43} color={colors.primary} />
            </View>
            <View style={styles.introCopy}>
              <Text style={styles.introEyebrow}>A TU RITMO</Text>
              <Text style={styles.introTitle}>Una colección para descubrir.</Text>
            </View>
          </View>

          <View style={styles.sectionHeading}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Nuestras líneas</Text>
            <Text style={styles.sectionDescription}>Elige una línea para explorar la colección.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Actualizar líneas"
            disabled={vm.status === 'loading' || vm.refreshing}
            accessibilityState={{ disabled: vm.status === 'loading' || vm.refreshing, busy: vm.refreshing }}
            onPress={() => { void vm.refresh(); }}
            style={({ pressed }) => [styles.refreshButton, pressed && styles.pressed]}>
            {vm.refreshing ? <ActivityIndicator color={colors.primary} /> : <Ionicons accessible={false} name="refresh-outline" size={17} color={colors.primary} />}
            <Text style={styles.refreshText}>{vm.refreshing ? 'Actualizando…' : 'Actualizar líneas'}</Text>
          </Pressable>
          {vm.error && vm.items.length > 0 && <Text accessibilityLiveRegion="polite" style={styles.notice}>
            {vm.error} Se conservan las últimas líneas cargadas.
          </Text>}
        </Reveal>

        {vm.items.length === 0 && <View accessibilityLiveRegion="polite" style={styles.statePanel}>
          {vm.status === 'loading' && <ActivityIndicator accessibilityLabel="Cargando líneas" color={colors.primary} size="large" />}
          <Text accessibilityRole="header" style={styles.stateTitle}>{vm.status === 'loading' ? 'Estamos preparando tus líneas'
            : vm.status === 'error' ? 'No pudimos cargar las líneas' : 'Nuevas líneas están por llegar'}</Text>
          <Text style={styles.stateCopy}>{vm.status === 'loading' ? 'Un momento para descubrir la colección.'
            : vm.status === 'error' ? vm.error : 'Por ahora no hay categorías disponibles. Puedes volver a consultar.'}</Text>
          {vm.status !== 'loading' && <Pressable accessibilityRole="button" onPress={() => { void vm.refresh(); }}
            style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}>
            <Text style={styles.retryText}>{vm.status === 'error' ? 'Reintentar' : 'Volver a consultar'}</Text>
          </Pressable>}
        </View>}
        <View accessibilityRole="radiogroup" accessibilityLabel="Líneas de INHALEX" style={styles.lines}>
          {vm.items.map((line, index) => (
            <Reveal key={line.id} delay={Math.min(index, 4) * 40}>
              <SoftPressable accessibilityRole="radio" accessibilityLabel={line.name}
                accessibilityState={{ checked: line.selected }} aria-checked={line.selected}
                onPress={() => vm.selectLine(line.id)}
                style={({ pressed }) => [styles.line, line.selected && styles.selectedLine, largeText && styles.largeLine, pressed && styles.pressed]}>
                <View accessible={false} importantForAccessibility="no-hide-descendants"
                  style={[styles.lineSymbol, line.selected && styles.selectedSymbol]}>
                  <Ionicons name="leaf-outline" size={23} color={line.selected ? colors.white : colors.primary} />
                </View>
                <View style={styles.lineCopy}>
                  <Text style={styles.lineNumber}>LÍNEA {line.number}</Text>
                  <Text style={[styles.lineTitle, line.selected && styles.selectedTitle]}>{line.title}</Text>
                  <Text style={styles.count}>{line.count} {line.count === 1 ? 'producto' : 'productos'}</Text>
                  {line.selected && <Text style={styles.selectedLabel}>Seleccionada</Text>}
                </View>
                <Ionicons accessible={false} name={line.selected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={23} color={line.selected ? colors.primary : '#9EAEA1'} />
              </SoftPressable>
            </Reveal>
          ))}
        </View>

        <View accessibilityLiveRegion="polite" style={styles.selectionNote}>
          <Text style={styles.selectionTitle}>{vm.selectedLine?.name ?? 'Una forma diferente de explorar'}</Text>
          <Text style={styles.selectionDescription}>{vm.selectedLine
            ? `${vm.selectedLine.count} ${vm.selectedLine.count === 1 ? 'producto en esta línea' : 'productos en esta línea'}. Consulta su colección para ver la disponibilidad actual.`
            : 'Selecciona una línea para ver sus productos.'}</Text>
        </View>

        <Pressable accessibilityRole="button" disabled={!vm.selectedLine}
          accessibilityLabel="Ver productos de la línea seleccionada"
          accessibilityState={{ disabled: !vm.selectedLine }}
          onPress={() => { if (vm.selectedLine) router.dismissTo({ pathname: '/(tabs)/catalogo',
            params: { category: vm.selectedLine.id, lineName: vm.selectedLine.name } }); }}
          style={({ pressed }) => [styles.returnButton, !vm.selectedLine && styles.disabled, pressed && styles.pressed]}>
          <Text style={styles.returnText}>Ver productos de esta línea</Text>
          <Ionicons accessible={false} name="arrow-forward" size={18} color={colors.white} />
        </Pressable>
        <View accessible={false} importantForAccessibility="no-hide-descendants" style={styles.signature}>
          <View style={styles.signatureLine} />
          <Image source={require('../../../../../assets/inhalex-mark.png')} resizeMode="contain" style={styles.mark} />
          <View style={styles.signatureLine} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { alignSelf: 'center', flexGrow: 1, maxWidth: 600, paddingHorizontal: 22, paddingBottom: 22, width: '100%' },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  backButton: { alignItems: 'center', backgroundColor: '#ECF3E7', borderColor: colors.border, borderRadius: 22, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  brand: { height: 42, width: 139 },
  heading: { marginTop: 30 },
  eyebrowRow: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1.7, lineHeight: 17 },
  refreshButton: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 8, minHeight: 44, marginBottom: 10 },
  refreshText: { color: colors.primary, fontSize: 12, fontWeight: '600' },
  count: { color: colors.textMuted, fontSize: 11, lineHeight: 18, marginTop: 3 },
  notice: { backgroundColor: '#F8EFE5', borderRadius: 12, color: '#79543B', fontSize: 12, lineHeight: 19, marginBottom: 14, padding: 12 },
  statePanel: { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 25 },
  stateTitle: { color: colors.text, fontSize: 18, fontWeight: '600', lineHeight: 25, marginTop: 12, textAlign: 'center' },
  stateCopy: { color: colors.textMuted, fontSize: 13, lineHeight: 21, marginTop: 9, textAlign: 'center' },
  retryButton: { backgroundColor: colors.primaryDark, borderRadius: 12, minHeight: 48, marginTop: 18, paddingHorizontal: 20, paddingVertical: 13 },
  retryText: { color: colors.white, fontSize: 13, fontWeight: '600' },
  disabled: { opacity: 0.45 },
  title: { color: colors.text, fontSize: 37, fontWeight: '700', letterSpacing: -1.3, lineHeight: 43, marginTop: 12 },
  dot: { color: colors.primary },
  description: { color: colors.textMuted, fontSize: 13, lineHeight: 21, marginTop: 11, maxWidth: 380 },
  intro: { alignItems: 'center', backgroundColor: '#EAF1E5', borderColor: '#DDE8D5', borderRadius: 23, borderWidth: 1, flexDirection: 'row', gap: 17, marginTop: 24, paddingHorizontal: 21, paddingVertical: 22 },
  botanical: { alignItems: 'center', height: 73, justifyContent: 'center', width: 73 },
  botanicalCircle: { backgroundColor: '#DAE7D2', borderRadius: 37, height: 73, position: 'absolute', width: 73 },
  introCopy: { flex: 1 },
  introEyebrow: { color: colors.primary, fontSize: 9, fontWeight: '700', letterSpacing: 1.4, lineHeight: 15 },
  introTitle: { color: colors.primaryDark, fontSize: 20, fontWeight: '600', letterSpacing: -0.4, lineHeight: 26, marginTop: 5 },
  sectionHeading: { marginBottom: 17, marginTop: 30 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '700', letterSpacing: -0.4, lineHeight: 26 },
  sectionDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 3 },
  lines: { gap: 11 },
  line: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 21, borderWidth: 1, flexDirection: 'row', gap: 14, minHeight: 94, paddingHorizontal: 17, paddingVertical: 17 },
  selectedLine: { backgroundColor: '#F0F6EB', borderColor: colors.primary },
  largeLine: { flexWrap: 'wrap' },
  lineSymbol: { alignItems: 'center', backgroundColor: '#EEF4E9', borderRadius: 15, height: 48, justifyContent: 'center', width: 48 },
  selectedSymbol: { backgroundColor: colors.primaryDark },
  lineCopy: { flex: 1, minWidth: 100 },
  lineNumber: { color: colors.textMuted, fontSize: 9, fontWeight: '600', letterSpacing: 1.2, lineHeight: 15 },
  lineTitle: { color: colors.text, fontSize: 17, fontWeight: '600', letterSpacing: -0.3, lineHeight: 24, marginTop: 2 },
  selectedTitle: { color: colors.primaryDark },
  selectedLabel: { color: colors.primary, fontSize: 10, fontWeight: '600', lineHeight: 16, marginTop: 3 },
  selectionNote: { borderLeftColor: '#B9CFAC', borderLeftWidth: 2, marginBottom: 21, marginTop: 24, paddingHorizontal: 14, paddingVertical: 2 },
  selectionTitle: { color: colors.primaryDark, fontSize: 13, fontWeight: '600', lineHeight: 20 },
  selectionDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 19, marginTop: 4 },
  returnButton: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 15, flexDirection: 'row', gap: 14, justifyContent: 'center', minHeight: 51, paddingHorizontal: 19, paddingVertical: 15 },
  returnText: { color: colors.white, flexShrink: 1, fontSize: 13, fontWeight: '600', lineHeight: 20, textAlign: 'center' },
  signature: { alignItems: 'center', flexDirection: 'row', gap: 14, justifyContent: 'center', marginTop: 26 },
  signatureLine: { backgroundColor: colors.border, height: 1, width: 42 },
  mark: { height: 25, opacity: 0.65, width: 25 },
  pressed: { opacity: 0.65 },
});
