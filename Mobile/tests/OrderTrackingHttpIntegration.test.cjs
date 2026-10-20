const assert = require('node:assert/strict');
const { Buffer } = require('node:buffer');
const http = require('node:http');
const { setTimeout: pause } = require('node:timers/promises');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiOrderTrackingRepository } = require('../src/features/orderTracking/data/repositories/ApiOrderTrackingRepository.ts');
const { createOrderTrackingActions } = require('../src/features/orderTracking/domain/useCases/orderTrackingActions.ts');
const { createOrderTrackingController } = require('../src/features/orderTracking/presentation/state/createOrderTrackingController.ts');

const ID = '507f1f77bcf86cd799439011';
const OTHER = '507f1f77bcf86cd799439012';
const PRODUCT = '507f1f77bcf86cd799439013';
const USER = '0123456789abcdef01234567';
const SECOND_USER = 'abcdef0123456789abcdef01';
const CREATED = '2026-10-20T12:00:00.000Z';
const CONFIRMED = '2026-10-20T13:00:00.000Z';
const ENDED = '2026-10-21T13:00:00.000Z';
const summary = (changes = {}) => ({ id: ID, reference: 'PED-20261020-ABC123', status: 'pending_review',
  currency: 'MXN', totalItems: 2, subtotal: 259.98, createdAt: CREATED, ...changes });
const tracking = (changes = {}) => ({ ...summary(), confirmedAt: null, cancelledAt: null, completedAt: null, ...changes });
const detail = (changes = {}) => ({ ...summary(), items: [{ productId: PRODUCT, productName: 'Lavanda',
  presentation: '10 ml', image: null, quantity: 2, unitPrice: 129.99, subtotal: 259.98, currency: 'MXN' }],
  shippingAddress: null, ...changes });
const authenticated = (id = USER) => ({ status: 'authenticated', user: { id, firstName: 'Cliente',
  lastName: 'Prueba', email: 'cliente@example.test', phone: '5500000000' }, message: null });

function session(initial = authenticated()) {
  let state = initial;
  const listeners = new Set();
  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async restore() {}, async signIn() { return state.user; }, async signOut() {},
    publish(next) { state = next; for (const listener of [...listeners]) listener(); },
  };
}

async function waitFor(predicate) {
  const deadline = Date.now() + 2000;
  while (!predicate()) {
    assert.ok(Date.now() < deadline, 'the real HTTP operation did not settle');
    await pause(5);
  }
}

async function apiFor(t, handler) {
  const requests = [];
  const server = http.createServer((request, response) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      requests.push({ method: request.method, url: request.url, authorization: request.headers.authorization,
        cookie: request.headers.cookie, idempotencyKey: request.headers['idempotency-key'],
        body: Buffer.concat(chunks).toString('utf8') });
      response.setHeader('Content-Type', 'application/json');
      response.setHeader('Cache-Control', 'private, no-store');
      const send = (status, value) => { response.statusCode = status; response.end(JSON.stringify(value)); };
      Promise.resolve().then(() => handler(request, response, send)).catch(() => {
        if (!response.destroyed && !response.writableEnded) send(500, { message: 'private fixture diagnostic' });
      });
    });
  });
  t.after(async () => {
    server.closeAllConnections();
    if (server.listening) await new Promise((resolve) => server.close(resolve));
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => { server.removeListener('error', reject); resolve(); });
  });
  return { requests, baseUrl: `http://127.0.0.1:${server.address().port}/api` };
}

function moduleFor(t, baseUrl, auth = session(), token = () => 'test.first.signature') {
  const repository = new ApiOrderTrackingRepository(new HttpClient({ baseUrl, isDevelopment: true,
    requestTimeoutMs: 1000, fetch: globalThis.fetch, getAccessToken: token }));
  const controller = createOrderTrackingController(auth, createOrderTrackingActions(repository));
  t.after(() => controller.stop());
  controller.start();
  return { auth, controller };
}

