const assert = require('node:assert/strict');
const http = require('node:http');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiFavoritesRepository } = require('../src/features/favorites/data/repositories/ApiFavoritesRepository.ts');
const { createFavoritesActions } = require('../src/features/favorites/domain/useCases/createFavoritesActions.ts');
const { createFavoritesController } = require('../src/features/favorites/presentation/state/createFavoritesController.ts');
const { createAuthSession } = require('../src/features/auth/domain/session/createAuthSession.ts');

function until(controller, predicate) {
  if (predicate(controller.getSnapshot())) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { unsubscribe(); reject(new Error('Favorites state did not settle')); }, 3000);
    const unsubscribe = controller.subscribe(() => {
      if (predicate(controller.getSnapshot())) { clearTimeout(timer); unsubscribe(); resolve(); }
    });
  });
}

test('Favorites crosses real HTTP with private Bearer, confirmed writes, account isolation and recovery (simulated API/store)', async () => {
  const id = '507f1f77bcf86cd799439011';
  const product = { _id: id, name: 'Lavanda de prueba', description: 'Esencia de prueba', aromas: ['Lavanda'],
    price: 149, currency: 'MXN', image: '/products/lavanda.jpg', inStock: true, passwordHash: 'must-never-be-public' };
  const collections = new Map([['first', []], ['second', []]]);
  const requests = [];
  let readStatus = 200;
  let writeStatus = 200;
  const server = http.createServer((request, response) => {
    const account = String(request.headers.authorization || '').replace('Bearer test.', '').replace('.signature', '');
    requests.push({ method: request.method, path: request.url, account });
    response.setHeader('Content-Type', 'application/json');
    const send = (status, value) => { response.statusCode = status; response.end(JSON.stringify(value)); };
    if (!collections.has(account)) return send(401, { message: 'Unauthorized' });
    if (request.method === 'GET' && request.url === '/api/favorites') {
      return readStatus === 200 ? send(200, collections.get(account)) : send(readStatus, { message: 'internal details never shown' });
    }
    if (request.url === `/api/favorites/${id}`) {
      if (writeStatus !== 200) return send(writeStatus, { message: 'internal write details' });
      if (request.method === 'PUT') {
        collections.set(account, [product]);
        return send(200, { productId: id });
      }
      if (request.method === 'DELETE') {
        collections.set(account, []);
        return send(200, { productId: id });
      }
    }
    send(404, { message: 'Not found' });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const runtime = createAuthSession(async (form) => ({
    accessToken: `test.${form.email}.signature`,
    user: { id: form.email, firstName: 'Prueba', lastName: 'HTTP', email: form.email, phone: '5512345678' },
  }), { get: async () => null, set: async () => {}, clear: async () => {} }, async () => { throw new Error('No restore token'); });
  const client = new HttpClient({ baseUrl: `http://127.0.0.1:${server.address().port}/api`, isDevelopment: true,
    getAccessToken: runtime.getAccessToken });
  const actions = createFavoritesActions(new ApiFavoritesRepository(client));
  const favorites = createFavoritesController(runtime.session, actions);
  try {
    favorites.start();
    await runtime.session.restore();
    assert.equal(requests.length, 0, 'anonymous users make no Favorites request');
    await runtime.session.signIn({ email: 'first', password: 'test-only' });
    await until(favorites, (s) => s.loaded);
    assert.deepEqual(favorites.getSnapshot().products, []);
    const mappedProduct = { id, name: product.name, description: product.description, aromas: product.aromas,
      price: 149, currency: 'MXN', image: product.image, inStock: true, originalPrice: null };
    await favorites.add(mappedProduct);
    assert.equal(collections.get('first').length, 1);
    assert.equal(favorites.getSnapshot().products[0].id, id);
    await favorites.refresh();
    assert.equal(JSON.stringify(favorites.getSnapshot()).includes('must-never-be-public'), false);
    writeStatus = 503;
    await favorites.remove(id);
    assert.equal(favorites.getSnapshot().products.length, 1, 'failed removal preserves confirmed row');
    assert.ok(favorites.getSnapshot().mutationError);
    writeStatus = 200;
    await favorites.remove(id);
    assert.deepEqual(collections.get('first'), []);
    await favorites.add(mappedProduct);
    readStatus = 503;
    await favorites.refresh();
    assert.equal(favorites.getSnapshot().products.length, 1, 'read failure preserves last collection');
    readStatus = 200;
    await favorites.refresh();
    assert.equal(favorites.getSnapshot().error, null);
    await runtime.session.signOut();
    assert.deepEqual(favorites.getSnapshot().products, [], 'logout clears personal state synchronously');
    await runtime.session.signIn({ email: 'second', password: 'test-only' });
    await until(favorites, (s) => s.loaded);
    assert.deepEqual(favorites.getSnapshot().products, [], 'another account does not inherit favorites');
    readStatus = 401;
    await favorites.refresh();
    assert.equal(favorites.getSnapshot().status, 'session-expired');
    assert.deepEqual(favorites.getSnapshot().products, []);
    readStatus = 200;
    await runtime.session.signOut();
    await runtime.session.signIn({ email: 'first', password: 'test-only' });
    await until(favorites, (s) => s.loaded);
    assert.equal(favorites.getSnapshot().products[0].id, id, 'server collection survives new app session');
    assert.ok(requests.every((r) => ['first', 'second'].includes(r.account)));
    assert.equal('accessToken' in favorites.getSnapshot(), false);
  } finally {
    favorites.stop();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
