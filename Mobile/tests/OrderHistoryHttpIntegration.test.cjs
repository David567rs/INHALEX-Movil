const assert = require('node:assert/strict');
const http = require('node:http');
const { setTimeout: pause } = require('node:timers/promises');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiOrderHistoryRepository } = require('../src/features/orderHistory/data/repositories/ApiOrderHistoryRepository.ts');
const { createOrderHistoryActions } = require('../src/features/orderHistory/domain/useCases/orderHistoryActions.ts');
const { createOrderHistoryController } = require('../src/features/orderHistory/presentation/state/createOrderHistoryController.ts');

const orderId = '507f1f77bcf86cd799439011';
const otherId = '507f1f77bcf86cd799439012';
const productId = '507f1f77bcf86cd799439013';
const accountA = '0123456789abcdef01234567';
const accountB = 'abcdef0123456789abcdef01';
const summary = (changes = {}) => ({ id: orderId, reference: 'PED-20261020-ABC123', status: 'pending_review',
  currency: 'MXN', totalItems: 2, subtotal: 259.98, createdAt: '2026-10-20T12:00:00.000Z', ...changes });
const detail = (changes = {}) => ({ ...summary(), items: [{ productId, productName: 'Lavanda', presentation: '10 ml',
  image: '/products/lavanda.png', quantity: 2, unitPrice: 129.99, subtotal: 259.98, currency: 'MXN' }],
  shippingAddress: null, ...changes });
const page = (orders = [summary()], nextCursor = null) => ({ orders, nextCursor });
const authenticated = (id = accountA) => ({ status: 'authenticated',
  user: { id, name: 'Cliente de prueba', firstName: 'Cliente', lastName: 'Prueba',
    email: 'cliente@example.test', phone: '5500000000' }, message: null });

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

