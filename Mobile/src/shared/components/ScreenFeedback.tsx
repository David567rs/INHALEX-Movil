import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/core/theme/colors';

type FeedbackTone = 'error' | 'info' | 'success';

/** Presentation only: the caller owns retries, loading and session state. */
export function FeedbackBanner({ message, tone = 'error', onRetry, retryLabel = 'Reintentar', busyLabel = 'Actualizando…', disabled = false, busy = false }: {
  message: string;
  tone?: FeedbackTone;
  onRetry?: () => void;
  retryLabel?: string;
  busyLabel?: string;
  disabled?: boolean;
  busy?: boolean;
}) {
  const error = tone === 'error';
  const ink = error ? colors.danger : colors.primaryDark;
  return <View style={[styles.banner, error ? styles.errorBanner : styles.infoBanner]}>
    <View style={styles.messageRow}>
      <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Ionicons name={error ? 'alert-circle-outline' : tone === 'success' ? 'checkmark-circle-outline' : 'information-circle-outline'} size={20} color={ink} />
      </View>
      <Text accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion="polite" style={[styles.message, { color: ink }]}>{message}</Text>
    </View>
    {onRetry ? <Pressable accessibilityRole="button" accessibilityLabel={retryLabel}
      accessibilityState={{ disabled: disabled || busy, busy }} disabled={disabled || busy} onPress={onRetry}
      style={({ pressed }) => [styles.retry, (disabled || busy) && styles.disabled, pressed && styles.pressed]}>
      {busy ? <ActivityIndicator accessible={false} color={ink} size="small" />
        : <Ionicons accessible={false} name="refresh-outline" size={17} color={ink} />}
      <Text style={[styles.retryLabel, { color: ink }]}>{busy ? busyLabel : retryLabel}</Text>
    </Pressable> : null}
  </View>;
}

export function LoadingState({ label, message }: { label: string; message?: string }) {
  return <View accessibilityRole="progressbar" accessibilityLabel={message ? `${label} ${message}` : label}
    accessibilityLiveRegion="polite" accessibilityState={{ busy: true }} style={styles.loading}>
    <ActivityIndicator accessible={false} color={colors.primary} size="small" />
    <View style={styles.loadingCopy}>
      <Text style={styles.loadingLabel}>{label}</Text>
      {message ? <Text style={styles.secondaryCopy}>{message}</Text> : null}
    </View>
  </View>;
}

export function ScreenState({ title, message, busy = false, icon = 'information-circle-outline', actionLabel, onAction,
  actionBusy = false, actionDisabled = false }: {
  title: string;
  message?: string;
  busy?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  onAction?: () => void;
  actionBusy?: boolean;
  actionDisabled?: boolean;
}) {
  if (busy) return <LoadingState label={title} message={message} />;
  return <View style={styles.panel}>
    <View accessible={false} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.symbol}>
      <Ionicons name={icon} size={28} color={colors.primary} />
    </View>
    <Text accessibilityRole="header" style={styles.panelTitle}>{title}</Text>
    {message ? <Text accessibilityLiveRegion="polite" style={styles.panelCopy}>{message}</Text> : null}
    {onAction && actionLabel ? <Pressable accessibilityRole="button" accessibilityLabel={actionLabel}
      accessibilityState={{ disabled: actionBusy || actionDisabled, busy: actionBusy }} disabled={actionBusy || actionDisabled}
      onPress={onAction} style={({ pressed }) => [styles.action, (actionBusy || actionDisabled) && styles.disabled, pressed && styles.pressed]}>
      {actionBusy ? <ActivityIndicator accessible={false} size="small" color={colors.white} /> : null}
      <Text style={styles.actionLabel}>{actionLabel}</Text>
    </Pressable> : null}
  </View>;
}

const styles = StyleSheet.create({
  banner: { borderRadius: 16, borderWidth: 1, marginVertical: 10, padding: 14 },
  errorBanner: { backgroundColor: colors.dangerSoft, borderColor: '#F0CEC9' },
  infoBanner: { backgroundColor: colors.surfaceSoft, borderColor: colors.border },
  messageRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10 },
  message: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 21 },
  retry: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 7, minHeight: 44, marginTop: 4, maxWidth: '100%', paddingHorizontal: 4, paddingVertical: 10 },
  retryLabel: { flexShrink: 1, fontSize: 13, fontWeight: '700', lineHeight: 20 },
  loading: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: 1, flexDirection: 'row', gap: 12, marginVertical: 16, padding: 20 },
  loadingCopy: { flex: 1, minWidth: 0 },
  loadingLabel: { color: colors.primaryDark, fontSize: 14, fontWeight: '700', lineHeight: 22 },
  secondaryCopy: { color: colors.textMuted, fontSize: 13, lineHeight: 21, marginTop: 4 },
  panel: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 22, borderWidth: 1, marginVertical: 16, padding: 22 },
  symbol: { alignItems: 'center', backgroundColor: colors.surfaceSoft, borderRadius: 18, height: 54, justifyContent: 'center', marginBottom: 14, width: 54 },
  panelTitle: { color: colors.text, fontSize: 21, fontWeight: '800', lineHeight: 28, textAlign: 'center' },
  panelCopy: { color: colors.textMuted, fontSize: 14, lineHeight: 23, marginTop: 8, textAlign: 'center' },
  action: { alignItems: 'center', alignSelf: 'stretch', backgroundColor: colors.primaryDark, borderRadius: 14, flexDirection: 'row', gap: 9, justifyContent: 'center', marginTop: 20, minHeight: 50, paddingHorizontal: 14, paddingVertical: 13 },
  actionLabel: { color: colors.white, flexShrink: 1, fontSize: 14, fontWeight: '700', lineHeight: 22, textAlign: 'center' },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.75 },
});
