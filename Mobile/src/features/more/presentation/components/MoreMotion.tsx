import { useIsFocused } from 'expo-router';
import { type ReactNode, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Animated, AppState, Easing, Image, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/core/theme/colors';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';

type MoreEntranceProps = {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

type FocusedAnimationOptions = {
  value: Animated.Value;
  restingValue: number;
  createAnimation: () => Animated.CompositeAnimation;
  startWhenPreferenceReady?: boolean;
};

/** One bounded animation per focus; returning from the background stays still. */
function useFocusedAnimation({ value, restingValue, createAnimation, startWhenPreferenceReady = false }: FocusedAnimationOptions) {
  const isFocused = useIsFocused();
  const reducedMotion = useReducedMotion();
  const motionAllowed = useRef(false);
  const focused = useRef(false);
  const handledFocus = useRef(false);
  const animation = useRef<Animated.CompositeAnimation | null>(null);

  const stop = useCallback(() => {
    animation.current?.stop();
    animation.current = null;
    value.stopAnimation();
    value.setValue(restingValue);
  }, [restingValue, value]);

  const start = useCallback(() => {
    if (handledFocus.current || !focused.current || !motionAllowed.current || AppState.currentState !== 'active') return;
    handledFocus.current = true;
    animation.current = createAnimation();
    animation.current.start();
  }, [createAnimation]);

  useLayoutEffect(() => {
    motionAllowed.current = reducedMotion === false;
    if (reducedMotion !== false) stop();
    else if (startWhenPreferenceReady) start();
  }, [reducedMotion, start, startWhenPreferenceReady, stop]);

  useLayoutEffect(() => {
    focused.current = isFocused;
    if (!isFocused) { stop(); return; }
    handledFocus.current = false;
    // Prepare an already-approved entrance before this focus is painted.
    start();
    // Never hide visible text when the asynchronous preference arrives later.
    if (!startWhenPreferenceReady) handledFocus.current = true;

    const stopForBackground = () => {
      handledFocus.current = true;
      stop();
    };
    const stateSubscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') stopForBackground();
    });
    const blurSubscription = Platform.OS === 'android' ? AppState.addEventListener('blur', stopForBackground) : null;
    return () => {
      focused.current = false;
      stateSubscription?.remove();
      blurSubscription?.remove();
      stop();
    };
  }, [isFocused, start, startWhenPreferenceReady, stop]);
}

export function MoreEntrance({ children, delay = 0, style }: MoreEntranceProps) {
  const [progress] = useState(() => new Animated.Value(1));
  const entranceDelay = Number.isFinite(delay) ? Math.min(160, Math.max(0, delay)) : 0;
  const createAnimation = useCallback(() => {
    progress.setValue(0);
    return Animated.timing(progress, {
      toValue: 1,
      duration: 320,
      delay: entranceDelay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
      isInteraction: false,
    });
  }, [entranceDelay, progress]);
  useFocusedAnimation({ value: progress, restingValue: 1, createAnimation });

  return (
    <Animated.View style={[style, {
      opacity: progress,
      transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
    }]}>
      {children}
    </Animated.View>
  );
}

export function FloatingBrandMark() {
  const [offset] = useState(() => new Animated.Value(0));
  const createAnimation = useCallback(() => Animated.loop(Animated.sequence([
    Animated.timing(offset, { toValue: -4, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
    Animated.timing(offset, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true, isInteraction: false }),
  ]), { iterations: 2 }), [offset]);
  useFocusedAnimation({ value: offset, restingValue: 0, createAnimation, startWhenPreferenceReady: true });

  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.brandStage}>
      <View style={styles.halo} />
      <Animated.View style={[styles.brandSurface, { transform: [{ translateY: offset }] }]}>
        <Image source={require('../../../../../assets/inhalex-mark.png')} resizeMode="contain" accessible={false} style={styles.brandMark} />
      </Animated.View>
      <View style={styles.spark} />
    </View>
  );
}

const styles = StyleSheet.create({
  brandStage: { alignItems: 'center', justifyContent: 'center', width: 78, height: 78 },
  halo: { position: 'absolute', width: 76, height: 76, borderRadius: 38, borderWidth: 1, borderColor: '#CCE4D5' },
  brandSurface: {
    alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: 23,
    backgroundColor: '#F5FBF3', borderWidth: 1, borderColor: '#E1EFDE',
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 9, elevation: 2,
  },
  brandMark: { width: 54, height: 54 },
  spark: { position: 'absolute', right: 5, top: 9, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.mint, borderColor: colors.background, borderWidth: 1 },
});
