import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AccountButton } from '@/features/shell/presentation/components/AccountButton';
import { AppScreen } from '@/shared/components/AppScreen';
import type { MoreSectionId } from '../../domain/models/MoreContent';
import type { LoadMoreContent } from '../../domain/useCases/loadMoreContent';
import { MoreLoadState, MoreRow } from '../components/MoreControls';
import { FloatingBrandMark, MoreEntrance } from '../components/MoreMotion';
import { useMoreViewModel } from '../viewModels/useMoreViewModel';

export function MoreScreen({ loadContent }: { loadContent: LoadMoreContent }) {
  const vm = useMoreViewModel(loadContent);
  function open(section: MoreSectionId) {
    router.push({ pathname: '/informacion/[section]', params: { section } });
  }

  return <AppScreen title="Más" eyebrow="INHALEX" trailing={<AccountButton />} animateContent={false}>
    <MoreEntrance>
      <View style={styles.welcome}>
        <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.halo} />
        <View style={styles.welcomeCopy}>
          <Text accessibilityRole="header" style={styles.welcomeTitle}>Conoce, consulta, conecta.</Text>
          <Text style={styles.welcomeText}>Todo sobre INHALEX, a tu alcance.</Text>
        </View>
        <View style={styles.welcomeIcon}>
          <FloatingBrandMark />
        </View>
      </View>
    </MoreEntrance>

    {!vm.content ? <MoreLoadState isLoading={vm.isLoading} message={vm.message} onRetry={vm.reload} /> : <>
      <MoreEntrance delay={40}>
        <Text accessibilityRole="header" style={styles.groupTitle}>Ayuda</Text>
        <View style={styles.group}>
          <MoreRow title="Preguntas frecuentes" description="Respuestas para orientarte" icon="help-circle-outline"
            onPress={() => open('preguntas-frecuentes')} />
          <MoreRow title="Contacto" description="Hablemos de lo que necesitas" icon="chatbubble-ellipses-outline"
            onPress={() => open('contacto')} last />
        </View>
      </MoreEntrance>

      <MoreEntrance delay={80}>
        <Text accessibilityRole="header" style={styles.groupTitle}>Conoce INHALEX</Text>
        <View style={styles.group}>
          <MoreRow title="Nuestra empresa" description="Misión, visión y valores" icon="leaf-outline"
            onPress={() => open('empresa')} last />
        </View>
      </MoreEntrance>

      <MoreEntrance delay={120}>
        <Text accessibilityRole="header" style={styles.groupTitle}>Legal</Text>
        <View style={styles.group}>
          <MoreRow title="Política de privacidad" icon="shield-checkmark-outline" onPress={() => open('privacidad')} />
          <MoreRow title="Términos y condiciones" icon="document-text-outline" onPress={() => open('terminos')} last />
        </View>
      </MoreEntrance>
    </>}

    <MoreEntrance delay={140}>
      <View style={styles.accountGroup}>
        <MoreRow title="Mi cuenta" description="Tu perfil y tus pedidos" icon="person-outline"
          onPress={() => router.push('/cuenta')} last />
      </View>
    </MoreEntrance>
  </AppScreen>;
}

const styles = StyleSheet.create({
  welcome: { alignItems: 'center', backgroundColor: colors.primaryDark, borderColor: '#34794D', borderRadius: 26, borderWidth: 1, flexDirection: 'row', gap: 16, overflow: 'hidden', padding: 22 },
  halo: { backgroundColor: 'rgba(103,195,165,0.12)', borderColor: 'rgba(191,233,199,0.18)', borderRadius: 105, borderWidth: 1, height: 210, position: 'absolute', right: -70, top: -90, width: 210 },
  welcomeCopy: { flex: 1, minWidth: 0 },
  welcomeTitle: { color: colors.white, fontSize: 22, fontWeight: '700', letterSpacing: -0.5, lineHeight: 29 },
  welcomeText: { color: '#D6E9D9', fontSize: 13, lineHeight: 21, marginTop: 9 },
  welcomeIcon: { flexShrink: 0, height: 78, width: 78 },
  groupTitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, lineHeight: 19, marginBottom: 9, marginLeft: 4, marginTop: 25 },
  group: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  accountGroup: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 21, borderWidth: 1, marginTop: 25, overflow: 'hidden' },
});
