import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { resolveApiUrl } from './resolveApiUrl';

export interface Environment {
  readonly apiUrl: string;
  readonly isDevelopment: boolean;
  readonly requestTimeoutMs: number;
}

/** Read configuration when composing services, without opening a connection. */
export function readEnvironment(): Environment {
  const api = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL, {
    isDevelopment: __DEV__,
    platform: Platform.OS,
    hostUri: __DEV__ && Platform.OS === 'android' ? Constants.expoConfig?.hostUri : null,
  });
  return Object.freeze({ ...api, isDevelopment: __DEV__, requestTimeoutMs: 15_000 });
}
