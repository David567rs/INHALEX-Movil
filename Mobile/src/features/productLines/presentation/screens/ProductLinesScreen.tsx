import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
              <View style={styles.previewBadge}><Text style={styles.previewText}>Vista previa</Text></View>
            </View>
            <Text accessibilityRole="header" style={styles.title}>Encuentra{'\n'}tu línea<Text style={styles.dot}>.</Text></Text>
            <Text style={styles.description}>Cinco líneas, una misma esencia. Conoce los nombres que dan forma a nuestra colección.</Text>
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
        </Reveal>

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
            ? 'Esta línea forma parte de la colección INHALEX.'
            : 'Cada línea es parte de nuestra identidad. Elige la que quieras conocer primero.'}</Text>
        </View>

        <Pressable accessibilityRole="button" onPress={returnToCatalog}
          style={({ pressed }) => [styles.returnButton, pressed && styles.pressed]}>
          <Text style={styles.returnText}>Volver al catálogo</Text>
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
  previewBadge: { backgroundColor: '#EAF0E4', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  previewText: { color: colors.primaryDark, fontSize: 10, fontWeight: '600', lineHeight: 15 },
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
