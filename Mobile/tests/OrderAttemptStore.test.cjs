const assert = require('node:assert/strict');
const { test } = require('node:test');
const { SecureOrderAttemptStore, ORDER_ATTEMPT_KEY_PREFIX } = require('../src/features/orderCreation/data/storage/SecureOrderAttemptStore.ts');
const { MemoryOrderAttemptStore } = require('../src/features/orderCreation/data/storage/MemoryOrderAttemptStore.ts');
const { createOrderAttemptStore: createWebOrderAttemptStore } = require('../src/features/orderCreation/data/storage/createOrderAttemptStore.web.ts');

const account = 'a'.repeat(24);
const otherAccount = 'b'.repeat(24);
const product = 'c'.repeat(24);
const secondProduct = 'd'.repeat(24);
const options = () => ({ keychainAccessible: 4, keychainService: 'inhalex.order.attempt', requireAuthentication: false });
const pending = (accountId = account) => ({
  version: 1, accountId, key: 'order_attempt_1234567890', phase: 'pending', receipt: null, normalizedItems: null,
  input: {
    items: [{ productId: product, quantity: 2 }], shippingAddressId: 'e'.repeat(24), previewSignature: 'f'.repeat(64),
    customerName: 'Valeria Ejemplo', customerEmail: 'valeria@example.test', customerPhone: '5500000000', notes: '',
  },
});
const confirmed = () => ({
  ...pending(), phase: 'confirmed', normalizedItems: [{ productId: product, quantity: 2 }],
  receipt: { orderId: '1'.repeat(24), reference: 'PED-20261019-EXAMPLE', status: 'pending_review', createdAt: '2026-10-19T15:00:00.000Z', subtotal: 258, totalItems: 2, currency: 'MXN' },
});
function port() {
  const values = new Map();
  const calls = [];
  return {
    values, calls,
    storage: {
      getItemAsync: async (...args) => { calls.push(['get', ...args]); return values.get(args[0]) ?? null; },
      setItemAsync: async (...args) => { calls.push(['set', ...args]); values.set(args[0], args[1]); },
      deleteItemAsync: async (...args) => { calls.push(['clear', ...args]); values.delete(args[0]); },
    },
  };
}
const storageFailure = (error) => error?.name === 'OrderCreationError' && error.kind === 'storage'
  && !error.message.includes('PRIVATE') && !('cause' in error);

test('order attempt pending and confirmed records survive shared-port reconstruction with the same native options', async () => {
  const fake = port();
  const suppliedOptions = options();
  const store = new SecureOrderAttemptStore(fake.storage, suppliedOptions);
  suppliedOptions.keychainService = 'wrong-service';
  await store.set(account, pending());
  const secondInstance = new SecureOrderAttemptStore(fake.storage, options());
  assert.deepEqual(await secondInstance.get(account), pending());
  await store.set(account, confirmed());
  assert.deepEqual(await secondInstance.get(account), confirmed());
  await store.clear(account);
  assert.equal(await secondInstance.get(account), null);
  assert.equal(fake.calls[0][1], ORDER_ATTEMPT_KEY_PREFIX + account);
  for (const call of fake.calls) {
    const received = call.at(-1);
    assert.deepEqual(received, options());
    assert.equal(Object.isFrozen(received), true);
  }
});

test('order attempts isolate account keys and reject a record owned by another account without native writes', async () => {
  const fake = port();
  const store = new SecureOrderAttemptStore(fake.storage, options());
  await store.set(account, pending());
  await store.set(otherAccount, pending(otherAccount));
  await store.clear(account);
  assert.equal(await store.get(account), null);
  assert.equal((await store.get(otherAccount)).accountId, otherAccount);
  const writes = fake.calls.filter((call) => call[0] === 'set').length;
  await assert.rejects(store.set(account, pending(otherAccount)), storageFailure);
  assert.equal(fake.calls.filter((call) => call[0] === 'set').length, writes);
});

test('order attempt snapshots whitelist all nested fields and never persist extra JWT or transport information', async () => {
  const fake = port();
  const attempt = confirmed();
  attempt.token = 'PRIVATE_JWT';
  attempt.authorization = 'Bearer PRIVATE_JWT';
  attempt.input.token = 'PRIVATE_JWT';
  attempt.input.items[0].authorization = 'PRIVATE_JWT';
  attempt.receipt.customer = { name: 'PRIVATE_EXTRA' };
  attempt.normalizedItems[0].token = 'PRIVATE_JWT';
  const store = new SecureOrderAttemptStore(fake.storage, options());
  await store.set(account, attempt);
  const raw = fake.values.get(ORDER_ATTEMPT_KEY_PREFIX + account);
  assert.ok(!raw.includes('PRIVATE'));
  assert.deepEqual(await store.get(account), confirmed());
  assert.deepEqual(Object.keys(JSON.parse(raw)).sort(), ['accountId', 'input', 'key', 'normalizedItems', 'phase', 'receipt', 'version']);
});

