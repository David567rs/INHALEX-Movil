const assert = require('node:assert/strict');
const { Buffer } = require('node:buffer');
const http = require('node:http');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiCartRepository } = require('../src/features/cart/data/repositories/ApiCartRepository.ts');
const { ApiShippingAddressRepository } = require('../src/features/shippingAddresses/data/repositories/ApiShippingAddressRepository.ts');
const { ApiProfileRepository } = require('../src/features/profile/data/repositories/ApiProfileRepository.ts');
const { ApiOrderCreationRepository } = require('../src/features/orderCreation/data/repositories/ApiOrderCreationRepository.ts');
const { MemoryOrderAttemptStore } = require('../src/features/orderCreation/data/storage/MemoryOrderAttemptStore.ts');
const { createOrderCreationActions } = require('../src/features/orderCreation/domain/useCases/orderCreationActions.ts');
const { createOrderCreationController } = require('../src/features/orderCreation/presentation/state/createOrderCreationController.ts');

const ACCOUNT = '507f1f77bcf86cd799439001';
const PRODUCT = '507f1f77bcf86cd799439002';
const ADDRESS = '507f1f77bcf86cd799439003';
const ORDER = '507f1f77bcf86cd799439004';
const TOKEN = 'synthetic.http.session';
const profile = { _id: ACCOUNT, firstName: 'Valeria', lastName: 'Flores', email: 'valeria@example.test', phone: '5500000000' };
const address = { id: ADDRESS, label: 'Casa', recipientName: 'Valeria Flores', phone: '5500000000', street: 'Calle Ejemplo',
  exteriorNumber: '18', interiorNumber: '', neighborhood: 'Centro', municipality: 'Municipio Ejemplo',
  state: 'Estado Ejemplo', postalCode: '01234', references: '', isDefault: true };
const cartResponse = (quantity) => ({ items: quantity ? [{ productId: PRODUCT, quantity, subtotal: 129 * quantity,
  product: { _id: PRODUCT, name: 'Lavanda', description: 'Esencia floral de ejemplo', aromas: ['Lavanda'], price: 129,
    currency: 'MXN', image: '/products/lavanda.png', inStock: true, promoActive: false } }] : [],
totalItems: quantity, subtotal: quantity * 129, currency: 'MXN' });
function quoteResponse(quantity, signature = 'a'.repeat(64)) {
  return { items: [{ productId: PRODUCT, productName: 'Lavanda', productSlug: 'lavanda', image: '/products/lavanda.png',
    category: 'floral', presentation: '10 ml', origin: 'México', unitPrice: 129, currency: 'MXN',
    requestedQuantity: quantity, quantity, subtotal: 129 * quantity, fulfillment: 'available', stockAvailable: 10,
    reservedQuantity: quantity, backorderQuantity: 0, inventoryTracked: true, allowBackorder: false }],
  issues: [], subtotal: 129 * quantity, totalItems: quantity, currency: 'MXN', canCreateDraft: true,
  canConfirmOrder: true, needsManualReview: false, signature };
}
const receiptResponse = (quantity, signature) => ({ ...quoteResponse(quantity, signature), orderId: ORDER,
  reference: 'PED-20261019-HTTP01', status: 'pending_review', createdAt: '2026-10-19T18:00:00.000Z' });

function syntheticSession() {
  const snapshot = Object.freeze({ status: 'authenticated', message: null,
    user: { id: ACCOUNT, firstName: profile.firstName, lastName: profile.lastName, email: profile.email, phone: profile.phone } });
  return { getSnapshot: () => snapshot, subscribe: () => () => {}, restore: async () => {},
    signIn: async () => snapshot.user, signOut: async () => {} };
}

