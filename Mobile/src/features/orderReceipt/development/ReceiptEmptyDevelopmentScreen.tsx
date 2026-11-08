import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AuthSessionProvider } from '@/features/auth/presentation/context/AuthSessionProvider';
import { OrderReceiptProvider } from '../presentation/context/OrderReceiptProvider';
import { OrderReceiptScreen } from '../presentation/screens/OrderReceiptScreen';
import { createReceiptEmptyScenario } from './createReceiptEmptyScenario';

type EmptyScenario = ReturnType<typeof createReceiptEmptyScenario>;

export function ReceiptEmptyDevelopmentScreen() {
  const [scenario, setScenario] = useState<EmptyScenario | null>(null);
  const active = useRef<EmptyScenario | null>(null);
  const exit = useCallback(() => {
    active.current?.dispose();
    active.current = null;
    setScenario(null);
  }, []);

  // Leaving for the real history discards the fake providers and pending work.
  useFocusEffect(useCallback(() => exit, [exit]));

  if (scenario) return <AuthSessionProvider session={scenario.authSession}>
    <OrderReceiptProvider controller={scenario.controller}>
      <OrderReceiptScreen developmentPanel={<View style={styles.panel}>
        <Text accessibilityRole="header" style={styles.title}>Prueba controlada · Recepciones vacías</Text>
        <Text style={styles.copy}>Lista ficticia en memoria. Tus pedidos reales siguen intactos. Ver mis pedidos abre tu Historial y termina esta prueba.</Text>
        <TestButton label="Salir de la prueba" onPress={exit} />
      </View>} />
    </OrderReceiptProvider>
  </AuthSessionProvider>;

  return <OrderReceiptScreen developmentPanel={<View style={styles.panel}>
    <Text accessibilityRole="header" style={styles.title}>Prueba de desarrollo</Text>
    <Text style={styles.copy}>Comprueba el estado vacío sin cambiar tus pedidos ni tu sesión.</Text>
    <TestButton label="Probar recepciones vacías" onPress={() => {
      if (active.current) return;
      const next = createReceiptEmptyScenario();
      active.current = next;
      setScenario(next);
    }} />
  </View>} />;
}

function TestButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" onPress={onPress}
    style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
    <Text style={styles.buttonText}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.warningSoft, borderColor: '#D2B976', borderWidth: 1,
    borderRadius: 16, padding: 14, gap: 6, marginBottom: 12 },
  title: { color: colors.text, fontSize: 14, fontWeight: '700' },
  copy: { color: colors.text, fontSize: 12, lineHeight: 19 },
  button: { minHeight: 44, backgroundColor: colors.white, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: colors.primaryDark, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.7 },
});
