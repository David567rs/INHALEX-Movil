const assert = require('node:assert/strict');
const { Buffer } = require('node:buffer');
const http = require('node:http');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { CartError } = require('../src/features/cart/domain/errors/CartError.ts');
const { ApiCartRepository } = require('../src/features/cart/data/repositories/ApiCartRepository.ts');

const id = '507f1f77bcf86cd799439011';
const secondId = '507f1f77bcf86cd799439012';
const isCartError = (kind) => (error) => {
  assert.ok(error instanceof CartError);
  assert.equal(error.kind, kind);
  assert.ok(!error.message.includes('private'));
  assert.equal(error.cause, undefined);
  return true;
};
const listen = (server) => new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => { server.removeListener('error', reject); resolve(); });
});
async function close(server) {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
const apiUrl = (server) => `http://127.0.0.1:${server.address().port}/api`;

test('cart crosses real HTTP for confirmed writes, private Bearer account isolation and explicit recovery (simulated API/store)', async () => {
  const products = new Map([
    [id, { _id: id, name: 'Lavanda de prueba', description: 'Esencia floral', aromas: ['Lavanda'],
      price: 149, currency: 'MXN', image: '/products/lavanda.jpg', inStock: true,
      passwordHash: 'private hash', stockReserved: 9 }],
    [secondId, { _id: secondId, name: 'Eucalipto de prueba', description: 'Esencia fresca', aromas: ['Eucalipto'],
      price: 129, currency: 'MXN', image: '/products/eucalipto.jpg', inStock: true }],
  ]);
  const collections = new Map([['first', new Map()], ['second', new Map()]]);
  const requests = [];
  let readStatus = 200;
  let writeStatus = 200;
  let malformedRead = false;
  const responseCart = (account) => {
    const items = [...collections.get(account)].map(([productId, quantity]) => ({
      productId, quantity, subtotal: products.get(productId).price * quantity, product: products.get(productId),
    }));
    return { items, totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + item.subtotal, 0), currency: 'MXN' };
  };
  const server = http.createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json');
    const send = (status, value) => { response.statusCode = status; response.end(JSON.stringify(value)); };
    try {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const text = Buffer.concat(chunks).toString('utf8');
      const body = text ? JSON.parse(text) : undefined;
      const account = new Map([['Bearer test.first.signature', 'first'],
        ['Bearer test.second.signature', 'second']]).get(request.headers.authorization);
      requests.push({ method: request.method, path: request.url, body, account,
        cookie: request.headers.cookie, authorization: request.headers.authorization });
      if (!account) return send(401, { message: 'private auth diagnostic' });
      if (request.method === 'GET' && request.url === '/api/cart') {
        if (readStatus !== 200) return send(readStatus, { message: 'private read diagnostic' });
        const result = responseCart(account);
        return send(200, malformedRead ? { ...result, totalItems: result.totalItems + 1 } : result);
      }
      if (writeStatus !== 200) return send(writeStatus, { message: 'private write diagnostic' });
      const collection = collections.get(account);
      if (request.method === 'POST' && request.url === '/api/cart' && products.has(body?.productId)) {
        collection.set(body.productId, Math.min(25, (collection.get(body.productId) || 0) + body.quantity));
        return send(201, responseCart(account));
      }
      const productId = request.url?.slice('/api/cart/'.length);
      if (request.url?.startsWith('/api/cart/') && products.has(productId)) {
        if (request.method === 'PATCH') {
          if (!collection.has(productId)) return send(404, { message: 'private missing item diagnostic' });
          collection.set(productId, body.quantity);
          return send(200, responseCart(account));
        }
        if (request.method === 'DELETE') {
          collection.delete(productId);
          return send(200, responseCart(account));
        }
      }
      send(404, { message: 'private route diagnostic' });
    } catch {
      if (!response.destroyed) send(500, { message: 'private fixture diagnostic' });
    }
  });
  await listen(server);
  let token = 'test.first.signature';
  const repo = new ApiCartRepository(new HttpClient({ baseUrl: apiUrl(server), isDevelopment: true,
    getAccessToken: () => token }));
  try {
    assert.deepEqual(await repo.list(), { items: [], totalItems: 0, subtotal: 0, currency: 'MXN' });
    const added = await repo.add(id.toUpperCase(), 2);
    assert.equal(added.totalItems, 2);
    assert.equal(added.items[0].productId, id);
    assert.equal(added.items[0].product.price, 149);
    assert.equal(added.subtotal, 298);
    assert.ok(!JSON.stringify(added).includes('private'));
    assert.equal(Object.hasOwn(added.items[0].product, 'stockReserved'), false);
    const combined = await repo.add(secondId, 1);
    assert.deepEqual(combined.items.map((item) => item.productId), [id, secondId]);
    assert.equal(combined.totalItems, 3);
    assert.equal(combined.subtotal, 427);
    const updated = await repo.updateQuantity(id, 3);
    assert.equal(updated.items[0].quantity, 3);
    assert.equal(updated.subtotal, 576);

    writeStatus = 503;
    const beforeFailure = requests.length;
    await assert.rejects(repo.remove(id), isCartError('server'));
    assert.equal(requests.length, beforeFailure + 1, 'uncertain writes are not retried');
    assert.equal(collections.get('first').get(id), 3, 'failed write does not change simulated store');
    writeStatus = 200;
    const remaining = await repo.remove(secondId);
    assert.equal(remaining.totalItems, 3);
    assert.equal(remaining.subtotal, 447);

    readStatus = 503;
    await assert.rejects(repo.list(), isCartError('server'));
    readStatus = 200;
    assert.equal((await repo.list()).subtotal, 447, 'an explicit retry recovers the confirmed cart');
    malformedRead = true;
    await assert.rejects(repo.list(), isCartError('invalid-response'));
    malformedRead = false;

    token = 'test.second.signature';
    assert.deepEqual((await repo.list()).items, [], 'another account gets a separate server cart');
    await repo.add(secondId, 1);
    assert.equal(collections.get('second').size, 1);
    assert.equal(collections.get('first').get(id), 3);
    token = null;
    await assert.rejects(repo.list(), isCartError('unauthorized'));
    token = 'test.first.signature';
    readStatus = 401;
    await assert.rejects(repo.list(), isCartError('unauthorized'));
    readStatus = 200;
    assert.equal((await repo.list()).items[0].productId, id, 'server data survives a new token selection');
    const capped = await repo.add(id, 25);
    assert.equal(capped.items[0].quantity, 25, 'the complete response confirms the backend add cap');
    const cleared = await repo.remove(id);
    assert.deepEqual(cleared.items, []);
    assert.equal(cleared.totalItems, 0);
    assert.equal(cleared.subtotal, 0);

    const post = requests.find((request) => request.method === 'POST');
    const patch = requests.find((request) => request.method === 'PATCH');
    assert.deepEqual(post.body, { productId: id, quantity: 2 });
    assert.deepEqual(patch.body, { quantity: 3 });
    assert.ok(requests.every((request) => request.cookie === undefined));
    assert.ok(requests.every((request) => !JSON.stringify(request.body ?? {}).includes('userId')));
    assert.ok(requests.filter((request) => request.account).every((request) =>
      request.authorization === `Bearer test.${request.account}.signature`));
    assert.ok(requests.filter((request) => ['GET', 'DELETE'].includes(request.method))
      .every((request) => request.body === undefined));
  } finally {
    await close(server);
  }
});

test('cart cancellation interrupts real HTTP for each operation without retrying', async () => {
  for (const method of ['list', 'add', 'updateQuantity', 'remove']) {
    let requests = 0;
    let started;
    const ready = new Promise((resolve) => { started = resolve; });
    const server = http.createServer((request) => {
      requests++;
      request.resume();
      started();
      // Deliberately withhold a response; this server and its state exist only for this test.
    });
    await listen(server);
    const repo = new ApiCartRepository(new HttpClient({ baseUrl: apiUrl(server), isDevelopment: true,
      requestTimeoutMs: 1000, getAccessToken: () => 'test.first.signature' }));
    const controller = new AbortController();
    try {
      const pending = method === 'list' ? repo.list({ signal: controller.signal })
        : method === 'remove' ? repo.remove(id, { signal: controller.signal })
          : repo[method](id, 1, { signal: controller.signal });
      await ready;
      controller.abort();
      await assert.rejects(pending, isCartError('cancelled'));
      assert.equal(requests, 1);
    } finally {
      await close(server);
    }
  }
});