async function fixture(initial = {}) {
  const state = { quantity: 2, unauthorized: false, conflictOnce: false, loseResponseOnce: false,
    malformedResponseOnce: false, failCleanupReadOnce: false, loseCleanupDeleteOnce: false,
    changeCartAfterConfirmation: false, signature: 'a'.repeat(64), ...initial };
  const requests = [], fixtureErrors = [], records = new Map();
  const server = http.createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json');
    const send = (status, value) => { response.statusCode = status; response.end(JSON.stringify(value)); };
    try {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined;
      requests.push({ method: request.method, path: request.url, body,
        authorization: request.headers.authorization, key: request.headers['idempotency-key'], cookie: request.headers.cookie });
      if (state.unauthorized || request.headers.authorization !== `Bearer ${TOKEN}`) {
        return send(401, { message: 'private fixture diagnostic' });
      }
      if (request.method === 'GET' && request.url === '/api/cart') {
        if (records.size && state.failCleanupReadOnce) {
          state.failCleanupReadOnce = false; return send(503, { message: 'private cart diagnostic' });
        }
        return send(200, cartResponse(state.quantity));
      }
      if (request.method === 'GET' && request.url === '/api/addresses') return send(200, [address]);
      if (request.method === 'GET' && request.url === '/api/auth/me') return send(200, profile);
      if (request.method === 'POST' && request.url === '/api/orders/draft/preview') {
        assert.deepEqual(Object.keys(body), ['items']);
        assert.equal(request.headers['idempotency-key'], undefined);
        return send(201, quoteResponse(body.items[0].quantity, state.signature));
      }
      if (request.method === 'POST' && request.url === '/api/orders/confirm') {
        const key = request.headers['idempotency-key'];
        assert.match(key, /^[A-Za-z0-9_-]{16,100}$/);
        assert.deepEqual(Object.keys(body).sort(), ['customerName', 'customerEmail', 'customerPhone', 'notes', 'items', 'shippingAddressId', 'previewSignature'].sort());
        assert.equal(body.shippingAddressId, ADDRESS);
        if (records.has(key)) return send(201, records.get(key));
        if (state.conflictOnce) {
          state.conflictOnce = false; state.signature = 'b'.repeat(64);
          return send(409, { message: 'private inventory diagnostic' });
        }
        if (body.previewSignature !== state.signature) return send(409, { message: 'Inventory changed' });
        const receipt = receiptResponse(body.items[0].quantity, state.signature);
        records.set(key, receipt);
        if (state.changeCartAfterConfirmation) state.quantity = 3;
        if (state.loseResponseOnce) { state.loseResponseOnce = false; response.destroy(); return; }
        if (state.malformedResponseOnce) {
          state.malformedResponseOnce = false; response.statusCode = 201; response.end('{incomplete'); return;
        }
        return send(201, receipt);
      }
      if (request.method === 'DELETE' && request.url === '/api/cart') {
        state.quantity = 0;
        if (state.loseCleanupDeleteOnce) { state.loseCleanupDeleteOnce = false; response.destroy(); return; }
        return send(200, cartResponse(0));
      }
      return send(404, { message: 'Unexpected fixture route' });
    } catch (error) {
      fixtureErrors.push(error);
      if (!response.destroyed) send(500, { message: 'Fixture assertion failed' });
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => { server.removeListener('error', reject); resolve(); });
  });
  const client = new HttpClient({ baseUrl: `http://127.0.0.1:${server.address().port}/api`, isDevelopment: true,
    getAccessToken: () => TOKEN, requestTimeoutMs: 1500 });
  const sourceCart = new ApiCartRepository(client);
  const actions = createOrderCreationActions(new ApiOrderCreationRepository(client, {
    cart: sourceCart, addresses: new ApiShippingAddressRepository(client), profile: new ApiProfileRepository(client),
  }));
  const attemptStore = new MemoryOrderAttemptStore();
  let keyCount = 0, locked = false, releasedCart = null;
  const controller = createOrderCreationController(syntheticSession(), actions, { attemptStore,
    createKey: () => `http-order-key-${String(++keyCount).padStart(16, '0')}`,
    cart: { acquireCheckout() {
      if (locked) return null;
      locked = true; let live = true;
      return { isCurrent: () => live, release(cart) { if (!live) return; live = false; locked = false; if (cart) releasedCart = cart; } };
    } },
  });
  controller.start();
  return { state, requests, records, controller, attemptStore, info: () => ({ keyCount, locked, releasedCart }),
    async close() {
      controller.stop(); server.closeAllConnections();
      await new Promise((resolve) => server.close(resolve));
      assert.deepEqual(fixtureErrors, []);
    } };
}
const confirms = (f) => f.requests.filter((request) => request.path === '/api/orders/confirm');
const previews = (f) => f.requests.filter((request) => request.path === '/api/orders/draft/preview');
const deletes = (f) => f.requests.filter((request) => request.method === 'DELETE');