test('tracking real HTTP reads detail then tracking with Bearer only and never exposes internal fields', async (t) => {
  const api = await apiFor(t, (request, response, send) => {
    if (request.headers.authorization !== 'Bearer test.first.signature') return send(401, { message: 'private authentication' });
    if (request.url === `/api/orders/me/${ID}`) return send(200, { ...detail(), customerUserId: 'private',
      items: detail().items.map((item) => ({ ...item, internalNote: 'private' })) });
    if (request.url === `/api/orders/me/${ID}/tracking`) return send(200,
      tracking({ status: 'confirmed', confirmedAt: CONFIRMED, idempotencyKey: 'private' }));
    send(404, { message: 'private route' });
  });
  const { controller } = moduleFor(t, api.baseUrl);
  assert.equal(api.requests.length, 0, 'an unselected screen must not make a request');
  await controller.selectOrder(ID.toUpperCase());
  const state = controller.getSnapshot();
  assert.equal(state.status, 'ready'); assert.equal(state.order.id, ID);
  assert.equal(state.order.status, 'confirmed', 'the later tracking response is authoritative');
  assert.equal(state.order.confirmedAt, CONFIRMED); assert.equal(state.order.unitCount, 2);
  assert.equal(state.order.items[0].productName, 'Lavanda');
  assert.ok(Object.isFrozen(state.order)); assert.ok(Object.isFrozen(state.order.items));
  assert.doesNotMatch(JSON.stringify(state), /private|Bearer|signature/);
  assert.deepEqual(api.requests.map((request) => request.url), [`/api/orders/me/${ID}`, `/api/orders/me/${ID}/tracking`]);
  assert.ok(api.requests.every((request) => request.method === 'GET' && request.body === ''
    && request.cookie === undefined && request.idempotencyKey === undefined));
  assert.ok(api.requests.every((request) => request.authorization === 'Bearer test.first.signature'));
});

test('tracking refresh reads current persisted fixture states and keeps absent event dates without inventing them', async (t) => {
  let current = tracking();
  const api = await apiFor(t, (request, response, send) => send(200,
    request.url.endsWith('/tracking') ? current : detail({ id: current.id, reference: current.reference })));
  const { controller } = moduleFor(t, api.baseUrl);
  await controller.selectOrder(ID);
  assert.equal(controller.getSnapshot().order.status, 'pending_review');
  assert.equal(controller.getSnapshot().order.confirmedAt, null);
  current = tracking({ status: 'confirmed', confirmedAt: CONFIRMED });
  await controller.refresh();
  assert.equal(controller.getSnapshot().order.status, 'confirmed');
  assert.equal(controller.getSnapshot().order.confirmedAt, CONFIRMED);
  current = tracking({ status: 'completed' });
  await controller.refresh();
  const completed = controller.getSnapshot().order;
  assert.equal(completed.status, 'completed'); assert.equal(completed.confirmedAt, null);
  assert.equal(completed.completedAt, null, 'historical completed orders can lack recorded dates');
  current = tracking({ id: OTHER, reference: 'PED-CANCELLED', status: 'cancelled', cancelledAt: ENDED });
  await controller.selectOrder(OTHER);
  assert.equal(controller.getSnapshot().order.status, 'cancelled');
  assert.equal(controller.getSnapshot().order.confirmedAt, null);
  assert.equal(controller.getSnapshot().order.cancelledAt, ENDED);
  assert.equal(api.requests.length, 8, 'each explicit selection or refresh performs one pair of GETs');
});

