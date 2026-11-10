import type { PropsWithChildren, ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { Reveal } from './Motion';
import { ScreenHeader } from './ScreenHeader';

interface AppScreenProps extends PropsWithChildren {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  trailing?: ReactNode;
  includeBottomInset?: boolean;
  animateContent?: boolean;
}

export function AppScreen({ title, eyebrow, action, trailing, includeBottomInset = false, animateContent = true, children }: AppScreenProps) {
  const content = <>
    <ScreenHeader title={title} eyebrow={eyebrow} leading={action ?? <Image
      accessibilityLabel="INHALEX"
      resizeMode="contain"
      source={require('../../../assets/inhalex-mark.png')}
      style={styles.mark}
    />} trailing={trailing} />
    {children}
  </>;

  return (
    <SafeAreaView edges={includeBottomInset ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {animateContent ? <Reveal>{content}</Reveal> : <View>{content}</View>}
      </ScrollView>
    </SafeAreaView>
  );
}

export function ModuleCard({ icon, title, description }: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>{icon}</View>
      <Text accessibilityRole="header" style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  content: { alignSelf: 'center', flexGrow: 1, maxWidth: 600, padding: 22, paddingBottom: 36, width: '100%' },
  mark: { height: 42, width: 42 },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 28,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 2,
  },
  cardIcon: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 32, height: 64, justifyContent: 'center', marginBottom: 18, width: 64 },
  cardTitle: { color: colors.primaryDark, fontSize: 20, fontWeight: '800', textAlign: 'center' },
  cardDescription: { color: colors.textMuted, fontSize: 14, lineHeight: 23, marginTop: 10, textAlign: 'center' },
});
