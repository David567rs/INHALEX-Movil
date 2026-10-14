import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AppScreen, ModuleCard } from '@/shared/components/AppScreen';
import { SoftPressable } from '@/shared/components/Motion';

const sections = {
  catalogo: {
    title: 'Catálogo',
    eyebrow: 'Nuestra colección',
    icon: 'leaf-outline',
    heading: 'Encuentra tu aroma',
    description: 'Estamos preparando el catálogo. Aquí podrás conocer los aromas, sus líneas y la información de cada producto.',
  },
  favoritos: {
    title: 'Favoritos',
    eyebrow: 'Tu selección',
    icon: 'heart-outline',
    heading: 'Un espacio para tus aromas',
    description: 'Estamos preparando tus favoritos. Más adelante podrás guardar los aromas que quieras tener a la mano.',
  },
  bolsa: {
    title: 'Bolsa',
    eyebrow: 'Tu próxima pausa',
    icon: 'bag-outline',
    heading: 'Tu bolsa empieza aquí',
    description: 'Estamos preparando la bolsa de compras. Más adelante podrás reunir tus productos y continuar con tu pedido.',
  },
  cuenta: {
    title: 'Cuenta',
    eyebrow: 'Un momento para ti',
    icon: 'person-outline',
    heading: 'Bienvenido a INHALEX',
    description: 'Estamos preparando el acceso a tu cuenta. Aquí podrás registrarte, iniciar sesión y administrar tu información.',
  },
} as const;

export function PreparationScreen({ section }: { section: keyof typeof sections }) {
  const content = sections[section];

  return (
    <AppScreen title={content.title} eyebrow={content.eyebrow}>
      <View style={styles.status}>
        <View style={styles.statusDot} />
        <Text style={styles.statusLabel}>EN PREPARACIÓN</Text>
      </View>
      <ModuleCard
        icon={<Ionicons accessible={false} color={colors.primary} name={content.icon} size={29} />}
        title={content.heading}
        description={content.description}
      />
      <View style={styles.actions}>
        <SoftPressable
          accessibilityRole="button"
          onPress={() => router.navigate('/(tabs)')}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Ionicons name="home-outline" size={19} color={colors.white} />
          <Text style={styles.buttonLabel}>Volver al inicio</Text>
        </SoftPressable>
        <SoftPressable
          accessibilityRole="button"
          onPress={() => router.push('/experiencia')}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryLabel}>Conocer INHALEX</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.primaryDark} />
        </SoftPressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  status: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.surfaceSoft, borderRadius: 14, flexDirection: 'row', gap: 7, marginBottom: 18, paddingHorizontal: 12, paddingVertical: 8 },
  statusDot: { backgroundColor: colors.primary, borderRadius: 4, height: 6, width: 6 },
  statusLabel: { color: colors.primaryDark, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  actions: { gap: 12, marginTop: 24 },
  button: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 15, flexDirection: 'row', gap: 10, justifyContent: 'center', minHeight: 50, paddingHorizontal: 18, paddingVertical: 14 },
  buttonLabel: { color: colors.white, flexShrink: 1, fontSize: 14, fontWeight: '700' },
  secondaryButton: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 15, borderWidth: 1, flexDirection: 'row', gap: 10, justifyContent: 'center', minHeight: 50, paddingHorizontal: 18, paddingVertical: 14 },
  secondaryLabel: { color: colors.primaryDark, flexShrink: 1, fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