test('order attempt set captures a detached deep immutable snapshot before queued work begins', async () => {
  const fake = port();
  const store = new SecureOrderAttemptStore(fake.storage, options());
  const supplied = confirmed();
  const write = store.set(account, supplied);
  supplied.input.customerName = 'Changed after invocation';
  supplied.input.items[0].quantity = 25;
  supplied.normalizedItems[0].quantity = 25;
  supplied.receipt.totalItems = 25;
  await write;
  const read = await store.get(account);
  assert.deepEqual(read, confirmed());
  for (const value of [read, read.input, read.input.items, read.input.items[0], read.receipt, read.normalizedItems, read.normalizedItems[0]]) {
    assert.equal(Object.isFrozen(value), true);
  }
  assert.notEqual(await store.get(account), read);
});

test('order attempt corruption is blocked without deleting, replacing or echoing the private record', async () => {
  for (const invalid of ['{PRIVATE', 'null', '[]', JSON.stringify({ ...pending(), version: 2 }), JSON.stringify(pending(otherAccount))]) {
    const fake = port();
    fake.values.set(ORDER_ATTEMPT_KEY_PREFIX + account, invalid);
    const store = new SecureOrderAttemptStore(fake.storage, options());
    await assert.rejects(store.get(account), storageFailure);
    assert.deepEqual(fake.calls.map((call) => call[0]), ['get']);
    assert.equal(fake.values.get(ORDER_ATTEMPT_KEY_PREFIX + account), invalid);
  }
});

test('order attempt validation blocks invalid keys, account IDs, items, contact, signature and inconsistent phases', async () => {
  const changes = [
    (record) => { record.key = 'short'; },
    (record) => { record.key = 'a'.repeat(101); },
    (record) => { record.key = 'INVALID.KEY.123456789'; },
    (record) => { record.accountId = 'wrong'; },
    (record) => { record.input.items = []; },
    (record) => { record.input.items = Array.from({ length: 21 }, (_, index) => ({ productId: index.toString(16).padStart(24, '0'), quantity: 1 })); },
    (record) => { record.input.items[0].quantity = 0; },
    (record) => { record.input.items[0].quantity = 26; },
    (record) => { record.input.items[0].quantity = 1.5; },
    (record) => { record.input.items.push({ ...record.input.items[0] }); },
    (record) => { record.input.items[0].productId = 'not-an-id'; },
    (record) => { record.input.shippingAddressId = 'not-an-id'; },
    (record) => { record.input.previewSignature = 'z'.repeat(64); },
    (record) => { record.input.customerName = 'V'; },
    (record) => { record.input.customerEmail = 'invalid-email'; },
    (record) => { record.input.customerPhone = '123456789'; },
    (record) => { record.input.notes = 'n'.repeat(601); },
    (record) => { record.phase = 'unknown'; },
    (record) => { record.phase = 'confirmed'; },
    (record) => { record.receipt = confirmed().receipt; },
    (record) => { record.normalizedItems = confirmed().normalizedItems; },
  ];
  for (const change of changes) {
    const store = new MemoryOrderAttemptStore();
    const record = pending(); change(record);
    await assert.rejects(store.set(account, record), storageFailure);
    assert.equal(await store.get(account), null);
  }
  const fake = port();
  const store = new SecureOrderAttemptStore(fake.storage, options());
  await assert.rejects(store.get('../PRIVATE'), storageFailure);
  await assert.rejects(store.clear(''), storageFailure);
  assert.equal(fake.calls.length, 0);
});