test('order real loopback HTTP composes authenticated context, quote, idempotent confirmation and verified cart cleanup', async (t) => {
  const f = await fixture(); t.after(() => f.close());
  await f.controller.open();
  const loaded = f.controller.getSnapshot();
  assert.equal(loaded.context.profile.email, profile.email); assert.equal(loaded.selectedAddressId, ADDRESS);
  assert.equal(loaded.quote.subtotal, 258); assert.equal(loaded.quote.items[0].productName, 'Lavanda');
  await Promise.all([f.controller.confirm(), f.controller.confirm()]);
  const completed = f.controller.getSnapshot();
  assert.equal(completed.receipt.reference, 'PED-20261019-HTTP01'); assert.equal(completed.receipt.status, 'pending_review');
  assert.equal(completed.cleanupPending, false); assert.equal(completed.uncertain, false);
  assert.equal(confirms(f).length, 1); assert.equal(previews(f).length, 1); assert.equal(deletes(f).length, 1);
  assert.equal(f.records.size, 1); assert.equal(f.info().keyCount, 1); assert.equal(f.info().releasedCart.items.length, 0);
  assert.equal(await f.attemptStore.get(ACCOUNT), null);
  assert.ok(f.requests.every((request) => request.authorization === `Bearer ${TOKEN}` && request.cookie === undefined));
  assert.deepEqual(confirms(f)[0].body.items, [{ productId: PRODUCT, quantity: 2 }]);
  assert.doesNotMatch(JSON.stringify(completed), /http-order-key|synthetic\.http\.session/);
});

test('lost confirmation socket preserves its persisted key and explicit recovery returns one server order', async (t) => {
  const f = await fixture({ loseResponseOnce: true }); t.after(() => f.close());
  await f.controller.open(); await f.controller.confirm();
  assert.equal(f.records.size, 1); assert.equal(f.controller.getSnapshot().uncertain, true);
  assert.equal(f.controller.getSnapshot().receipt, null); assert.equal(deletes(f).length, 0);
  const pending = await f.attemptStore.get(ACCOUNT);
  assert.equal(pending.phase, 'pending'); assert.equal(pending.key, confirms(f)[0].key);
  f.controller.close(); await f.controller.open();
  assert.equal(f.controller.getSnapshot().uncertain, true); assert.equal(confirms(f).length, 1);
  const previewCount = previews(f).length;
  await f.controller.retryConfirmation();
  assert.equal(confirms(f).length, 2); assert.equal(f.records.size, 1); assert.equal(f.info().keyCount, 1);
  assert.equal(confirms(f)[1].key, confirms(f)[0].key); assert.deepEqual(confirms(f)[1].body, confirms(f)[0].body);
  assert.equal(previews(f).length, previewCount); assert.equal(f.controller.getSnapshot().uncertain, false);
  assert.ok(f.controller.getSnapshot().receipt); assert.equal(deletes(f).length, 1);
});

test('HTTP 409 rejects the stale confirmation, refreshes its signature and waits for a separate explicit confirmation', async (t) => {
  const f = await fixture({ conflictOnce: true }); t.after(() => f.close());
  await f.controller.open(); await f.controller.confirm();
  const rejected = f.controller.getSnapshot();
  assert.equal(confirms(f).length, 1); assert.equal(f.records.size, 0); assert.equal(previews(f).length, 2);
  assert.equal(rejected.quote.signature, 'b'.repeat(64)); assert.equal(rejected.uncertain, false); assert.equal(rejected.receipt, null);
  assert.match(rejected.message, /Revisa el resumen/); assert.equal(await f.attemptStore.get(ACCOUNT), null);
  await f.controller.retryConfirmation(); assert.equal(confirms(f).length, 1);
  await f.controller.confirm();
  assert.equal(confirms(f).length, 2); assert.equal(f.records.size, 1);
  assert.notEqual(confirms(f)[1].key, confirms(f)[0].key);
  assert.equal(confirms(f)[1].body.previewSignature, 'b'.repeat(64));
});

