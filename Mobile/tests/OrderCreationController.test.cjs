const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createOrderCreationController } = require('../src/features/orderCreation/presentation/state/createOrderCreationController.ts');
const { OrderCreationError } = require('../src/features/orderCreation/domain/errors/OrderCreationError.ts');

const USER = '0123456789abcdef01234567', OTHER = 'abcdef0123456789abcdef01';
const P = '0123456789abcdef01234561', A = '0123456789abcdef01234562';
const KEY = 'secure-order-key-123456', SIG = 'a'.repeat(64);
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const profile = (id = USER) => ({ id, firstName: 'Ana', lastName: 'López', email: 'ana@example.test', phone: '5512345678' });
const auth = (id = USER) => Object.freeze({ status: 'authenticated', user: profile(id), message: null });
const cart = (quantity = 2) => ({ items: quantity ? [{ productId: P, quantity, subtotal: quantity * 129,
  product: { id: P, name: 'Lavanda' } }] : [], totalItems: quantity, subtotal: quantity * 129, currency: 'MXN' });
const address = () => ({ id: A, label: 'Casa', recipientName: 'Ana López', phone: '5512345678', street: 'Principal',
  exteriorNumber: '12', interiorNumber: '', neighborhood: 'Centro', municipality: 'Pachuca', state: 'Hidalgo', postalCode: '42000', references: '', isDefault: true });
const context = (quantity = 2, id = USER) => ({ cart: cart(quantity), addresses: [address()], profile: profile(id) });
const quote = (quantity = 2) => ({ items: [{ productId: P, quantity, requestedQuantity: 2 }], issues: [], subtotal: quantity * 129,
  totalItems: quantity, currency: 'MXN', canConfirmOrder: true, canCreateDraft: true, needsManualReview: false, signature: SIG });
const confirmation = (quantity = 2) => ({ ...quote(quantity), orderId: '0123456789abcdef01234563', reference: 'INH-12345678', status: 'confirmed', createdAt: null });
const input = () => ({ customerName: 'Ana López', customerEmail: 'ana@example.test', customerPhone: '5512345678', notes: '',
  items: [{ productId: P, quantity: 2 }], shippingAddressId: A, previewSignature: SIG });
const pending = () => ({ version: 1, accountId: USER, key: KEY, input: input(), phase: 'pending', receipt: null, normalizedItems: null });
function session(initial = auth()) {
  let state = initial; const listeners = new Set();
  return { getSnapshot: () => state, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async restore() {}, async signIn() { return state.user; }, async signOut() {},
    publish(next) { state = next; [...listeners].forEach((listener) => listener()); }, count: () => listeners.size };
}
function setup(overrides = {}, extra = {}) {
  const records = new Map(); let locked = false, leases = 0, releases = 0, refreshedCart;
  const calls = { load: 0, preview: 0, confirm: [], readCart: 0, clearCart: 0, set: 0, clear: 0, keys: 0 };
  const authSession = extra.session ?? session();
  const store = { async get(id) { return records.get(id) ?? null; }, async set(id, value) { calls.set++; records.set(id, value); },
    async clear(id) { calls.clear++; records.delete(id); }, ...extra.store };
  const actions = { async load() { calls.load++; return context(); }, async preview() { calls.preview++; return quote(); },
    async confirm(values, key) { calls.confirm.push({ values, key }); return confirmation(); },
    async readCart() { calls.readCart++; return cart(); }, async clearCart() { calls.clearCart++; return cart(0); }, ...overrides };
  const controller = createOrderCreationController(authSession, actions, { attemptStore: store,
    createKey() { calls.keys++; return KEY; }, cart: { acquireCheckout() {
      if (locked) return null; locked = true; leases++; let live = true;
      return { isCurrent: () => live, release(value) { if (live) { live = false; locked = false; releases++; if (value) refreshedCart = value; } } };
    } } });
  return { controller, session: authSession, store, records, calls, info: () => ({ locked, leases, releases, refreshedCart }) };
}
async function open(fixture) { fixture.controller.start(); await fixture.controller.open(); }

test('order controller starts without HTTP and loads only when its authenticated screen opens', async () => {
  const f = setup(); f.controller.start(); f.controller.start(); await tick(); assert.equal(f.calls.load, 0);
  assert.equal(f.session.count(), 1); const snapshot = f.controller.getSnapshot(); assert.equal(f.controller.getSnapshot(), snapshot);
  assert.ok(Object.isFrozen(snapshot)); await f.controller.open(); assert.equal(f.calls.load, 1); assert.equal(f.calls.preview, 1);
  assert.equal(f.controller.getSnapshot().selectedAddressId, A); f.controller.close(); assert.equal(f.controller.getSnapshot().context, null);
  f.controller.stop(); assert.equal(f.session.count(), 0);
});

