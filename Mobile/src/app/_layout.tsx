import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState } from 'react';
import { createApplicationAuthSession } from '@/bootstrap/createApplicationServices';
import { AuthSessionProvider } from '@/features/auth/presentation/context/AuthSessionProvider';
import { colors } from '@/core/theme/colors';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

export default function RootLayout() {
  const reducedMotion = useReducedMotion();
  const [session] = useState(() => createApplicationAuthSession());

  return (
    <SafeAreaProvider>
      <AuthSessionProvider session={session}>
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
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="lineas-categorias" />
          <Stack.Screen name="busqueda-productos" />
          <Stack.Screen name="producto/[id]" />
        </Stack>
      </AuthSessionProvider>
    </SafeAreaProvider>
  );
}
