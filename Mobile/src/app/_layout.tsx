import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState } from 'react';
import { createApplicationRuntime } from '@/bootstrap/createApplicationServices';
import { AuthSessionProvider } from '@/features/auth/presentation/context/AuthSessionProvider';
import { FavoritesProvider } from '@/features/favorites/presentation/context/FavoritesProvider';
import { CartProvider } from '@/features/cart/presentation/context/CartProvider';
import { ProfileProvider } from '@/features/profile/presentation/context/ProfileProvider';
import { ShippingAddressesProvider } from '@/features/shippingAddresses/presentation/context/ShippingAddressesProvider';
import { OrderCreationProvider } from '@/features/orderCreation/presentation/context/OrderCreationProvider';
import { OrderHistoryProvider } from '@/features/orderHistory/presentation/context/OrderHistoryProvider';
import { colors } from '@/core/theme/colors';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

export default function RootLayout() {
  const reducedMotion = useReducedMotion();
  const [runtime] = useState(() => createApplicationRuntime());

  return (
    <SafeAreaProvider>
      <AuthSessionProvider session={runtime.session}>
        <FavoritesProvider controller={runtime.favorites}>
        <CartProvider controller={runtime.cart}>
        <ProfileProvider controller={runtime.profile}>
        <ShippingAddressesProvider controller={runtime.shippingAddresses}>
        <OrderCreationProvider controller={runtime.orderCreation}>
        <OrderHistoryProvider controller={runtime.orderHistory}>
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
          <Stack.Screen name="perfil-usuario" />
          <Stack.Screen name="direcciones-envio" />
          <Stack.Screen name="creacion-pedido" />
          <Stack.Screen name="historial-pedidos" />
        </Stack>
        </OrderHistoryProvider>
        </OrderCreationProvider>
        </ShippingAddressesProvider>
        </ProfileProvider>
        </CartProvider>
        </FavoritesProvider>
      </AuthSessionProvider>
    </SafeAreaProvider>
  );
}
