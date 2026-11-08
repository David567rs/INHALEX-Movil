import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren, type ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import { useReducedMotion } from '../hooks/useReducedMotion';

type CloseRequest = { afterClose?: () => void; completed: boolean };
type BottomSheetDismiss = (afterClose?: () => void) => void;
const BottomSheetDismissContext = createContext<BottomSheetDismiss | null>(null);

/** Content and footer actions share the guarded close/back dismissal. */
export function useBottomSheetDismiss(): BottomSheetDismiss {
  const dismiss = useContext(BottomSheetDismissContext);
  if (!dismiss) throw new Error('El acceso debe estar dentro de BottomSheet.');
  return dismiss;
}

export function BottomSheet({ visible, onClose, title, children, footer, adaptiveFooter = false, onContentHeightChange }: PropsWithChildren<{
  visible: boolean;
  onClose: () => void;
  title: string;
  footer?: ReactNode;
  adaptiveFooter?: boolean;
  onContentHeightChange?: (height: number) => void;
}>) {
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { width, height, fontScale } = useWindowDimensions();
  const [progress] = useState(() => new Animated.Value(0));
  const closeRequest = useRef<CloseRequest | null>(null);
  const [headingHeight, setHeadingHeight] = useState(63);
  const [footerHeight, setFooterHeight] = useState(0);
  const sheetHeight = Math.min(height * 0.9, height - insets.top - 20);
  const bottomPadding = Math.max(insets.bottom, 18);
  const usableHeight = Math.max(1, sheetHeight - bottomPadding - headingHeight - 15);
  // Long feedback or accessibility text must not turn the body into a tiny slot.
  // The footer keeps the same width/padding in both positions, so its measurement
  // is stable when moving between normal flow and the reserved bottom area.
  const scrollFooter = adaptiveFooter && (height < 640 || fontScale >= 1.3 || footerHeight > usableHeight * 0.25);
  const footerView = footer ? <View style={styles.footer} onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}>{footer}</View> : null;

  const finishClose = useCallback((request: CloseRequest) => {
    if (closeRequest.current !== request || request.completed) return;
    request.completed = true;
    const afterClose = request.afterClose;
    request.afterClose = undefined;
    onClose();
    afterClose?.();
  }, [onClose]);

  useEffect(() => {
    if (!visible) {
      progress.stopAnimation();
      progress.setValue(0);
      closeRequest.current = null;
    } else if (reducedMotion !== false) {
      progress.stopAnimation();
      if (closeRequest.current) {
        progress.setValue(0);
        finishClose(closeRequest.current);
      } else {
        progress.setValue(1);
      }
    }
  }, [finishClose, progress, reducedMotion, visible]);

  useEffect(() => () => {
    closeRequest.current = null;
    progress.stopAnimation();
  }, [progress]);

  function showSheet() {
    closeRequest.current = null;
    progress.stopAnimation();
    if (reducedMotion !== false) {
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }

  function closeSheet(afterClose?: () => void) {
    if (closeRequest.current) return;
    const request: CloseRequest = { afterClose, completed: false };
    closeRequest.current = request;
    progress.stopAnimation();
    if (reducedMotion !== false) {
      progress.setValue(0);
      finishClose(request);
      return;
    }
    Animated.timing(progress, { toValue: 0, duration: 180, easing: Easing.in(Easing.quad), useNativeDriver: true })
      .start(({ finished }) => { if (finished) finishClose(request); });
  }

  return (
    <Modal visible={visible} transparent animationType="none" onShow={showSheet} onRequestClose={() => closeSheet()}>
      <View style={styles.overlay}>
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: progress }]} />
        <Pressable accessibilityLabel="Cerrar detalles" accessibilityRole="button" onPress={() => closeSheet()} style={StyleSheet.absoluteFill} />
        <Animated.View accessibilityViewIsModal style={[styles.sheet, {
          width: Math.max(1, Math.min(width - insets.left - insets.right, 600)),
          maxHeight: sheetHeight,
          paddingBottom: bottomPadding,
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [32, 0] }) }],
        }]}>
          <View style={styles.handle} />
          <View style={styles.heading} onLayout={(event) => setHeadingHeight(event.nativeEvent.layout.height)}>
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
            <Pressable accessibilityLabel="Cerrar" accessibilityRole="button" onPress={() => closeSheet()} style={styles.close}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>
          <BottomSheetDismissContext.Provider value={closeSheet}>
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator
              onLayout={(event) => {
                const height = event.nativeEvent.layout.height;
                if (height > 0) onContentHeightChange?.(height);
              }}>
              <View style={styles.content}>{children}</View>
              {scrollFooter ? footerView : null}
            </ScrollView>
            {scrollFooter ? null : footerView}
          </BottomSheetDismissContext.Provider>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { backgroundColor: '#102E2366' },
  sheet: { alignSelf: 'center', backgroundColor: colors.background, borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden' },
  handle: { alignSelf: 'center', backgroundColor: '#CCD9CC', borderRadius: 4, height: 4, marginTop: 11, width: 38 },
  heading: { alignItems: 'center', flexDirection: 'row', flexShrink: 0, gap: 12, paddingHorizontal: 22, paddingBottom: 10, paddingTop: 9 },
  title: { color: colors.text, flex: 1, fontSize: 18, fontWeight: '700' },
  close: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 24, height: 44, justifyContent: 'center', width: 44 },
  scroll: { flexShrink: 1, minHeight: 0 },
  content: { padding: 22, paddingTop: 5 },
  footer: { borderTopColor: colors.border, borderTopWidth: StyleSheet.hairlineWidth, flexShrink: 0, paddingHorizontal: 22 },
});
