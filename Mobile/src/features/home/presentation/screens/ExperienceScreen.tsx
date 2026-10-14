import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors } from '@/core/theme/colors';
import { AppScreen } from '@/shared/components/AppScreen';
import { SoftPressable } from '@/shared/components/Motion';

export default function ExperienceScreen() {
  const { fontScale } = useWindowDimensions();

  return (
    <AppScreen
      title="La experiencia"
      eyebrow="INHALEX"
      includeBottomInset
      action={(
        <Pressable
          accessibilityLabel="Volver al inicio"
          accessibilityRole="button"
          onPress={() => router.navigate('/(tabs)')}
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
        >
          <Ionicons name="arrow-back" size={21} color={colors.primaryDark} />
        </Pressable>
      )}
    >
      <Text accessibilityRole="header" style={styles.title}>Elige tu aroma.{'\n'}Haz tuya la pausa.</Text>
      <Text style={styles.body}>
        INHALEX reúne perfiles florales, herbales, frescos y especiados en un formato práctico para acompañar tus momentos cotidianos.
      </Text>
      <View style={styles.artwork}>
        <Image
          accessibilityLabel="Guía de uso INHALEX: aplica, frota e inhala"
          source={require('../../../../../assets/home/usage-guide.jpg')}
          resizeMode="contain"
          style={styles.guideImage}
        />
      </View>
      <View style={[styles.steps, fontScale > 1.4 && styles.stepsStacked]}>
        {['Aplica', 'Frota', 'Inhala'].map((step, index) => (
          <View key={step} style={styles.step}>
            <Text style={styles.stepNumber}>0{index + 1}</Text>
            <Text style={styles.stepLabel}>{step}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.body}>
        Consulta la información y las indicaciones específicas de cada producto para conocer su presentación y perfil aromático.
      </Text>
      <SoftPressable accessibilityRole="button" onPress={() => router.navigate('/(tabs)')} style={styles.button}>
        <Text style={styles.buttonLabel}>Volver al inicio</Text>
        <Ionicons name="arrow-forward" color={colors.white} size={18} />
      </SoftPressable>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  back: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 22, height: 44, justifyContent: 'center', marginLeft: 8, width: 44 },
  pressed: { opacity: 0.7 },
  title: { color: colors.primaryDark, fontSize: 29, fontWeight: '700', letterSpacing: -0.7, lineHeight: 35, marginBottom: 13 },
  body: { color: colors.textMuted, fontSize: 14, lineHeight: 23 },
  artwork: { aspectRatio: 1000 / 558, backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: 1, marginTop: 24, overflow: 'hidden' },
  guideImage: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  steps: { flexDirection: 'row', gap: 10, marginBottom: 23, marginTop: 17 },
  stepsStacked: { flexDirection: 'column' },
  step: { backgroundColor: colors.surfaceSoft, borderRadius: 14, flex: 1, padding: 14 },
  stepNumber: { color: colors.primary, fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  stepLabel: { color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 5 },
  button: { alignItems: 'center', backgroundColor: colors.primaryDark, borderRadius: 15, flexDirection: 'row', gap: 13, justifyContent: 'center', marginTop: 24, minHeight: 50, paddingHorizontal: 18, paddingVertical: 14 },
  buttonLabel: { color: colors.white, flexShrink: 1, fontSize: 14, fontWeight: '700' },
});
