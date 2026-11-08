import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AuthSessionProvider } from '@/features/auth/presentation/context/AuthSessionProvider';
import { OrderReceiptProvider } from '../presentation/context/OrderReceiptProvider';
import { OrderReceiptScreen } from '../presentation/screens/OrderReceiptScreen';
import { createReceiptFailureScenario } from './createReceiptFailureScenario';

type Scenario = ReturnType<typeof createReceiptFailureScenario>;

export function ReceiptDevelopmentScreen() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const active = useRef<Scenario | null>(null);
  const exit = useCallback(() => {
    active.current?.dispose();
    active.current = null;
    setScenario(null);
  }, []);
  // Leaving the route discards the fixture; reopening always returns to real data.
  useFocusEffect(useCallback(() => exit, [exit]));

  if (scenario) return <AuthSessionProvider session={scenario.authSession}>
    <OrderReceiptProvider controller={scenario.controller}>
      <OrderReceiptScreen onLeaveForTest={exit}
        developmentPanel={<ScenarioControls scenario={scenario} onExit={exit} />} />
    </OrderReceiptProvider>
  </AuthSessionProvider>;

  return <OrderReceiptScreen developmentPanel={<View style={styles.panel}>
    <Text style={styles.title}>Prueba de desarrollo</Text>
    <Text style={styles.copy}>Simula un fallo al confirmar con un pedido ficticio, sin modificar tus pedidos.</Text>
    <Control label="Probar fallo de confirmación" onPress={() => {
      const next = createReceiptFailureScenario();
      active.current = next;
      setScenario(next);
    }} />
  </View>} />;
}

function ScenarioControls({ scenario, onExit }: { scenario: Scenario; onExit(): void }) {
  const state = useSyncExternalStore(scenario.subscribe, scenario.getSnapshot, scenario.getSnapshot);
  const receipt = useSyncExternalStore(scenario.controller.subscribe, scenario.controller.getSnapshot, scenario.controller.getSnapshot);
  const busy = receipt.status === 'loading' || receipt.confirming || receipt.refreshing;
  return <View style={styles.panel}>
    <Text accessibilityRole="header" style={styles.title}>Prueba controlada · Pedido ficticio</Text>
    <Text style={styles.copy}>Solo en memoria. El backend real puede seguir encendido.</Text>
    <Text accessibilityLiveRegion="polite" style={styles.status}>
      {state.online ? state.confirmAttempts === 0 ? 'Fallo preparado para el primer intento' : 'Conexión simulada restablecida' : 'Conexión simulada interrumpida'}
    </Text>
    <Text style={styles.copy}>Intentos de confirmar: {state.confirmAttempts} · Recepciones guardadas: {state.confirmedReceipts}</Text>
    <Text style={styles.copy}>{state.confirmedReceipts > 0
      ? 'Recepción ficticia confirmada. Puedes actualizar para comprobar que se conserva o salir de la prueba.'
      : !state.online
      ? 'Prueba Verificar recepción. Después restablece la conexión simulada y vuelve a verificar.'
      : state.confirmAttempts === 0
        ? 'Abre DEMO-RECEPCION-01 y confirma. El primer intento fallará sin guardar.'
        : 'Verifica la recepción. Confirmar debe habilitarse sin enviarse automáticamente.'}</Text>
    {!state.online ? <Control label="Restablecer conexión simulada" disabled={busy} onPress={scenario.restoreConnection} /> : null}
    <Control label="Salir de la prueba" onPress={onExit} />
  </View>;
}

function Control({ label, onPress, disabled = false }: { label: string; onPress(): void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.control, (disabled || pressed) && styles.dim]}>
    <Text style={styles.controlLabel}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.warningSoft, borderColor: '#D2B976', borderWidth: 1, borderRadius: 16, padding: 14, gap: 6, marginBottom: 12 },
  title: { color: colors.text, fontSize: 14, fontWeight: '700', lineHeight: 21 },
  copy: { color: colors.text, fontSize: 12, lineHeight: 19 },
  status: { color: colors.primaryDark, fontSize: 12, fontWeight: '700', lineHeight: 19 },
  control: { minHeight: 44, padding: 10, justifyContent: 'center', backgroundColor: colors.white, borderRadius: 10, marginTop: 3 },
  controlLabel: { color: colors.primaryDark, fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 19 },
  dim: { opacity: 0.5 },
});
