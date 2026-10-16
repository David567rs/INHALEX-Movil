import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

export default function RootLayout() {
  const reducedMotion = useReducedMotion();

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        initialRouteName="(tabs)"
        screenOptions={{
          animation: reducedMotion === false ? 'fade_from_bottom' : 'none',
          contentStyle: { backgroundColor: colors.background },
          headerShown: false,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="experiencia" />
        <Stack.Screen name="register" />
      </Stack>
    </SafeAreaProvider>
  );
}