test('anonymous and checking sessions never read attempts or private HTTP data', async () => {
  let reads = 0; const s = session({ status: 'checking', user: null, message: null });
  const f = setup({}, { session: s, store: { async get() { reads++; return null; } } }); await open(f);
  await f.controller.refresh(); await f.controller.confirm(); assert.equal(reads, 0); assert.equal(f.calls.load, 0);
  s.publish({ status: 'anonymous', user: null, message: null }); assert.equal(f.controller.getSnapshot().status, 'anonymous');
  s.publish(auth()); await tick(); assert.equal(f.calls.load, 1); f.controller.stop();
});

test('double confirmation reserves a global checkout synchronously and POSTs only once after durable pending storage', async () => {
  const response = deferred(); const f = setup({ async confirm(values, key) {
    assert.equal(f.records.get(USER).phase, 'pending'); assert.equal(f.info().locked, true);
    f.calls.confirm.push({ values, key }); return response.promise;
  } }); await open(f); const first = f.controller.confirm(); const second = f.controller.confirm(); await tick();
  assert.equal(f.calls.confirm.length, 1); assert.equal(f.calls.keys, 1); assert.equal(f.controller.getSnapshot().confirming, true);
  response.resolve(confirmation()); await Promise.all([first, second]);
  assert.equal(f.calls.clearCart, 1); assert.equal(f.info().locked, false); assert.equal(f.controller.getSnapshot().receipt.reference, 'INH-12345678');
  assert.equal(f.records.has(USER), false); f.controller.stop();
});

test('validation blocks creation until contact and a registered shipping address are valid', async () => {
  const f = setup(); await open(f); f.controller.editContact('customerName', 'A'); f.controller.editContact('customerPhone', '123');
  await f.controller.confirm(); assert.equal(f.calls.keys, 0); assert.ok(f.controller.getSnapshot().fieldErrors.customerName);
  f.controller.editContact('customerName', 'Ana López'); assert.equal(f.controller.getSnapshot().fieldErrors.customerName, undefined);
  f.controller.editContact('customerPhone', '5512345678'); await f.controller.confirm(); assert.equal(f.calls.confirm.length, 1); f.controller.stop();
});

test('normal confirmation sends original cart quantities and signature even when preview normalizes quantities', async () => {
  const f = setup({ async preview() { return quote(1); }, async confirm(values, key) { f.calls.confirm.push({ values, key }); return confirmation(1); } });
  await open(f); await f.controller.confirm(); assert.deepEqual(f.calls.confirm[0].values.items, [{ productId: P, quantity: 2 }]);
  assert.equal(f.calls.confirm[0].values.previewSignature, SIG); assert.equal(f.calls.clearCart, 0);
  assert.equal(f.info().refreshedCart.items[0].quantity, 2); assert.match(f.controller.getSnapshot().message, /Conservamos/); f.controller.stop();
});

test('network uncertainty preserves the exact input and key across explicit retry and never previews again for the retry', async () => {
  const f = setup({ async confirm(values, key) {
    f.calls.confirm.push({ values, key }); if (f.calls.confirm.length === 1) throw new OrderCreationError('Sin conexión.', 'network'); return confirmation();
  } }); await open(f); await f.controller.confirm(); const previewCount = f.calls.preview;
  const first = f.calls.confirm[0]; assert.equal(f.controller.getSnapshot().uncertain, true);
  f.controller.editContact('notes', 'Changed'); await f.controller.confirm(); assert.equal(f.calls.confirm.length, 1);
  await f.controller.retryConfirmation(); assert.equal(f.calls.confirm.length, 2); assert.equal(f.calls.keys, 1);
  assert.equal(f.calls.preview, previewCount); assert.deepEqual(f.calls.confirm[1], first); f.controller.stop();
});

test('persisted pending attempt is restored before reads and is never automatically posted or rotated', async () => {
  const f = setup(); f.records.set(USER, pending()); await open(f);
  assert.equal(f.controller.getSnapshot().uncertain, true); assert.equal(f.calls.confirm.length, 0); assert.equal(f.calls.keys, 0);
  await f.controller.confirm(); assert.equal(f.calls.confirm.length, 0); await f.controller.retryConfirmation();
  assert.equal(f.calls.confirm[0].key, KEY); assert.deepEqual(f.calls.confirm[0].values, input()); f.controller.stop();
});

