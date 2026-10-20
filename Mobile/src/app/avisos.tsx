import { NoticesScreen } from '@/features/notices/presentation/screens/NoticesScreen';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';

export default function NoticesRoute() {
  return <View style={{ flex: 1 }}>
    {__DEV__ ? <SafeAreaView edges={['top']} style={{ backgroundColor: colors.warningSoft }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Probar bandeja vacía"
        onPress={() => router.push('/qa-avisos-vacio')}
        style={{ minHeight: 44, padding: 12, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.primaryDark, fontSize: 12, fontWeight: '700' }}>Probar bandeja vacía · Prueba controlada</Text>
      </Pressable>
    </SafeAreaView> : null}
    <NoticesScreen />
  </View>;
}
