const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiError } = require('../src/core/network/ApiError.ts');
const { ApiNoticesRepository } = require('../src/features/notices/data/repositories/ApiNoticesRepository.ts');
const { NoticesError } = require('../src/features/notices/domain/errors/NoticesError.ts');

const ID = '507f1f77bcf86cd799439011', OTHER = '507f1f77bcf86cd799439012', THIRD = '507f1f77bcf86cd799439013';
const CREATED = '2026-10-20T12:00:00.000Z', READ = '2026-10-20T13:00:00.000Z';
const notice = (changes = {}) => ({ id: ID, title: 'Pedido confirmado', message: 'Puedes consultar el estado de tu pedido.', type: 'order', severity: 'success',
  createdAt: CREATED, readAt: null, ...changes });
const inbox = (changes = {}) => ({ items: [notice()], unread: 1, ...changes });
const response = (payload, status = 200) => new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
const repository = (fetch) => new ApiNoticesRepository(new HttpClient({ baseUrl: 'https://api.example/api', fetch, getAccessToken: () => 'private.jwt.token' }));
const errorKind = (kind) => (error) => {
  assert.ok(error instanceof NoticesError); assert.equal(error.kind, kind);
  assert.equal(error.cause, undefined); assert.doesNotMatch(error.message, /private|token|stack/); return true;
};

test('notice list sends only authenticated GET and strips owner identity and arbitrary metadata', async () => {
  let received;
  const result = await repository(async (url, options) => { received = { url, options };
    return response(inbox({ userEmail: 'private', items: [notice({ userId: 'private', userEmail: 'private', metadata: { token: 'private' } })] }));
  }).list({ accountId: 'private', limit: 40, cursor: 'private' });
  assert.equal(received.url, 'https://api.example/api/notifications/me'); assert.equal(received.options.method, 'GET');
  assert.equal(received.options.headers.Authorization, 'Bearer private.jwt.token'); assert.equal(received.options.body, undefined);
  assert.deepEqual(result, { items: [notice()], unread: 1 }); assert.equal(JSON.stringify(result).includes('private'), false);
  assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result.items)); assert.ok(Object.isFrozen(result.items[0]));
});

test('notice mapper accepts the five existing types and three severities without inventing account or delivery types', async () => {
  for (const type of ['order', 'review', 'promotion', 'system', 'report']) {
    for (const severity of ['info', 'success', 'warning']) {
      const result = await repository(async () => response(inbox({ items: [notice({ type, severity })] }))).list();
      assert.equal(result.items[0].type, type); assert.equal(result.items[0].severity, severity);
    }
  }
  for (const change of [{ type: 'account' }, { type: 'delivery' }, { severity: 'danger' }, { severity: null }]) {
    await assert.rejects(repository(async () => response(inbox({ items: [notice(change)] }))).list(), errorKind('invalid-response'));
  }
});

test('notice text bounds and controls are validated while legitimate message line breaks remain readable', async () => {
  const result = await repository(async () => response(inbox({ items: [notice({ title: 'A'.repeat(120), message: `${'B'.repeat(249)}\n${'C'.repeat(250)}` })] }))).list();
  assert.equal(result.items[0].message.length, 500);
  for (const change of [{ title: '' }, { title: ' ' }, { title: 'A'.repeat(121) }, { title: 'priv\0ate' }, { title: 'Hola\nMundo' },
    { message: '' }, { message: 'B'.repeat(501) }, { message: ' private ' }, { message: 'priv\u0085ate' }]) {
    await assert.rejects(repository(async () => response(inbox({ items: [notice(change)] }))).list(), errorKind('invalid-response'));
  }
});

test('missing dates become null and available canonical dates are preserved without historical inference', async () => {
  const result = await repository(async () => response(inbox({ items: [notice({ createdAt: undefined, readAt: undefined })] }))).list();
  assert.equal(result.items[0].createdAt, null); assert.equal(result.items[0].readAt, null);
  const read = await repository(async () => response(inbox({ items: [notice({ readAt: READ })] }))).list();
  assert.equal(read.items[0].createdAt, CREATED); assert.equal(read.items[0].readAt, READ);
  for (const value of ['', 0, false, '2026-02-30T12:00:00.000Z', '2026-10-20', '2026-10-20T12:00:00Z', `${CREATED}\n`]) {
    for (const field of ['createdAt', 'readAt']) await assert.rejects(repository(async () => response(inbox({ items: [notice({ [field]: value })] }))).list(), errorKind('invalid-response'));
  }
});

test('latest notices sort by date descending, missing dates last and descending IDs for equal dates', async () => {
  const rows = [notice({ id: ID, createdAt: null }), notice({ id: OTHER }), notice({ id: THIRD })];
  const result = await repository(async () => response(inbox({ items: rows }))).list();
  assert.deepEqual(result.items.map((item) => item.id), [THIRD, OTHER, ID]); assert.equal(rows[0].id, ID);
});

test('global unread remains independent from the latest twelve rows and their non-atomic read flags', async () => {
  for (const data of [inbox({ unread: 40 }), inbox({ unread: 0 }), inbox({ items: [], unread: 19 }), inbox({ items: [notice({ readAt: READ })], unread: 8 })]) {
    const result = await repository(async () => response(data)).list(); assert.equal(result.unread, data.unread);
  }
});