test('confirmed order attempt requires a valid minimal receipt and coherent normalized subset', async () => {
  const changes = [
    (record) => { record.receipt.orderId = 'bad'; },
    (record) => { record.receipt.reference = 'PRIVATE bad reference'; },
    (record) => { record.receipt.status = 'draft'; },
    (record) => { record.receipt.createdAt = 'invalid-date'; },
    (record) => { record.receipt.createdAt = '2026-02-30T00:00:00.000Z'; },
    (record) => { record.receipt.subtotal = NaN; },
    (record) => { record.receipt.subtotal = -1; },
    (record) => { record.receipt.totalItems = 0; },
    (record) => { record.receipt.currency = 'mxn'; },
    (record) => { record.normalizedItems = []; },
    (record) => { record.normalizedItems[0].productId = secondProduct; },
    (record) => { record.normalizedItems[0].quantity = 3; },
    (record) => { record.normalizedItems[0].quantity = 1; },
    (record) => { record.normalizedItems.push({ ...record.normalizedItems[0] }); },
  ];
  for (const change of changes) {
    const store = new MemoryOrderAttemptStore();
    const record = confirmed(); change(record);
    await assert.rejects(store.set(account, record), storageFailure);
    assert.equal(await store.get(account), null);
  }
  const store = new MemoryOrderAttemptStore();
  const adjusted = confirmed();
  adjusted.input.items.push({ productId: secondProduct, quantity: 1 });
  adjusted.normalizedItems[0].quantity = 1;
  adjusted.receipt.totalItems = 1;
  adjusted.receipt.createdAt = null;
  await store.set(account, adjusted);
  assert.deepEqual(await store.get(account), adjusted);
});

test('order attempt native read, write and delete failures are sanitized without retries or automatic cleanup', async () => {
  for (const operation of ['get', 'set', 'clear']) {
    let calls = 0;
    const reject = async () => { calls++; throw new Error('PRIVATE_NATIVE_FAILURE'); };
    const store = new SecureOrderAttemptStore({
      getItemAsync: operation === 'get' ? reject : async () => null,
      setItemAsync: operation === 'set' ? reject : async () => {},
      deleteItemAsync: operation === 'clear' ? reject : async () => {},
    }, options());
    await assert.rejects(operation === 'set' ? store.set(account, pending()) : store[operation](account), storageFailure);
    assert.equal(calls, 1);
  }
});

test('failed order attempt set never updates a memory cache or claims successful persistence', async () => {
  const fake = port();
  await fake.storage.setItemAsync(ORDER_ATTEMPT_KEY_PREFIX + account, JSON.stringify(pending()));
  fake.storage.setItemAsync = async () => { throw new Error('PRIVATE_WRITE_FAILED'); };
  const store = new SecureOrderAttemptStore(fake.storage, options());
  await assert.rejects(store.set(account, confirmed()), storageFailure);
  assert.equal((await store.get(account)).phase, 'pending');
});

test('order attempt same-account set, recovery read and clear serialize before a later recovery read', async () => {
  const fake = port();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const nativeSet = fake.storage.setItemAsync;
  fake.storage.setItemAsync = async (...args) => { await gate; await nativeSet(...args); };
  const store = new SecureOrderAttemptStore(fake.storage, options());
  const write = store.set(account, pending());
  const recovery = store.get(account);
  const clear = store.clear(account);
  const afterClear = store.get(account);
  await Promise.resolve();
  assert.equal(fake.calls.length, 0);
  release();
  await write;
  assert.deepEqual(await recovery, pending());
  await clear;
  assert.equal(await afterClear, null);
  assert.deepEqual(fake.calls.map((call) => call[0]), ['set', 'get', 'clear', 'get']);
});

test('a blocked account operation does not block another account and a failed operation does not poison its queue', async () => {
  const fake = port();
  let rejectWrite;
  const gate = new Promise((_resolve, reject) => { rejectWrite = reject; });
  const nativeSet = fake.storage.setItemAsync;
  fake.storage.setItemAsync = async (...args) => {
    if (args[0] === ORDER_ATTEMPT_KEY_PREFIX + account) await gate;
    await nativeSet(...args);
  };
  const store = new SecureOrderAttemptStore(fake.storage, options());
  const blocked = store.set(account, pending());
  const expectedRejection = assert.rejects(blocked, storageFailure);
  await store.set(otherAccount, pending(otherAccount));
  assert.equal((await store.get(otherAccount)).accountId, otherAccount);
  rejectWrite(new Error('PRIVATE_WRITE_FAILED'));
  await expectedRejection;
  assert.equal(await store.get(account), null);
  await store.clear(account);
});

test('web order attempt storage remains only in memory, separated per instance and without browser persistence', async () => {
  const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const originalSessionStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const forbid = () => { throw new Error('Durable browser storage is forbidden'); };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get: forbid });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, get: forbid });
  try {
    const store = createWebOrderAttemptStore();
    await store.set(account, pending());
    assert.deepEqual(await store.get(account), pending());
    assert.equal(await createWebOrderAttemptStore().get(account), null);
    await store.clear(account);
    assert.equal(await store.get(account), null);
  } finally {
    if (originalLocalStorage) Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
    else delete globalThis.localStorage;
    if (originalSessionStorage) Object.defineProperty(globalThis, 'sessionStorage', originalSessionStorage);
    else delete globalThis.sessionStorage;
  }
});
