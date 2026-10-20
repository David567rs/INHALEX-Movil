const assert = require('node:assert/strict');
const { Buffer } = require('node:buffer');
const http = require('node:http');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiNoticesRepository } = require('../src/features/notices/data/repositories/ApiNoticesRepository.ts');
const { createNoticesActions } = require('../src/features/notices/domain/useCases/noticesActions.ts');
const { NoticesError } = require('../src/features/notices/domain/errors/NoticesError.ts');

const ID = '507f1f77bcf86cd799439011', OTHER = '507f1f77bcf86cd799439012';
const CREATED = '2026-10-20T12:00:00.000Z', READ = '2026-10-20T13:00:00.000Z';
const notice = (changes = {}) => ({ id: ID, title: 'Pedido confirmado', message: 'Consulta el estado de tu pedido.', type: 'order', severity: 'success',
  createdAt: CREATED, readAt: null, ...changes });
const inbox = (changes = {}) => ({ items: [notice()], unread: 1, ...changes });
const errorKind = (kind) => (error) => {
  assert.ok(error instanceof NoticesError); assert.equal(error.kind, kind);
  assert.equal(error.cause, undefined); assert.doesNotMatch(error.message, /private|token|stack/); return true;
};

async function apiFor(t, handler) {
  const requests = [];
  const server = http.createServer((request, response) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      requests.push({ method: request.method, url: request.url, authorization: request.headers.authorization, cookie: request.headers.cookie,
        idempotencyKey: request.headers['idempotency-key'], body: Buffer.concat(chunks).toString('utf8') });
      response.setHeader('Content-Type', 'application/json');
      const send = (status, value) => { response.statusCode = status; response.end(JSON.stringify(value)); };
      Promise.resolve().then(() => handler(request, response, send)).catch(() => {
        if (!response.destroyed && !response.writableEnded) send(500, { message: 'private fixture diagnostic' });
      });
    });
  });
  t.after(async () => { server.closeAllConnections(); if (server.listening) await new Promise((resolve) => server.close(resolve)); });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', () => {
    server.removeListener('error', reject); resolve();
  }); });
  return { requests, baseUrl: `http://127.0.0.1:${server.address().port}/api` };
}
function actionsFor(baseUrl, token = () => 'test.first.signature') {
  return createNoticesActions(new ApiNoticesRepository(new HttpClient({ baseUrl, isDevelopment: true, requestTimeoutMs: 1000,
    fetch: globalThis.fetch, getAccessToken: token })));
}

test('notices real loopback HTTP exposes a safe latest inbox with private Bearer and no caller identity query', async (t) => {
  const api = await apiFor(t, (request, response, send) => {
    if (request.headers.authorization !== 'Bearer test.first.signature') return send(401, { message: 'private auth' });
    return send(200, inbox({ unread: 14, items: [notice({ userEmail: 'private', metadata: { orderId: 'private' } }),
      notice({ id: OTHER, createdAt: null, readAt: READ, userId: 'private' })] }));
  });
  const result = await actionsFor(api.baseUrl).list({ userId: 'private', email: 'private', limit: 40 });
  assert.equal(result.items.length, 2); assert.equal(result.unread, 14); assert.equal(result.items[1].createdAt, null);
  assert.equal(JSON.stringify(result).includes('private'), false); assert.ok(Object.isFrozen(result.items[0]));
  assert.deepEqual(api.requests.map((request) => [request.method, request.url, request.cookie, request.body]), [['GET', '/api/notifications/me', undefined, '']]);
});

test('notice read marking crosses HTTP only after its explicit action and GET reconciles the global counter', async (t) => {
  let readAt = null, patches = 0;
  const api = await apiFor(t, (request, response, send) => {
    if (request.method === 'GET' && request.url === '/api/notifications/me') return send(200, inbox({ items: [notice({ readAt })], unread: readAt ? 3 : 4 }));
    if (request.method === 'PATCH' && request.url === `/api/notifications/me/${ID}/read`) { patches++; readAt = READ; return send(200, notice({ readAt })); }
    return send(404, {});
  });
  const actions = actionsFor(api.baseUrl);
  assert.equal((await actions.list()).items[0].readAt, null); assert.equal(patches, 0);
  assert.equal((await actions.markRead(ID)).readAt, READ); const refreshed = await actions.list();
  assert.equal(refreshed.unread, 3); assert.equal(refreshed.items[0].readAt, READ); assert.equal(patches, 1);
  assert.deepEqual(api.requests.map((request) => request.method), ['GET', 'PATCH', 'GET']);
  for (const request of api.requests) {
    assert.equal(request.authorization, 'Bearer test.first.signature'); assert.equal(request.body, ''); assert.equal(request.idempotencyKey, undefined);
  }
});

