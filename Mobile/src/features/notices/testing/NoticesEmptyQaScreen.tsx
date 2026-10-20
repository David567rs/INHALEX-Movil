import { useState } from 'react';
import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/core/theme/colors';
import type { AuthSession, AuthSessionState } from '@/features/auth/domain/session/AuthSession';
import { AuthSessionProvider } from '@/features/auth/presentation/context/AuthSessionProvider';
import { SoftPressable } from '@/shared/components/Motion';
import { NoticesError } from '../domain/errors/NoticesError';
import type { NoticeInbox } from '../domain/models/Notice';
import type { NoticesRepository, NoticesRequestOptions } from '../domain/repositories/NoticesRepository';
import { createNoticesActions } from '../domain/useCases/noticesActions';
import { NoticesProvider } from '../presentation/context/NoticesProvider';
import { NoticesScreen } from '../presentation/screens/NoticesScreen';
import { createNoticesController } from '../presentation/state/createNoticesController';

const emptyInbox: NoticeInbox = Object.freeze({ items: Object.freeze([]), unread: 0 });

function emptyList(options?: NoticesRequestOptions): Promise<NoticeInbox> {
  return new Promise((resolve, reject) => {
    const signal = options?.signal;
    const cancelled = () => new NoticesError('Se canceló la prueba de bandeja vacía.', 'cancelled');
    if (signal?.aborted) { reject(cancelled()); return; }
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
      reject(cancelled());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve(emptyInbox);
    }, 350);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function createEmptyRuntime() {
  const user = Object.freeze({
    id: '000000000000000000000001', firstName: 'Prueba', lastName: 'Controlada',
    email: 'prueba@example.invalid', phone: '0000000000',
  });
  const snapshot: AuthSessionState = Object.freeze({ status: 'authenticated', user, message: null });
  const session: AuthSession = Object.freeze({
    getSnapshot: () => snapshot,
    subscribe: () => () => undefined,
    restore: async () => undefined,
    signIn: async () => user,
    signOut: async () => undefined,
  });
  const repository: NoticesRepository = {
    list: emptyList,
    markRead: async () => { throw new NoticesError('La prueba de bandeja vacía no modifica avisos.', 'configuration'); },
  };
  const controller = createNoticesController(session, createNoticesActions(repository));
  return Object.freeze({ session, controller });
}

/** This helper has no transport or storage; the normal app runtime remains untouched. */
export function NoticesEmptyQaScreen() {
  if (!__DEV__) return <Redirect href="/avisos" />;
  return <ControlledEmptyInbox />;
}

function ControlledEmptyInbox() {
  const [runtime] = useState(createEmptyRuntime);
  return <View style={styles.root}>
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.banner}>
      <View style={styles.bannerContent}>
        <View style={styles.copy}>
          <Text accessibilityRole="header" style={styles.title}>Prueba controlada · Bandeja vacía</Text>
          <Text style={styles.description}>Datos aislados de tu cuenta. Sin cambios en tus avisos.</Text>
        </View>
        <SoftPressable accessibilityRole="button" accessibilityLabel="Salir de la prueba"
          onPress={() => router.replace('/avisos')} style={styles.exit}>
          <Text style={styles.exitLabel}>Salir de la prueba</Text>
        </SoftPressable>
      </View>
    </SafeAreaView>
    <AuthSessionProvider session={runtime.session}>
      <NoticesProvider controller={runtime.controller}>
        <NoticesScreen />
      </NoticesProvider>
    </AuthSessionProvider>
  </View>;
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.background, flex: 1 },
  banner: { backgroundColor: colors.warningSoft, borderBottomColor: colors.border, borderBottomWidth: 1 },
  bannerContent: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 9, paddingHorizontal: 16, paddingVertical: 10 },
  copy: { flexBasis: 180, flexGrow: 1, minWidth: 0 },
  title: { color: colors.text, fontSize: 12, fontWeight: '800', lineHeight: 19 },
  description: { color: colors.textMuted, fontSize: 11, lineHeight: 17, marginTop: 3 },
  exit: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.border,
    borderRadius: 11, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 12, paddingVertical: 9 },
  exitLabel: { color: colors.primaryDark, fontSize: 11, fontWeight: '700', lineHeight: 18 },
});
