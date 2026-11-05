const assert = require('node:assert/strict');
const { Buffer } = require('node:buffer');
const http = require('node:http');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiReviewsRepository } = require('../src/features/reviews/data/repositories/ApiReviewsRepository.ts');
const { createReviewsActions } = require('../src/features/reviews/domain/useCases/reviewsActions.ts');
const PRODUCT = '507f1f77bcf86cd799439011', ORDER = '507f1f77bcf86cd799439012', REVIEW = '507f1f77bcf86cd799439013';
const DATE = '2026-11-04T12:00:00.000Z';
const input = { productId: PRODUCT, orderId: ORDER, rating: 4, comment: 'Aroma agradable.' };
const product = { orderId: ORDER, orderReference: 'INX-001', productId: PRODUCT, productName: 'Lavanda', productSlug: 'lavanda', productImage: 'https://example.com/lavanda.png', presentation: '10 ml', purchasedAt: DATE };
const review = { id: REVIEW, ...input, userName: 'Demo', productName: product.productName, productSlug: product.productSlug, productImage: product.productImage, orderReference: product.orderReference, status: 'published', createdAt: DATE };

async function apiFor(t, handler) {
  const requests = [];
  const server = http.createServer((request, response) => {
    const chunks = []; request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      const snapshot = { method: request.method, url: request.url, authorization: request.headers.authorization, cookie: request.headers.cookie, body: Buffer.concat(chunks).toString('utf8') };
      requests.push(snapshot); response.setHeader('Content-Type', 'application/json');
      const send = (status, value) => { response.statusCode = status; response.end(JSON.stringify(value)); };
      handler(snapshot, response, send);
    });
  });
  t.after(async () => { server.closeAllConnections(); if (server.listening) await new Promise((resolve) => server.close(resolve)); });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { requests, baseUrl: `http://127.0.0.1:${server.address().port}/api` };
}
function actionsFor(baseUrl, token = () => 'fixture.first.signature') {
  return createReviewsActions(new ApiReviewsRepository(new HttpClient({ baseUrl, isDevelopment: true, getAccessToken: token, requestTimeoutMs: 1000 })));
}

test('real loopback HTTP lists eligible products, publishes once and reconciles submitted state', async (t) => {
  let stored = false;
  const api = await apiFor(t, (request, response, send) => {
    if (request.authorization !== 'Bearer fixture.first.signature') return send(401, {});
    if (request.method === 'GET' && request.url === '/api/reviews/me/eligible') return send(200, stored ? { pending: [], completed: [{ ...product, review }] } : { pending: [product], completed: [] });
    if (request.method === 'POST' && request.url === '/api/reviews') {
      if (stored) return send(409, { message: 'private duplicate diagnostic' });
      assert.deepEqual(JSON.parse(request.body), input); stored = true; return send(201, review);
    }
    send(404, {});
  });
  const actions = actionsFor(api.baseUrl);
  assert.equal((await actions.list()).pending.length, 1); assert.equal(stored, false);
  assert.equal((await actions.publish({ ...input, userId: 'private' })).id, REVIEW);
  assert.equal((await actions.list()).completed[0].review.status, 'published');
  await assert.rejects(actions.publish(input), (error) => error.kind === 'conflict' && !error.message.includes('private'));
  assert.deepEqual(api.requests.map((request) => request.method), ['GET', 'POST', 'GET', 'POST']);
  for (const request of api.requests) { assert.equal(request.cookie, undefined); assert.equal(request.url.includes('userId'), false); }
});

test('transport obtains current private Bearer each request without retaining another account identity', async (t) => {
  let credential = 'fixture.first.signature';
  const api = await apiFor(t, (request, response, send) => request.authorization === 'Bearer fixture.first.signature'
    ? send(200, { pending: [product], completed: [] }) : send(200, { pending: [], completed: [] }));
  const actions = actionsFor(api.baseUrl, () => credential);
  assert.equal((await actions.list()).pending.length, 1); credential = 'fixture.second.signature';
  assert.equal((await actions.list()).pending.length, 0);
  assert.deepEqual(api.requests.map((request) => request.authorization), ['Bearer fixture.first.signature', 'Bearer fixture.second.signature']);
});

test('cancelled in-flight read ignores delayed HTTP data and makes no mutation', async (t) => {
  let arrive, finish; const arrived = new Promise((resolve) => { arrive = resolve; });
  const api = await apiFor(t, (request, response, send) => { finish = () => send(200, { pending: [product], completed: [] }); arrive(); });
  const abort = new AbortController(); const pending = actionsFor(api.baseUrl).list({ signal: abort.signal });
  await arrived; const rejected = assert.rejects(pending, (error) => error.kind === 'cancelled'); abort.abort(); await rejected; finish();
  assert.deepEqual(api.requests.map((request) => request.method), ['GET']);
});

test('server rejection and unavailable connection retain safe distinct error kinds over HTTP', async (t) => {
  let status = 401;
  const api = await apiFor(t, (request, response, send) => send(status, { message: 'private database detail' }));
  for (const [code, kind] of [[401, 'unauthorized'], [403, 'forbidden'], [409, 'conflict'], [429, 'rate-limit'], [503, 'server']]) {
    status = code; await assert.rejects(actionsFor(api.baseUrl).publish(input), (error) => error.kind === kind && !error.message.includes('private'));
  }
  assert.equal(api.requests.length, 5);
});