test('tracking network loss and HTTP 503 after a detail read preserve the whole confirmed snapshot until explicit recovery', async (t) => {
  let failure = null;
  let updated = false;
  const api = await apiFor(t, (request, response, send) => {
    if (!request.url.endsWith('/tracking')) return send(200,
      detail(updated ? { items: detail().items.map((item) => ({ ...item, productName: 'Lavanda actualizada' })) } : {}));
    if (failure === 'network') { request.socket.destroy(); return; }
    if (failure === 'server') return send(503, { message: 'private database diagnostic' });
    send(200, tracking(updated ? { status: 'confirmed', confirmedAt: CONFIRMED } : {}));
  });
  const { controller } = moduleFor(t, api.baseUrl);
  await controller.selectOrder(ID);
  const before = controller.getSnapshot().order;
  updated = true;
  for (const kind of ['network', 'server']) {
    failure = kind; await controller.refresh();
    const state = controller.getSnapshot();
    assert.equal(state.status, 'ready'); assert.equal(state.refreshing, false);
    assert.deepEqual(state.order, before, 'a partial new detail cannot replace the prior complete pair');
    assert.ok(state.error); assert.doesNotMatch(state.error, /private|database/);
  }
  failure = null; await controller.refresh();
  const recovered = controller.getSnapshot();
  assert.equal(recovered.error, null); assert.equal(recovered.order.status, 'confirmed');
  assert.equal(recovered.order.items[0].productName, 'Lavanda actualizada');
  assert.equal(api.requests.length, 8, 'the module does not automatically retry failed reads');
});

test('tracking HTTP 404 from either paired endpoint removes the prior receipt and an explicit refresh can recover', async (t) => {
  let missingStage = null;
  const api = await apiFor(t, (request, response, send) => {
    const isTracking = request.url.endsWith('/tracking');
    if (missingStage === (isTracking ? 'tracking' : 'detail')) return send(404, { message: 'private foreign owner' });
    send(200, isTracking ? tracking() : detail());
  });
  const { controller } = moduleFor(t, api.baseUrl);
  await controller.selectOrder(ID);
  for (const stage of ['detail', 'tracking']) {
    missingStage = stage; await controller.refresh();
    const missing = controller.getSnapshot();
    assert.equal(missing.status, 'not-found'); assert.equal(missing.order, null);
    assert.equal(missing.selectedOrderId, ID); assert.doesNotMatch(missing.error, /private|foreign/);
    missingStage = null; await controller.refresh();
    assert.equal(controller.getSnapshot().status, 'ready'); assert.equal(controller.getSnapshot().order.id, ID);
  }
  assert.equal(api.requests.length, 9);
});

test('tracking HTTP 401 from either endpoint clears the module without changing the global authentication snapshot', async (t) => {
  for (const stage of ['detail', 'tracking']) {
    const api = await apiFor(t, (request, response, send) => {
      const isTracking = request.url.endsWith('/tracking');
      if (stage === (isTracking ? 'tracking' : 'detail')) return send(401, { message: 'private token diagnostic' });
      send(200, isTracking ? tracking() : detail());
    });
    const { controller, auth } = moduleFor(t, api.baseUrl);
    const authorization = auth.getSnapshot();
    await controller.selectOrder(ID);
    const state = controller.getSnapshot();
    assert.equal(state.status, 'session-expired'); assert.equal(state.order, null);
    assert.equal(auth.getSnapshot(), authorization);
    assert.doesNotMatch(state.error, /private|token/);
    const count = api.requests.length;
    await controller.refresh(); await controller.selectOrder(OTHER);
    assert.equal(api.requests.length, count, 'the rejected authorization identity cannot trigger another read');
    controller.stop();
  }
});

