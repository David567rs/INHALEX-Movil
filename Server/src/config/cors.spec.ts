import { resolveCorsOrigin } from './cors';

function isAllowed(origin: string, mode = 'development') {
  const policy = resolveCorsOrigin('http://localhost:3000', mode);
  if (typeof policy === 'boolean') return policy;
  return policy.some((entry) =>
    typeof entry === 'string' ? entry === origin : entry.test(origin),
  );
}

describe('CORS for the Expo browser preview', () => {
  it('keeps the web frontend and allows local Metro origins', () => {
    for (const origin of [
      'http://localhost:3000',
      'http://localhost:8081',
      'http://127.0.0.1:8081',
      'http://[::1]:8081',
      'http://172.20.10.3:8081',
      'http://192.168.1.71:8081',
      'http://10.0.2.2:8081',
    ]) {
      expect(isAllowed(origin)).toBe(true);
    }
  });

  it('does not allow unrelated origins or lookalike hosts', () => {
    for (const origin of [
      'https://example.test',
      'http://localhost:8082',
      'http://172.20.10.3.example.test:8081',
      'http://192.168.1.71@evil.test:8081',
      'http://8.8.8.8:8081',
    ]) {
      expect(isAllowed(origin)).toBe(false);
    }
  });

  it('does not add development origins in production', () => {
    expect(isAllowed('http://localhost:3000', 'production')).toBe(true);
    expect(isAllowed('http://localhost:8081', 'production')).toBe(false);
    expect(isAllowed('http://172.20.10.3:8081', 'production')).toBe(false);
    expect(resolveCorsOrigin(undefined, 'production')).toBe(false);
    expect(resolveCorsOrigin(undefined, 'development')).toBe(true);
  });

  it('preserves and normalizes the production allowlist', () => {
    expect(
      resolveCorsOrigin(
        ' https://inhalex.example/ , https://admin.example ',
        'production',
      ),
    ).toEqual(['https://inhalex.example', 'https://admin.example']);
  });
});
