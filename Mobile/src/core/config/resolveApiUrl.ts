export interface ApiUrlContext {
  isDevelopment: boolean;
  platform: string;
  hostUri?: string | null;
}

export interface ApiUrlResolution {
  apiUrl: string;
}

const DEVELOPMENT_API_PORT = 3200;

function isLoopback(hostname: string): boolean {
  return ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname.toLowerCase());
}

function isPrivateAddress(hostname: string): boolean {
  const octets = hostname.split('.');
  if (octets.length === 4 && octets.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)) {
    const [first, second] = octets.map(Number);
    return first === 10 || (first === 172 && second >= 16 && second <= 31)
      || (first === 192 && second === 168);
  }
  return /^\[f[cd][0-9a-f]{2}:/i.test(hostname);
}

function getLocalMetroHostname(hostUri: string | null | undefined): string | null {
  if (!hostUri?.trim()) return null;
  try {
    const value = hostUri.trim();
    const metro = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(value) ? value : `http://${value}`);
    if (!['http:', 'https:', 'exp:', 'exps:'].includes(metro.protocol)
      || metro.username || metro.password || metro.search || metro.hash
      || (metro.pathname && metro.pathname !== '/') || /[\s\\]/.test(value)
      || !isPrivateAddress(metro.hostname)) return null;
    return metro.hostname;
  } catch {
    return null;
  }
}

/** EXPO_PUBLIC variables are bundled into the application and must contain no secrets. */
export function resolveApiUrl(value: string | undefined, context: ApiUrlContext): ApiUrlResolution {
  if (value === undefined) {
    if (!context.isDevelopment) {
      throw new Error('Define EXPO_PUBLIC_API_URL con la dirección HTTPS de la API antes de distribuir INHALEX.');
    }
    const hostname = context.platform === 'android'
      ? getLocalMetroHostname(context.hostUri) ?? '10.0.2.2'
      : 'localhost';
    return { apiUrl: `http://${hostname}:${DEVELOPMENT_API_PORT}/api` };
  }

  const normalized = value.trim();
  let api: URL;
  try {
    if (!/^https?:\/\/[^/]/i.test(normalized) || /[\s\\?#]/.test(normalized)) throw new Error();
    api = new URL(normalized);
    if (!api.hostname || api.username || api.password || api.search || api.hash) throw new Error();
  } catch {
    throw new Error('EXPO_PUBLIC_API_URL debe ser una URL HTTP o HTTPS válida, sin credenciales, parámetros ni fragmentos.');
  }

  if (!context.isDevelopment && api.protocol !== 'https:') {
    throw new Error('Las versiones de distribución de INHALEX requieren una API con HTTPS.');
  }

  if (context.isDevelopment && context.platform === 'android' && isLoopback(api.hostname)) {
    // Change only the host; Metro and the API keep independent ports and paths.
    api.hostname = getLocalMetroHostname(context.hostUri) ?? '10.0.2.2';
  }
  return { apiUrl: api.toString().replace(/\/+$/, '') };
}