test('conflict clears the definite rejected attempt, reloads the preview and requires a separate confirmation', async () => {
  const f = setup({ async confirm() { f.calls.confirm.push({}); throw new OrderCreationError('Actualiza precios.', 'conflict'); } });
  await open(f); await f.controller.confirm(); assert.equal(f.calls.confirm.length, 1); assert.equal(f.calls.clear, 1);
  assert.equal(f.calls.preview, 2); assert.equal(f.controller.getSnapshot().uncertain, false); assert.equal(f.controller.getSnapshot().receipt, null);
  assert.match(f.controller.getSnapshot().message, /Revisa/); f.controller.stop();
});

test('preflight detects a modified remote cart and updates the summary without persisting or posting', async () => {
  let reads = 0; const f = setup({ async load() { reads++; return context(reads === 1 ? 2 : 3); }, async preview() { return quote(3); } });
  await open(f); await f.controller.confirm(); assert.equal(f.calls.confirm.length, 0); assert.equal(f.calls.set, 0);
  assert.equal(f.controller.getSnapshot().context.cart.items[0].quantity, 3); assert.match(f.controller.getSnapshot().message, /cambió/); f.controller.stop();
});

test('preflight detects a modified selected address and never creates against its stale snapshot', async () => {
  let reads = 0; const f = setup({ async load() { const value = context(); if (++reads > 1) value.addresses[0].street = 'Otra calle'; return value; } });
  await open(f); await f.controller.confirm(); assert.equal(f.calls.confirm.length, 0); assert.equal(f.calls.keys, 0);
  assert.equal(f.controller.getSnapshot().context.addresses[0].street, 'Otra calle'); f.controller.stop();
});

test('storage failure before POST sends nothing and retry repairs persistence using the same key', async () => {
  let sets = 0; const f = setup({}, { store: { async set(id, attempt) { if (++sets === 1) throw new Error('storage private details'); f.records.set(id, attempt); } } });
  await open(f); await f.controller.confirm(); assert.equal(f.calls.confirm.length, 0); assert.equal(f.controller.getSnapshot().uncertain, true);
  assert.doesNotMatch(f.controller.getSnapshot().message, /private details/); await f.controller.retryConfirmation();
  assert.equal(f.calls.confirm.length, 1); assert.equal(f.calls.confirm[0].key, KEY); assert.equal(f.calls.keys, 1); f.controller.stop();
});

test('confirmed receipt persistence failure never clears cart and retries the same POST key', async () => {
  let failed = false; const f = setup({}, { store: { async set(id, attempt) {
    if (attempt.phase === 'confirmed' && !failed) { failed = true; throw new Error('disk'); } f.records.set(id, attempt);
  } } }); await open(f); await f.controller.confirm(); assert.equal(f.calls.clearCart, 0); assert.ok(f.controller.getSnapshot().receipt);
  assert.equal(f.controller.getSnapshot().uncertain, true); assert.equal(f.records.get(USER).phase, 'pending');
  await f.controller.reconcileCart(); assert.equal(f.calls.readCart, 0); await f.controller.retryConfirmation();
  assert.equal(f.calls.confirm.length, 2); assert.equal(f.calls.confirm[0].key, f.calls.confirm[1].key); assert.equal(f.calls.clearCart, 1); f.controller.stop();
});

test('cart cleanup failure retains created receipt and reconcile only reads/deletes without another POST', async () => {
  let failures = 0; const f = setup({ async readCart() { f.calls.readCart++; if (++failures === 1) throw new OrderCreationError('Sin conexión.', 'network'); return cart(); } });
  await open(f); await f.controller.confirm(); assert.ok(f.controller.getSnapshot().receipt); assert.equal(f.controller.getSnapshot().cleanupPending, true);
  assert.equal(f.controller.getSnapshot().uncertain, false); assert.equal(f.records.get(USER).phase, 'confirmed');
  await f.controller.confirm(); await f.controller.retryConfirmation(); assert.equal(f.calls.confirm.length, 1);
  await f.controller.reconcileCart(); assert.equal(f.calls.confirm.length, 1); assert.equal(f.calls.clearCart, 1); assert.equal(f.controller.getSnapshot().cleanupPending, false); f.controller.stop();
});