test('inbox mapper rejects oversized lists, duplicate normalized IDs and malformed global counts', async () => {
  for (const payload of [null, [], {}, inbox({ items: null }), inbox({ items: [null] }), inbox({ items: Array(13).fill(notice()) }),
    inbox({ items: [notice(), notice({ id: ID.toUpperCase() })] }), inbox({ unread: -1 }), inbox({ unread: 1.5 }), inbox({ unread: '1' }), inbox({ unread: null })]) {
    await assert.rejects(repository(async () => response(payload)).list(), errorKind('invalid-response'));
  }
  const items = Array.from({ length: 12 }, (_, index) => notice({ id: index.toString(16).padStart(24, '0') }));
  assert.equal((await repository(async () => response(inbox({ items }))).list()).items.length, 12);
});

test('mark-read sends a bodyless authenticated PATCH for exactly the selected normalized ID', async () => {
  let received;
  const result = await repository(async (url, options) => { received = { url, options }; return response(notice({ readAt: READ, metadata: { token: 'private' } })); })
    .markRead(ID.toUpperCase(), { body: { userEmail: 'private' } });
  assert.equal(received.url, `https://api.example/api/notifications/me/${ID}/read`); assert.equal(received.options.method, 'PATCH');
  assert.equal(received.options.body, undefined); assert.equal(received.options.headers['Content-Type'], undefined);
  assert.equal(received.options.headers.Authorization, 'Bearer private.jwt.token'); assert.equal(received.options.headers['Idempotency-Key'], undefined);
  assert.deepEqual(result, notice({ readAt: READ })); assert.ok(Object.isFrozen(result));
});

test('mark-read confirms both matching identity and a non-null server read timestamp', async () => {
  for (const change of [{ id: OTHER, readAt: READ }, { readAt: null }, { readAt: undefined }, { readAt: 'invalid' }]) {
    await assert.rejects(repository(async () => response(notice(change))).markRead(ID), errorKind('invalid-response'));
  }
  const result = await repository(async () => response(notice({ createdAt: undefined, readAt: READ }))).markRead(ID);
  assert.equal(result.createdAt, null); assert.equal(result.readAt, READ);
});

test('invalid mutation IDs never reach HTTP or turn into a read-all route', async () => {
  let calls = 0; const repo = repository(async () => { calls++; return response(notice({ readAt: READ })); });
  for (const id of ['', null, 'read-all', '../read-all', `${ID}\n`, `${ID}?user=private`, 'g'.repeat(24)]) await assert.rejects(repo.markRead(id), errorKind('invalid-request'));
  assert.equal(calls, 0);
});

test('HTTP statuses use notice-specific safe errors and backend 400 marks a missing or foreign notice', async () => {
  for (const [status, expected] of [[401, 'unauthorized'], [403, 'forbidden'], [404, 'not-found'], [422, 'invalid-request'], [429, 'rate-limit'], [500, 'server'], [503, 'server'], [409, 'unknown']]) {
    for (const operation of [(repo) => repo.list(), (repo) => repo.markRead(ID)]) {
      await assert.rejects(operation(repository(async () => response({ message: 'private token stack' }, status))), errorKind(expected));
    }
  }
  await assert.rejects(repository(async () => response({ message: 'Notification not found' }, 400)).markRead(ID), errorKind('not-found'));
  await assert.rejects(repository(async () => response({ message: 'private' }, 400)).list(), errorKind('invalid-request'));
});

test('transport failures remain domain errors without retaining diagnostic causes', async () => {
  for (const [kind, expected] of [['network', 'network'], ['timeout', 'timeout'], ['invalid-request', 'configuration'], ['invalid-response', 'invalid-response'], ['cancelled', 'cancelled']]) {
    await assert.rejects(new ApiNoticesRepository({ request: async () => { throw new ApiError('private token stack', kind); } }).list(), errorKind(expected));
  }
  await assert.rejects(new ApiNoticesRepository({ request: async () => { throw new Error('private token stack'); } }).markRead(ID), errorKind('unknown'));
  await assert.rejects(repository(async () => new Response('private', { headers: { 'content-type': 'application/json' } })).list(), errorKind('invalid-response'));
});

test('already aborted reads and writes never reach transport', async () => {
  const abort = new AbortController(); abort.abort(); let calls = 0;
  const repo = repository(async () => { calls++; return response(inbox()); });
  await assert.rejects(repo.list({ signal: abort.signal }), errorKind('cancelled'));
  await assert.rejects(repo.markRead(ID, { signal: abort.signal }), errorKind('cancelled')); assert.equal(calls, 0);
});

test('a late result or rejection after cancellation cannot confirm an unread or read notice', async () => {
  for (const marking of [false, true]) {
    for (const rejecting of [false, true]) {
      const abort = new AbortController();
      const repo = new ApiNoticesRepository({ request: async () => { abort.abort(); if (rejecting) throw new ApiError('private', 'http', 401);
        return marking ? notice({ readAt: READ }) : inbox(); } });
      await assert.rejects(marking ? repo.markRead(ID, { signal: abort.signal }) : repo.list({ signal: abort.signal }), errorKind('cancelled'));
    }
  }
});
