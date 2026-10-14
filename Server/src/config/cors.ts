// Expo's browser preview runs on Metro port 8081. These origins are allowed
// only during local development; production keeps its explicit allowlist.
const expoDevelopmentOrigin =
  /^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\]|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}):8081$/;

export function resolveCorsOrigin(
  corsOrigin: string | undefined,
  nodeEnvironment: string | undefined,
): boolean | (string | RegExp)[] {
  const configuredOrigins = (corsOrigin ?? '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  if (nodeEnvironment === 'production') {
    return configuredOrigins.length > 0 ? configuredOrigins : false;
  }

  if (configuredOrigins.length === 0) return true;

  return [...configuredOrigins, expoDevelopmentOrigin];
}