test('persisted confirmed receipt restores without creation and cleanup explicitly uses only cart operations', async () => {
  const f = setup(); f.records.set(USER, { ...pending(), phase: 'confirmed', receipt: confirmation(), normalizedItems: input().items });
  await open(f); assert.equal(f.calls.load, 0); assert.equal(f.calls.confirm.length, 0); assert.equal(f.controller.getSnapshot().cleanupPending, true);
  await f.controller.retryConfirmation(); await f.controller.confirm(); assert.equal(f.calls.confirm.length, 0);
  await f.controller.reconcileCart(); assert.equal(f.calls.clearCart, 1); assert.equal(f.records.has(USER), false); f.controller.stop();
});

test('new cart contents observed after confirmation are preserved and replace the shared cart snapshot', async () => {
  const f = setup({ async readCart() { f.calls.readCart++; return cart(3); } }); await open(f); await f.controller.confirm();
  assert.equal(f.calls.clearCart, 0); assert.equal(f.info().refreshedCart.items[0].quantity, 3);
  assert.equal(f.controller.getSnapshot().cleanupPending, false); assert.equal(f.records.has(USER), false); f.controller.stop();
});

test('logout during POST hides PII immediately, aborts the request and preserves recovery without late publications', async () => {
  const response = deferred(); let signal; const f = setup({ async confirm(values, key, options) { f.calls.confirm.push({ values, key }); signal = options.signal; return response.promise; } });
  await open(f); const request = f.controller.confirm(); await tick(); f.session.publish({ status: 'anonymous', user: null, message: null });
  assert.equal(signal.aborted, true); assert.equal(f.controller.getSnapshot().context, null); assert.equal(f.controller.getSnapshot().contact, null);
  assert.equal(f.controller.getSnapshot().receipt, null); response.resolve(confirmation()); await request;
  assert.equal(f.calls.clearCart, 0); assert.equal(f.controller.getSnapshot().status, 'anonymous'); assert.equal(f.records.get(USER).phase, 'pending'); f.controller.stop();
});

test('account switch cancels stale context, initializes the new contact and never exposes the old pending payload', async () => {
  const response = deferred(); let reads = 0; const s = session(); const f = setup({ async load() { if (++reads === 1) return response.promise; return context(2, OTHER); } }, { session: s });
  f.controller.start(); const request = f.controller.open(); await tick(); s.publish(auth(OTHER)); await tick();
  response.resolve(context()); await request; assert.equal(f.controller.getSnapshot().context.profile.id, OTHER);
  assert.equal(f.controller.getSnapshot().uncertain, false); assert.equal(f.calls.confirm.length, 0); f.controller.stop();
});

test('closing during POST preserves its pending key and reopening does not automatically resend', async () => {
  const response = deferred(); const f = setup({ async confirm(values, key) { f.calls.confirm.push({ values, key }); return response.promise; } });
  await open(f); const request = f.controller.confirm(); await tick(); f.controller.close(); assert.equal(f.controller.getSnapshot().contact, null);
  await f.controller.open(); assert.equal(f.controller.getSnapshot().uncertain, true); assert.equal(f.calls.confirm.length, 1);
  response.resolve(confirmation()); await request; assert.equal(f.calls.clearCart, 0); assert.equal(f.controller.getSnapshot().receipt, null); f.controller.stop();
});

test('no public snapshot contains an idempotency key, pending request body, token or unexpected receipt properties', async () => {
  const f = setup({ async confirm() { return { ...confirmation(), key: 'private', accessToken: 'secret' }; } }); await open(f); await f.controller.confirm();
  const state = f.controller.getSnapshot(); assert.equal(state.key, undefined); assert.equal(state.pending, undefined); assert.equal(state.input, undefined);
  assert.equal(state.receipt.key, undefined); assert.equal(state.receipt.accessToken, undefined); assert.doesNotMatch(JSON.stringify(state), /secure-order-key|secret/); f.controller.stop();
});

test('failed recovery storage read blocks a new confirmation until it can safely recover pending attempts', async () => {
  let reads = 0; const f = setup({}, { store: { async get() { if (++reads === 1) throw new Error('disk'); return null; } } });
  await open(f); await f.controller.confirm(); assert.equal(f.calls.load, 0); assert.equal(f.calls.confirm.length, 0); assert.equal(f.controller.getSnapshot().requiresRefresh, true);
  await f.controller.refresh(); assert.equal(f.controller.getSnapshot().requiresRefresh, false); await f.controller.confirm(); assert.equal(f.calls.confirm.length, 1); f.controller.stop();
});

