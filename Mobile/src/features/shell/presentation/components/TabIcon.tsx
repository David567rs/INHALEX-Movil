import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, StyleSheet, type ColorValue } from 'react-native';
import { colors } from '@/core/theme/colors';

export type TabIconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  color: ColorValue;
  focused: boolean;
  size: number;
  focusedName: TabIconName;
  outlineName: TabIconName;
  reduceMotion: boolean;
}

export function TabIcon({ color, focused, size, focusedName, outlineName, reduceMotion }: TabIconProps) {
  const [progress] = useState(() => new Animated.Value(focused ? 1 : 0));

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(focused ? 1 : 0);
      return;
    }
    const animation = Animated.spring(progress, {
      damping: 18,
      mass: 0.7,
      stiffness: 260,
      toValue: focused ? 1 : 0,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [focused, progress, reduceMotion]);

  return (
    <Animated.View
      style={[
        styles.iconContainer,
        focused && styles.iconContainerFocused,
        {
          opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.76, 1] }),
          transform: [
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) },
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) },
          ],
        },
      ]}
    >
      <Ionicons color={color} name={focused ? focusedName : outlineName} size={size} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  iconContainer: { alignItems: 'center', borderRadius: 17, height: 34, justifyContent: 'center', width: 48 },
  iconContainerFocused: { backgroundColor: colors.surfaceSoft },
});
