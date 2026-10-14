import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { TabIcon, type TabIconName } from '@/features/shell/presentation/components/TabIcon';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

const tabs = [
  { name: 'index', title: 'Inicio', focusedIcon: 'home', outlineIcon: 'home-outline' },
  { name: 'catalogo', title: 'Catálogo', focusedIcon: 'leaf', outlineIcon: 'leaf-outline' },
  { name: 'favoritos', title: 'Favoritos', focusedIcon: 'heart', outlineIcon: 'heart-outline' },
  { name: 'bolsa', title: 'Bolsa', focusedIcon: 'bag', outlineIcon: 'bag-outline' },
  { name: 'cuenta', title: 'Cuenta', focusedIcon: 'person', outlineIcon: 'person-outline' },
] as const satisfies readonly {
  name: string;
  title: string;
  focusedIcon: TabIconName;
  outlineIcon: TabIconName;
}[];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomProtection = Math.max(insets.bottom, 8);
  const reduceMotion = useReducedMotion() !== false;

  return (
    <Tabs
      screenOptions={{
        animation: reduceMotion ? 'none' : 'shift',
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: 'below-icon',
        tabBarItemStyle: { paddingTop: 2 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          elevation: 12,
          height: 60 + bottomProtection,
          paddingBottom: bottomProtection,
          paddingTop: 4,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
        },
        transitionSpec: reduceMotion ? undefined : { animation: 'timing', config: { duration: 220 } },
      }}
    >
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.title,
            tabBarIcon: (props) => (
              <TabIcon {...props} focusedName={tab.focusedIcon} outlineName={tab.outlineIcon} reduceMotion={reduceMotion} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