test('a cleanup store clear finishing after close cannot resurrect its old confirmed record or delete a new identical bag', async () => {
  const clearing = deferred(); let began = false;
  const f = setup({}, { store: { async clear(id) { began = true; await clearing.promise; f.records.delete(id); } } });
  await open(f); const request = f.controller.confirm(); await tick(); assert.equal(began, true); assert.equal(f.calls.clearCart, 1);
  f.controller.close(); clearing.resolve(); await request; await f.controller.open();
  assert.equal(f.controller.getSnapshot().receipt, null); assert.equal(f.controller.getSnapshot().cleanupPending, false);
  await f.controller.reconcileCart(); assert.equal(f.calls.clearCart, 1); f.controller.stop();
});

test('a focus open before provider start is remembered and loads once the provider subscribes', async () => {
  const f = setup(); await f.controller.open(); assert.equal(f.calls.load, 0); f.controller.start(); await tick();
  assert.equal(f.calls.load, 1); assert.ok(f.controller.getSnapshot().context); f.controller.stop();
});

test('a confirmed store write finishing after close restores its receipt without downgrading to a pending POST', async () => {
  const writing = deferred(); let waiting = false;
  const f = setup({}, { store: { async set(id, attempt) {
    if (attempt.phase === 'confirmed') { waiting = true; await writing.promise; } f.records.set(id, attempt);
  } } }); await open(f); const request = f.controller.confirm(); await tick(); assert.equal(waiting, true);
  f.controller.close(); writing.resolve(); await request; await f.controller.open();
  assert.equal(f.controller.getSnapshot().uncertain, false); assert.equal(f.controller.getSnapshot().cleanupPending, true);
  assert.ok(f.controller.getSnapshot().receipt); await f.controller.retryConfirmation(); assert.equal(f.calls.confirm.length, 1);
  await f.controller.reconcileCart(); assert.equal(f.calls.confirm.length, 1); assert.equal(f.calls.clearCart, 1); f.controller.stop();
});

test('loading a foreign account profile never publishes its context, contact or quote', async () => {
  const f = setup({ async load() { return context(2, OTHER); } }); await open(f);
  const state = f.controller.getSnapshot(); assert.equal(state.context, null); assert.equal(state.contact, null);
  assert.equal(state.quote, null); assert.equal(state.requiresRefresh, true); assert.equal(f.calls.preview, 0);
  assert.doesNotMatch(JSON.stringify(state), new RegExp(OTHER)); await f.controller.confirm();
  assert.equal(f.calls.confirm.length, 0); assert.equal(f.calls.set, 0); f.controller.stop();
});

test('a foreign profile during preflight blocks POST and preserves only the active account previous snapshot', async () => {
  let reads = 0; const f = setup({ async load() { return context(2, ++reads === 1 ? USER : OTHER); } });
  await open(f); await f.controller.confirm(); const state = f.controller.getSnapshot();
  assert.equal(state.context.profile.id, USER); assert.equal(state.requiresRefresh, true);
  assert.equal(state.confirming, false); assert.equal(f.calls.confirm.length, 0); assert.equal(f.calls.set, 0);
  assert.equal(f.calls.keys, 0); assert.doesNotMatch(JSON.stringify(state), new RegExp(OTHER)); f.controller.stop();
});

test('successful DELETE followed by failed recovery deletion restores its receipt in a new instance and reconciles GET without POST', async () => {
  let clears = 0;
  const f = setup({}, { store: { async clear(id) {
    if (++clears === 1) throw new OrderCreationError('No pudimos limpiar la recuperación.', 'storage'); f.records.delete(id);
  } } }); await open(f); await f.controller.confirm();
  assert.equal(f.calls.confirm.length, 1); assert.equal(f.calls.clearCart, 1);
  assert.equal(f.records.get(USER).phase, 'confirmed'); assert.equal(f.controller.getSnapshot().cleanupPending, true); f.controller.stop();
  const reopened = setup({ async readCart() { reopened.calls.readCart++; return cart(0); } }, { store: f.store });
  await open(reopened); assert.ok(reopened.controller.getSnapshot().receipt);
  assert.equal(reopened.controller.getSnapshot().cleanupPending, true); assert.equal(reopened.calls.confirm.length, 0);
  await reopened.controller.reconcileCart(); assert.equal(reopened.calls.readCart, 1);
  assert.equal(reopened.calls.confirm.length, 0); assert.equal(reopened.calls.clearCart, 0);
  assert.equal(reopened.controller.getSnapshot().cleanupPending, false); assert.equal(f.records.has(USER), false); reopened.controller.stop();
});