async function withApi(handler, run) {
  const requests = [];
  const server = http.createServer((request, response) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      requests.push({ method: request.method, url: request.url, authorization: request.headers.authorization,
        cookie: request.headers.cookie, body: Buffer.concat(chunks).toString('utf8') });
      response.setHeader('Content-Type', 'application/json');
      response.setHeader('Cache-Control', 'private, no-store');
      const send = (status, value) => { response.statusCode = status; response.end(JSON.stringify(value)); };
      Promise.resolve().then(() => handler(request, response, send)).catch(() => {
        if (!response.destroyed && !response.writableEnded) send(500, { message: 'private fixture diagnostic' });
      });
    });
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => { server.removeListener('error', reject); resolve(); });
  });
  try {
    await run({ requests, baseUrl: `http://127.0.0.1:${server.address().port}/api` });
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

function moduleFor(baseUrl, auth = session(), token = () => 'test.first.signature') {
  const client = new HttpClient({ baseUrl, isDevelopment: true, requestTimeoutMs: 1000,
    fetch: globalThis.fetch, getAccessToken: token });
  const repository = new ApiOrderHistoryRepository(client);
  const controller = createOrderHistoryController(auth, createOrderHistoryActions(repository));
  return { auth, repository, controller };
}

test('history real HTTP reads send only private Bearer GETs and publish safe immutable summaries and detail', async () => {
  await withApi((request, response, send) => {
    if (request.url === '/api/orders/me') return send(200, { ...page(), accessToken: 'private' });
    if (request.url === `/api/orders/me/${orderId}`) return send(200, { ...detail(), customerUserId: 'private',
      items: detail().items.map((item) => ({ ...item, internalNote: 'private' })) });
    send(404, { message: 'private not found' });
  }, async ({ baseUrl, requests }) => {
    const { controller } = moduleFor(baseUrl);
    try {
      controller.start(); await waitFor(() => controller.getSnapshot().status === 'ready');
      await controller.selectOrder(orderId);
      const state = controller.getSnapshot();
      assert.equal(state.orders[0].unitCount, 2); assert.equal(state.orders[0].subtotal, 259.98);
      assert.equal(state.detail.items[0].productName, 'Lavanda');
      assert.ok(Object.isFrozen(state.orders)); assert.ok(Object.isFrozen(state.detail.items));
      assert.equal(JSON.stringify(state).includes('private'), false);
      assert.deepEqual(requests.map((request) => request.url), ['/api/orders/me', `/api/orders/me/${orderId}`]);
      assert.ok(requests.every((request) => request.method === 'GET' && request.body === '' && request.cookie === undefined));
      assert.ok(requests.every((request) => request.authorization === 'Bearer test.first.signature'));
      assert.ok(requests.every((request) => !request.url.includes(accountA) && !request.url.includes('email=')));
    } finally { controller.stop(); }
  });
});

test('history real HTTP paginates twenty summaries using only an opaque cursor and deduplicates overlapping pages', async () => {
  const first = Array.from({ length: 20 }, (_, index) => summary({
    id: (100 + index).toString(16).padStart(24, '0'), reference: `PED-${100 + index}`,
    createdAt: new Date(Date.UTC(2026, 9, 20, 12, 0, 19 - index)).toISOString(),
  }));
  const next = summary({ id: otherId, reference: 'PED-OLDER', createdAt: '2026-10-19T12:00:00.000Z' });
  await withApi((request, response, send) => send(200,
    request.url === '/api/orders/me' ? page([...first].reverse(), 'opaque_A-09') : page([first[19], next])),
  async ({ baseUrl, requests }) => {
    const { controller } = moduleFor(baseUrl);
    try {
      controller.start(); await waitFor(() => controller.getSnapshot().status === 'ready');
      assert.equal(controller.getSnapshot().orders.length, 20);
      await controller.loadMore();
      const state = controller.getSnapshot();
      assert.equal(state.orders.length, 21); assert.equal(new Set(state.orders.map((order) => order.id)).size, 21);
      assert.deepEqual(state.orders.map((order) => order.id), [...first.map((order) => order.id), otherId]);
      assert.equal(state.nextCursor, null);
      await controller.loadMore();
      assert.deepEqual(requests.map((request) => request.url), ['/api/orders/me', '/api/orders/me?cursor=opaque_A-09']);
    } finally { controller.stop(); }
  });
});

test('history connection loss and HTTP 503 retain confirmed list and detail until an explicit refresh recovers both', async () => {
  let mode = 'ready';
  let status = 'pending_review';
  await withApi((request, response, send) => {
    if (mode === 'offline') { request.socket.destroy(); return; }
    if (mode === 'unavailable') return send(503, { message: 'private database diagnostic' });
    send(200, request.url === '/api/orders/me' ? page([summary({ status })]) : detail({ status }));
  }, async ({ baseUrl }) => {
    const { controller } = moduleFor(baseUrl);
    try {
      controller.start(); await waitFor(() => controller.getSnapshot().status === 'ready');
      await controller.selectOrder(orderId);
      const before = controller.getSnapshot();
      for (const failure of ['offline', 'unavailable']) {
        mode = failure; await controller.refresh();
        const state = controller.getSnapshot();
        assert.equal(state.status, 'ready'); assert.deepEqual(state.orders, before.orders);
        assert.deepEqual(state.detail, before.detail); assert.ok(state.error);
        assert.equal(state.error.includes('private'), false);
      }
      mode = 'ready'; status = 'confirmed';
      await controller.refresh();
      const recovered = controller.getSnapshot();
      assert.equal(recovered.error, null); assert.equal(recovered.orders[0].status, 'confirmed');
      assert.equal(recovered.detail.status, 'confirmed'); assert.equal(recovered.selectedOrderId, orderId);
    } finally { controller.stop(); }
  });
});

test('history failed continuation preserves its confirmed cursor and page, with exactly one request per explicit retry', async () => {
  let unavailable = true;
  await withApi((request, response, send) => {
    if (request.url === '/api/orders/me') return send(200, page([summary()], 'opaque_next'));
    if (unavailable) return send(503, { message: 'private continuation diagnostic' });
    send(200, page([summary({ id: otherId, reference: 'PED-OLDER', createdAt: '2026-10-19T12:00:00.000Z' })]));
  }, async ({ baseUrl, requests }) => {
    const { controller } = moduleFor(baseUrl);
    try {
      controller.start(); await waitFor(() => controller.getSnapshot().status === 'ready');
      await controller.loadMore();
      assert.equal(requests.length, 2); assert.equal(controller.getSnapshot().orders.length, 1);
      assert.equal(controller.getSnapshot().nextCursor, 'opaque_next');
      assert.ok(controller.getSnapshot().loadMoreError);
      unavailable = false; await controller.loadMore();
      assert.equal(requests.length, 3); assert.equal(controller.getSnapshot().orders.length, 2);
      assert.equal(controller.getSnapshot().loadMoreError, null);
      assert.equal(controller.getSnapshot().nextCursor, null);
    } finally { controller.stop(); }
  });
});

test('history missing or foreign detail returns a safe 404 without losing the list, and explicit detail retry recovers', async () => {
  let missing = true;
  await withApi((request, response, send) => {
    if (request.url === '/api/orders/me') return send(200, page());
    if (missing) return send(404, { message: 'private foreign owner detail' });
    send(200, detail());
  }, async ({ baseUrl, requests }) => {
    const { controller } = moduleFor(baseUrl);
    try {
      controller.start(); await waitFor(() => controller.getSnapshot().status === 'ready');
      await controller.selectOrder(orderId);
      const state = controller.getSnapshot();
      assert.equal(state.orders[0].id, orderId); assert.equal(state.detail, null);
      assert.equal(state.selectedOrderId, orderId); assert.ok(state.detailError);
      assert.equal(JSON.stringify(state).includes('private'), false);
      assert.equal(requests.length, 2);
      missing = false; await controller.retryDetail();
      assert.equal(controller.getSnapshot().detail.id, orderId);
      assert.equal(controller.getSnapshot().detailError, null); assert.equal(requests.length, 3);
    } finally { controller.stop(); }
  });
});

test('history HTTP 401 clears only the personal module and blocks more reads for that authorization identity', async () => {
  await withApi((request, response, send) => request.url === '/api/orders/me'
    ? send(200, page()) : send(401, { message: 'private token diagnostic' }),
  async ({ baseUrl, requests }) => {
    const { auth, controller } = moduleFor(baseUrl);
    const authorization = auth.getSnapshot();
    try {
      controller.start(); await waitFor(() => controller.getSnapshot().status === 'ready');
      await controller.selectOrder(orderId);
      const state = controller.getSnapshot();
      assert.equal(state.status, 'session-expired'); assert.equal(state.orders, null);
      assert.equal(state.detail, null); assert.equal(state.selectedOrderId, null);
      assert.equal(auth.getSnapshot(), authorization, 'the module does not mutate global authentication');
      await controller.refresh(); await controller.retryDetail(); await controller.loadMore();
      assert.equal(requests.length, 2); assert.equal(state.error.includes('private'), false);
    } finally { controller.stop(); }
  });
});

test('history malformed JSON and invalid money over real HTTP remain safe and never replace a confirmed response', async () => {
  let mode = 'json';
  await withApi((request, response, send) => {
    if (mode === 'json') { response.end('{"private diagnostic":'); return; }
    send(200, mode === 'invalid' ? page([summary({ subtotal: 259.981 })]) : page());
  }, async ({ baseUrl, requests }) => {
    const { controller } = moduleFor(baseUrl);
    try {
      controller.start(); await waitFor(() => controller.getSnapshot().status === 'error');
      assert.equal(controller.getSnapshot().orders, null);
      assert.equal(JSON.stringify(controller.getSnapshot()).includes('private'), false);
      mode = 'ready'; await controller.refresh();
      assert.equal(controller.getSnapshot().orders[0].subtotal, 259.98);
      mode = 'invalid'; await controller.refresh();
      assert.equal(controller.getSnapshot().status, 'ready');
      assert.equal(controller.getSnapshot().orders[0].subtotal, 259.98);
      assert.ok(controller.getSnapshot().error); assert.equal(requests.length, 3);
    } finally { controller.stop(); }
  });
});

test('history account changes abort old HTTP reads and never publish another account response', async () => {
  let firstResponse;
  let firstRequested = false;
  await withApi((request, response, send) => {
    if (request.headers.authorization === 'Bearer test.first.signature') {
      firstRequested = true; firstResponse = response; return;
    }
    assert.equal(request.headers.authorization, 'Bearer test.second.signature');
    send(200, page([summary({ id: otherId, reference: 'PED-SECOND' })]));
  }, async ({ baseUrl, requests }) => {
    const auth = session();
    let token = 'test.first.signature';
    const { controller } = moduleFor(baseUrl, auth, () => token);
    try {
      controller.start(); await waitFor(() => firstRequested);
      token = 'test.second.signature'; auth.publish(authenticated(accountB));
      assert.equal(controller.getSnapshot().orders, null);
      await waitFor(() => controller.getSnapshot().status === 'ready');
      if (!firstResponse.destroyed) firstResponse.end(JSON.stringify(page()));
      await pause(10);
      assert.deepEqual(controller.getSnapshot().orders.map((order) => order.id), [otherId]);
      auth.publish({ status: 'anonymous', user: null, message: null });
      assert.equal(controller.getSnapshot().orders, null); assert.equal(controller.getSnapshot().status, 'anonymous');
      assert.equal(requests.length, 2);
      assert.deepEqual(requests.map((request) => request.authorization), ['Bearer test.first.signature', 'Bearer test.second.signature']);
    } finally { controller.stop(); }
  });
});
