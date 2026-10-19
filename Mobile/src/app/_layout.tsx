import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState } from 'react';
import { createApplicationRuntime } from '@/bootstrap/createApplicationServices';
import { AuthSessionProvider } from '@/features/auth/presentation/context/AuthSessionProvider';
import { FavoritesProvider } from '@/features/favorites/presentation/context/FavoritesProvider';
import { colors } from '@/core/theme/colors';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

export default function RootLayout() {
  const reducedMotion = useReducedMotion();
  const [runtime] = useState(() => createApplicationRuntime());

  return (
    <SafeAreaProvider>
      <AuthSessionProvider session={runtime.session}>
        <FavoritesProvider controller={runtime.favorites}>
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
        </FavoritesProvider>
      </AuthSessionProvider>
    </SafeAreaProvider>
  );
}