test('a missing or foreign notice uses backend 400 without exposing its diagnostic or changing the inbox', async (t) => {
  const api = await apiFor(t, (request, response, send) => request.method === 'PATCH'
    ? send(400, { message: 'Notification not found: private owner' }) : send(200, inbox()));
  const actions = actionsFor(api.baseUrl); await assert.rejects(actions.markRead(OTHER), errorKind('not-found'));
  assert.equal((await actions.list()).items[0].readAt, null);
});

test('real connection interruption and HTTP 503 recover only through explicit GET retries', async (t) => {
  let mode = 'network';
  const api = await apiFor(t, (request, response, send) => {
    if (mode === 'network') { response.destroy(); return; }
    if (mode === 'server') return send(503, { message: 'private stack' });
    return send(200, inbox());
  });
  const actions = actionsFor(api.baseUrl);
  await assert.rejects(actions.list(), errorKind('network')); mode = 'server';
  await assert.rejects(actions.list(), errorKind('server')); mode = 'ready';
  assert.equal((await actions.list()).items[0].id, ID); assert.equal(api.requests.length, 3);
});

test('a committed read with a lost PATCH response is reconciled by GET without replaying the mutation', async (t) => {
  let readAt = null, patches = 0;
  const api = await apiFor(t, (request, response, send) => {
    if (request.method === 'PATCH') { patches++; readAt = READ; response.destroy(); return; }
    return send(200, inbox({ items: [notice({ readAt })], unread: readAt ? 0 : 1 }));
  });
  const actions = actionsFor(api.baseUrl);
  await assert.rejects(actions.markRead(ID), errorKind('network'));
  const confirmed = await actions.list(); assert.equal(confirmed.items[0].readAt, READ);
  assert.equal(confirmed.unread, 0); assert.equal(patches, 1); assert.deepEqual(api.requests.map((request) => request.method), ['PATCH', 'GET']);
});

test('real HTTP authorization errors are notice-domain failures with no diagnostic body leakage', async (t) => {
  let status = 401;
  const api = await apiFor(t, (request, response, send) => send(status, { message: 'private token stack' }));
  const actions = actionsFor(api.baseUrl);
  await assert.rejects(actions.list(), errorKind('unauthorized')); status = 403;
  await assert.rejects(actions.markRead(ID), errorKind('forbidden'));
});

test('malformed JSON, incoherent PATCH confirmation and invalid inbox counts fail safely over real HTTP', async (t) => {
  let mode = 'json';
  const api = await apiFor(t, (request, response, send) => {
    if (mode === 'json') { response.end('private'); return; }
    if (mode === 'patch') return send(200, notice({ id: OTHER, readAt: READ }));
    return send(200, inbox({ unread: -1 }));
  });
  const actions = actionsFor(api.baseUrl); await assert.rejects(actions.list(), errorKind('invalid-response'));
  mode = 'patch'; await assert.rejects(actions.markRead(ID), errorKind('invalid-response'));
  mode = 'counter'; await assert.rejects(actions.list(), errorKind('invalid-response'));
});

test('cancelling an in-flight loopback read ignores the delayed response and sends no PATCH', async (t) => {
  let requestArrived; const arrived = new Promise((resolve) => { requestArrived = resolve; }); let finish;
  const api = await apiFor(t, (request, response, send) => { finish = () => send(200, inbox()); requestArrived(); });
  const abort = new AbortController(); const pending = actionsFor(api.baseUrl).list({ signal: abort.signal });
  await arrived; const rejected = assert.rejects(pending, errorKind('cancelled')); abort.abort(); await rejected; finish();
  assert.deepEqual(api.requests.map((request) => request.method), ['GET']);
});