test('cleanup HTTP failure keeps the receipt and reconciliation uses cart requests without repeating order creation', async () => {
  for (const mode of ['failCleanupReadOnce', 'loseCleanupDeleteOnce']) {
    const f = await fixture({ [mode]: true });
    try {
      await f.controller.open(); await f.controller.confirm();
      assert.ok(f.controller.getSnapshot().receipt); assert.equal(f.controller.getSnapshot().cleanupPending, true);
      assert.equal(f.controller.getSnapshot().uncertain, false); assert.equal((await f.attemptStore.get(ACCOUNT)).phase, 'confirmed');
      const requestCount = f.requests.length;
      await f.controller.confirm(); await f.controller.retryConfirmation();
      assert.equal(confirms(f).length, 1);
      await f.controller.reconcileCart();
      assert.equal(confirms(f).length, 1); assert.equal(f.records.size, 1); assert.equal(f.controller.getSnapshot().cleanupPending, false);
      assert.equal(await f.attemptStore.get(ACCOUNT), null);
      const recovery = f.requests.slice(requestCount);
      assert.ok(recovery.every((request) => request.path === '/api/cart'));
      if (mode === 'loseCleanupDeleteOnce') assert.deepEqual(recovery.map((request) => request.method), ['GET']);
      else assert.deepEqual(recovery.map((request) => request.method), ['GET', 'DELETE']);
    } finally { await f.close(); }
  }
});

test('changed remote cart after confirmation is retained without DELETE while the created receipt remains visible', async (t) => {
  const f = await fixture({ changeCartAfterConfirmation: true }); t.after(() => f.close());
  await f.controller.open(); await f.controller.confirm();
  const result = f.controller.getSnapshot();
  assert.ok(result.receipt); assert.equal(result.cleanupPending, false); assert.equal(deletes(f).length, 0);
  assert.equal(f.state.quantity, 3); assert.equal(f.info().releasedCart.items[0].quantity, 3);
  assert.equal(result.context.cart.totalItems, 3); assert.match(result.message, /Conservamos la bolsa/);
  assert.equal(await f.attemptStore.get(ACCOUNT), null);
});

test('unauthorized context over HTTP expires the screen and prevents every order POST', async (t) => {
  const f = await fixture({ unauthorized: true }); t.after(() => f.close());
  await f.controller.open(); await f.controller.confirm(); await f.controller.retryConfirmation();
  const result = f.controller.getSnapshot();
  assert.equal(result.status, 'expired'); assert.equal(result.context, null); assert.equal(result.contact, null);
  assert.equal(result.receipt, null); assert.equal(confirms(f).length, 0); assert.equal(previews(f).length, 0);
  assert.equal(f.requests.filter((request) => request.method === 'POST').length, 0);
  assert.doesNotMatch(result.message, /private fixture diagnostic/);
});

test('malformed JSON after server creation retains the original key until its valid replay is acknowledged', async (t) => {
  const f = await fixture({ malformedResponseOnce: true }); t.after(() => f.close());
  await f.controller.open(); await f.controller.confirm();
  assert.equal(f.controller.getSnapshot().uncertain, true); assert.equal(f.controller.getSnapshot().receipt, null);
  assert.equal(f.records.size, 1); assert.equal((await f.attemptStore.get(ACCOUNT)).key, confirms(f)[0].key);
  await f.controller.retryConfirmation();
  assert.equal(f.records.size, 1); assert.equal(confirms(f).length, 2); assert.equal(confirms(f)[0].key, confirms(f)[1].key);
  assert.deepEqual(confirms(f)[0].body, confirms(f)[1].body);
  assert.equal(f.controller.getSnapshot().cleanupPending, false); assert.equal(f.controller.getSnapshot().uncertain, false);
  assert.equal(await f.attemptStore.get(ACCOUNT), null);
});
