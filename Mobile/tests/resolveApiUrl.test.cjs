const assert = require('node:assert/strict');
const { test } = require('node:test');
const { resolveApiUrl } = require('../src/core/config/resolveApiUrl.ts');

const web = { isDevelopment: true, platform: 'web' };
const android = { isDevelopment: true, platform: 'android' };

test('development defaults use the API port and keep web on localhost', () => {
  assert.equal(resolveApiUrl(undefined, web).apiUrl, 'http://localhost:3200/api');
  assert.equal(resolveApiUrl(undefined, android).apiUrl, 'http://10.0.2.2:3200/api');
});

test('Android infers a private Metro host and preserves an explicitly configured API port', () => {
  const context = { ...android, hostUri: '192.168.1.71:8081' };
  assert.equal(resolveApiUrl(undefined, context).apiUrl, 'http://192.168.1.71:3200/api');
  assert.equal(resolveApiUrl('http://localhost:4000/api/', context).apiUrl, 'http://192.168.1.71:4000/api');
  assert.equal(resolveApiUrl(undefined, { ...android, hostUri: 'exp://172.20.10.3:8081' }).apiUrl,
    'http://172.20.10.3:3200/api');
});

test('a tunnel, public host or credential-bearing Metro URL never becomes the API host', () => {
  for (const hostUri of ['https://preview.exp.direct', '8.8.8.8:8081',
    'http://user:password@192.168.1.2:8081', '192.168.1.2:70000',
    '192.168.1.2.example.test:8081', 'ftp://192.168.1.2:8081']) {
    assert.equal(resolveApiUrl(undefined, { ...android, hostUri }).apiUrl, 'http://10.0.2.2:3200/api');
  }
});

test('explicit remote API URLs are retained and normalized', () => {
  assert.equal(resolveApiUrl(' https://API.example/api/// ', android).apiUrl, 'https://api.example/api');
  assert.equal(resolveApiUrl('https://api.example/api', { isDevelopment: false, platform: 'android' }).apiUrl,
    'https://api.example/api');
});

test('malformed or credential-bearing public configuration is rejected without echoing its value', () => {
  for (const value of ['', '/api', 'ftp://api.example/api', 'https://api.example:70000/api',
    'https://api.example/a b', 'https://api.example\\evil/api',
    'https://alice:do-not-expose@api.example/api', 'https://api.example/api?token=do-not-expose',
    'https://api.example/api#private', 'https://api.example/api?', 'https://api.example/api#',
    'https:///api.example/api']) {
    assert.throws(() => resolveApiUrl(value, web), (error) => {
      assert.match(error.message, /EXPO_PUBLIC_API_URL/);
      assert.ok(!error.message.includes('do-not-expose'));
      return true;
    });
  }
});

test('distribution requires explicit HTTPS configuration', () => {
  const distribution = { isDevelopment: false, platform: 'android' };
  assert.throws(() => resolveApiUrl(undefined, distribution), /EXPO_PUBLIC_API_URL/);
  assert.throws(() => resolveApiUrl('http://api.example/api', distribution), /HTTPS/);
});