test('tracking malformed JSON, a different order ID and an invalid event timestamp never publish unsafe or mismatched data', async (t) => {
  let mode = 'json';
  const api = await apiFor(t, (request, response, send) => {
    if (!request.url.endsWith('/tracking')) return send(200, detail());
    if (mode === 'json') { response.end('{"private diagnostic":'); return; }
    send(200, tracking(mode === 'other' ? { id: OTHER } : mode === 'date' ? { confirmedAt: 'not-a-date-private' } : {}));
  });
  const { controller } = moduleFor(t, api.baseUrl);
  await controller.selectOrder(ID);
  assert.equal(controller.getSnapshot().status, 'error'); assert.equal(controller.getSnapshot().order, null);
  assert.doesNotMatch(JSON.stringify(controller.getSnapshot()), /private|diagnostic/);
  mode = 'ready'; await controller.refresh();
  const before = controller.getSnapshot().order;
  for (const invalid of ['other', 'date']) {
    mode = invalid; await controller.refresh();
    const state = controller.getSnapshot();
    assert.equal(state.status, 'ready'); assert.deepEqual(state.order, before);
    assert.ok(state.error); assert.doesNotMatch(JSON.stringify(state), /private|diagnostic|not-a-date/);
  }
  assert.equal(api.requests.length, 8);
});

test('tracking changing accounts aborts a late paired response and requires ownership of the new selected order', async (t) => {
  let delayedResponse;
  let trackingRequested = false;
  const api = await apiFor(t, (request, response, send) => {
    const account = new Map([['Bearer test.first.signature', 'first'],
      ['Bearer test.second.signature', 'second']]).get(request.headers.authorization);
    if (!account) return send(401, { message: 'private unknown account' });
    const first = account === 'first';
    const selected = first ? ID : OTHER;
    if (!request.url.startsWith(`/api/orders/me/${selected}`)) return send(404, { message: 'private foreign order' });
    if (first && request.url.endsWith('/tracking')) { delayedResponse = response; trackingRequested = true; return; }
    const changes = { id: selected, reference: first ? summary().reference : 'PED-SECOND' };
    send(200, request.url.endsWith('/tracking') ? tracking(changes) : detail(changes));
  });
  let token = 'test.first.signature';
  const auth = session();
  const { controller } = moduleFor(t, api.baseUrl, auth, () => token);
  const oldSelection = controller.selectOrder(ID);
  await waitFor(() => trackingRequested);
  token = 'test.second.signature'; auth.publish(authenticated(SECOND_USER));
  assert.equal(controller.getSnapshot().order, null);
  await waitFor(() => controller.getSnapshot().status === 'not-found');
  await oldSelection;
  await controller.selectOrder(OTHER);
  assert.equal(controller.getSnapshot().order.id, OTHER);
  if (!delayedResponse.destroyed) delayedResponse.end(JSON.stringify(tracking()));
  await pause(10);
  assert.equal(controller.getSnapshot().order.id, OTHER, 'the first account response cannot replace the new account order');
  auth.publish({ status: 'anonymous', user: null, message: null });
  assert.equal(controller.getSnapshot().status, 'anonymous'); assert.equal(controller.getSnapshot().order, null);
  assert.equal(api.requests.length, 5);
  assert.deepEqual(api.requests.map((request) => request.authorization), [
    'Bearer test.first.signature', 'Bearer test.first.signature',
    'Bearer test.second.signature', 'Bearer test.second.signature', 'Bearer test.second.signature',
  ]);
});

test('tracking Node fetch blocks an HTTP redirect before a synthetic Bearer can reach another origin', async (t) => {
  const destination = await apiFor(t, (request, response, send) => send(200, detail()));
  const api = await apiFor(t, (request, response) => {
    response.statusCode = 302;
    response.setHeader('Location', `${destination.baseUrl}/unexpected`);
    response.end();
  });
  const { controller } = moduleFor(t, api.baseUrl);
  await controller.selectOrder(ID);
  assert.equal(controller.getSnapshot().status, 'error'); assert.equal(controller.getSnapshot().order, null);
  assert.equal(api.requests.length, 1); assert.equal(destination.requests.length, 0);
  assert.equal(api.requests[0].authorization, 'Bearer test.first.signature');
  assert.doesNotMatch(JSON.stringify(controller.getSnapshot()), /Bearer|signature|unexpected/);
});
