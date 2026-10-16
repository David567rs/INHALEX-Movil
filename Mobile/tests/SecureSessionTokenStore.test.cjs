const assert = require('node:assert/strict');
const { test } = require('node:test');
const { SecureSessionTokenStore } = require('../src/features/auth/data/storage/SecureSessionTokenStore.ts');
const { createSessionTokenStore: createWebSessionTokenStore } = require('../src/features/auth/data/storage/createSessionTokenStore.web.ts');

const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLWlkIn0.dGVzdC1zaWduYXR1cmU';
const options = () => ({
  keychainAccessible: 4,
  keychainService: 'inhalex.auth.session',
  requireAuthentication: false,
});

test('secure token storage writes only the JWT and deletes the same stable key with identical options', async () => {
  const calls = [];
  const storage = {
    setItemAsync: async (...args) => { calls.push(['set', ...args]); },
    deleteItemAsync: async (...args) => { calls.push(['clear', ...args]); },
    getItemAsync: () => { throw new Error('Login must not read a stored token'); },
  };
  const store = new SecureSessionTokenStore(storage, options());
  await store.set(token);
  await store.clear();
  assert.deepEqual(calls, [
    ['set', 'inhalex.auth.access-token', token, options()],
    ['clear', 'inhalex.auth.access-token', options()],
  ]);
  assert.equal(calls[0][3], calls[1][2]);
  assert.equal(typeof store.get, 'undefined');
});

test('secure token storage snapshots and freezes caller options before any operation', async () => {
  const supplied = options();
  let received;
  const store = new SecureSessionTokenStore({
    setItemAsync: async (_key, _token, passedOptions) => { received = passedOptions; },
    deleteItemAsync: async () => {},
  }, supplied);
  supplied.keychainService = 'mutated-service';
  supplied.requireAuthentication = true;
  await store.set(token);
  assert.deepEqual(received, options());
  assert.equal(Object.isFrozen(received), true);
  assert.notEqual(received, supplied);
});

test('secure token storage propagates write and deletion failures without reading or retrying', async () => {
  for (const operation of ['set', 'clear']) {
    let attempts = 0;
    const failure = new Error('Native storage unavailable');
    const reject = async () => { attempts++; throw failure; };
    const store = new SecureSessionTokenStore({
      setItemAsync: operation === 'set' ? reject : async () => {},
      deleteItemAsync: operation === 'clear' ? reject : async () => {},
      getItemAsync: () => { throw new Error('Must not read'); },
    }, options());
    await assert.rejects(operation === 'set' ? store.set(token) : store.clear(), (error) => error === failure);
    assert.equal(attempts, 1);
  }
});

test('web token storage resolves without browser storage access or retaining token values', async () => {
  const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const originalSessionStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const forbidStorage = () => { throw new Error('Web login must not access durable browser storage'); };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: forbidStorage });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get: forbidStorage });
  try {
    const store = createWebSessionTokenStore();
    assert.equal(await store.set(token), undefined);
    assert.equal(await store.clear(), undefined);
    assert.deepEqual(Object.keys(store).sort(), ['clear', 'set']);
    assert.ok(!JSON.stringify(store).includes(token));
  } finally {
    if (originalLocalStorage) Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
    else delete globalThis.localStorage;
    if (originalSessionStorage) Object.defineProperty(globalThis, 'sessionStorage', originalSessionStorage);
    else delete globalThis.sessionStorage;
  }
});
