import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AccountButton } from '@/features/shell/presentation/components/AccountButton';
import { AppScreen } from '@/shared/components/AppScreen';
import type { MoreSectionId } from '../../domain/models/MoreContent';
import type { LoadMoreContent } from '../../domain/useCases/loadMoreContent';
import { MoreLoadState, MoreRow } from '../components/MoreControls';
import { useMoreViewModel } from '../viewModels/useMoreViewModel';

export function MoreScreen({ loadContent }: { loadContent: LoadMoreContent }) {
  const vm = useMoreViewModel(loadContent);
  function open(section: MoreSectionId) {
    router.push({ pathname: '/informacion/[section]', params: { section } });
  }

  return <AppScreen title="Más" eyebrow="INHALEX" trailing={<AccountButton />}>
    <View style={styles.welcome}>
      <View style={styles.welcomeCopy}>
        <Text accessibilityRole="header" style={styles.welcomeTitle}>Conoce, consulta, conecta.</Text>
        <Text style={styles.welcomeText}>Todo sobre INHALEX, a tu alcance.</Text>
      </View>
      <View accessible={false} style={styles.welcomeIcon}>
        <Ionicons name="leaf-outline" size={34} color={colors.primaryDark} />
      </View>
    </View>

    {!vm.content ? <MoreLoadState isLoading={vm.isLoading} message={vm.message} onRetry={vm.reload} /> : <>
      <Text accessibilityRole="header" style={styles.groupTitle}>Ayuda</Text>
      <View style={styles.group}>
        <MoreRow title="Preguntas frecuentes" description="Respuestas para orientarte" icon="help-circle-outline"
          onPress={() => open('preguntas-frecuentes')} />
        <MoreRow title="Contacto" description="Hablemos de lo que necesitas" icon="chatbubble-ellipses-outline"
          onPress={() => open('contacto')} last />
      </View>

      <Text accessibilityRole="header" style={styles.groupTitle}>Conoce INHALEX</Text>
      <View style={styles.group}>
        <MoreRow title="Nuestra empresa" description="Misión, visión y valores" icon="leaf-outline"
          onPress={() => open('empresa')} last />
      </View>

      <Text accessibilityRole="header" style={styles.groupTitle}>Legal</Text>
      <View style={styles.group}>
        <MoreRow title="Política de privacidad" icon="shield-checkmark-outline" onPress={() => open('privacidad')} />
        <MoreRow title="Términos y condiciones" icon="document-text-outline" onPress={() => open('terminos')} last />
      </View>
    </>}

    <View style={styles.accountGroup}>
      <MoreRow title="Mi cuenta" description="Tu perfil y tus pedidos" icon="person-outline"
        onPress={() => router.push('/cuenta')} last />
    </View>
  </AppScreen>;
}

const styles = StyleSheet.create({
  welcome: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderRadius: 24, borderWidth: 1, flexDirection: 'row', gap: 14, padding: 20 },
  welcomeCopy: { flex: 1, minWidth: 0 },
  welcomeTitle: { color: colors.primaryDark, fontSize: 20, fontWeight: '700', letterSpacing: -0.3, lineHeight: 27 },
  welcomeText: { color: colors.textMuted, fontSize: 13, lineHeight: 21, marginTop: 7 },
  welcomeIcon: { alignItems: 'center', borderColor: '#CADFCB', borderRadius: 20, borderWidth: 1, height: 60, justifyContent: 'center', width: 60 },
  groupTitle: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, lineHeight: 19, marginBottom: 9, marginLeft: 4, marginTop: 25 },
  group: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 21, borderWidth: 1, overflow: 'hidden' },
  accountGroup: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 21, borderWidth: 1, marginTop: 25, overflow: 'hidden' },
});
