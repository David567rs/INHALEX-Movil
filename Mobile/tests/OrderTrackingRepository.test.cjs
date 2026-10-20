const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiError } = require('../src/core/network/ApiError.ts');
const { ApiOrderTrackingRepository } = require('../src/features/orderTracking/data/repositories/ApiOrderTrackingRepository.ts');
const { OrderTrackingError } = require('../src/features/orderTracking/domain/errors/OrderTrackingError.ts');

const ID = '507f1f77bcf86cd799439011', OTHER = '507f1f77bcf86cd799439012', PRODUCT = '507f1f77bcf86cd799439013';
const CREATED = '2026-10-20T12:00:00.000Z', CONFIRMED = '2026-10-20T13:00:00.000Z', ENDED = '2026-10-21T13:00:00.000Z';
const summary = (overrides = {}) => ({ id: ID, reference: 'PED-20261020-ABC123', status: 'pending_review', currency: 'MXN', totalItems: 2,
  subtotal: 259.98, createdAt: CREATED, ...overrides });
const tracking = (overrides = {}) => ({ ...summary(), confirmedAt: null, cancelledAt: null, completedAt: null, ...overrides });
const item = (overrides = {}) => ({ productId: PRODUCT, productName: 'Lavanda', presentation: '10 ml', image: null,
  quantity: 2, unitPrice: 129.99, subtotal: 259.98, currency: 'MXN', ...overrides });
const address = (overrides = {}) => ({ label: 'Casa', recipientName: 'Cliente de prueba', phone: '5500000000', street: 'Calle Uno', exteriorNumber: '12',
  interiorNumber: '', neighborhood: 'Centro', municipality: 'Ciudad', state: 'Estado', postalCode: '12345', references: '', ...overrides });
const detail = (overrides = {}) => ({ ...summary(), items: [item()], shippingAddress: address(), ...overrides });
const response = (payload, status = 200) => new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
const repository = (fetch) => new ApiOrderTrackingRepository(new HttpClient({ baseUrl: 'https://api.example/api', fetch, getAccessToken: () => 'private.jwt.token' }));
const pair = (events = tracking(), receipt = detail()) => repository(async (url) => response(url.endsWith('/tracking') ? events : receipt));
const errorKind = (kind) => (error) => {
  assert.ok(error instanceof OrderTrackingError); assert.equal(error.kind, kind);
  assert.equal(error.cause, undefined); assert.doesNotMatch(error.message, /private|token|stack/); return true;
};

test('tracking reads historical detail then authoritative tracking using only private Bearer GETs', async () => {
  const calls = [];
  const result = await repository(async (url, options) => {
    calls.push({ url, options }); return response(url.endsWith('/tracking') ? tracking({ status: 'confirmed', confirmedAt: CONFIRMED }) : detail());
  }).get(ID.toUpperCase(), { accountId: 'other', email: 'private' });
  assert.deepEqual(calls.map((call) => call.url), [`https://api.example/api/orders/me/${ID}`, `https://api.example/api/orders/me/${ID}/tracking`]);
  for (const { options } of calls) {
    assert.equal(options.method, 'GET'); assert.equal(options.headers.Authorization, 'Bearer private.jwt.token');
    assert.equal(options.body, undefined); assert.equal(options.headers['Idempotency-Key'], undefined);
  }
  assert.equal(result.status, 'confirmed'); assert.equal(result.confirmedAt, CONFIRMED);
  assert.equal(result.unitCount, 2); assert.equal(result.subtotal, 259.98); assert.equal(result.items[0].productName, 'Lavanda');
});

test('tracking status wins when an earlier detail read reports another valid status', async () => {
  for (const status of ['pending_review', 'confirmed', 'completed', 'cancelled']) {
    const result = await pair(tracking({ status }), detail({ status: status === 'pending_review' ? 'confirmed' : 'pending_review' })).get(ID);
    assert.equal(result.status, status); assert.equal(result.confirmedAt, null); assert.equal(result.cancelledAt, null); assert.equal(result.completedAt, null);
  }
});

test('tracking preserves available event timestamps, including cancellation before confirmation', async () => {
  const confirmed = await pair(tracking({ status: 'confirmed', confirmedAt: CONFIRMED })).get(ID);
  assert.equal(confirmed.confirmedAt, CONFIRMED); assert.equal(confirmed.completedAt, null);
  const complete = await pair(tracking({ status: 'completed', confirmedAt: CONFIRMED, completedAt: ENDED })).get(ID);
  assert.equal(complete.confirmedAt, CONFIRMED); assert.equal(complete.completedAt, ENDED);
  const cancelled = await pair(tracking({ status: 'cancelled', cancelledAt: ENDED })).get(ID);
  assert.equal(cancelled.confirmedAt, null); assert.equal(cancelled.cancelledAt, ENDED);
  const cancelledAfterConfirmation = await pair(tracking({ status: 'cancelled', confirmedAt: CONFIRMED, cancelledAt: ENDED })).get(ID);
  assert.equal(cancelledAfterConfirmation.confirmedAt, CONFIRMED);
});

test('tracking rejects missing or noncanonical event dates without replacing them with the creation date', async () => {
  for (const confirmedAt of [undefined, 0, false, [], '', '2026-02-30T13:00:00.000Z', '2026-10-20T13:00:00Z',
    '2026-10-20T13:00:00.000+00:00', '2026-10-20', `${CONFIRMED}\n`]) {
    await assert.rejects(pair(tracking({ status: 'confirmed', confirmedAt })).get(ID), errorKind('invalid-response'));
  }
  for (const field of ['confirmedAt', 'cancelledAt', 'completedAt']) {
    await assert.rejects(pair(tracking({ [field]: undefined })).get(ID), errorKind('invalid-response'));
  }
});

test('tracking does not reinterpret server status or manufacture chronology from available historical dates', async () => {
  const historical = { status: 'completed', confirmedAt: ENDED, cancelledAt: null, completedAt: CONFIRMED };
  const result = await pair(tracking(historical)).get(ID);
  assert.equal(result.status, 'completed'); assert.equal(result.confirmedAt, ENDED); assert.equal(result.completedAt, CONFIRMED);
  const withoutInferredConfirmation = await pair(tracking({ status: 'cancelled', cancelledAt: '2026-10-19T13:00:00.000Z' })).get(ID);
  assert.equal(withoutInferredConfirmation.confirmedAt, null);
  assert.equal(withoutInferredConfirmation.cancelledAt, '2026-10-19T13:00:00.000Z');
});

test('paired reads must identify the same order and immutable summary values before anything is published', async () => {
  const changes = [{ id: OTHER }, { reference: 'PED-DIFFERENT' }, { currency: 'USD' }, { createdAt: CONFIRMED },
    { subtotal: 300 }, { totalItems: 3 }];
  for (const change of changes) await assert.rejects(pair(tracking(change)).get(ID), errorKind('invalid-response'));
  await assert.rejects(pair(tracking(), detail({ id: OTHER })).get(ID), errorKind('invalid-response'));
});

test('paired money comparison uses normalized cents so harmless transport rounding does not create a mismatch', async () => {
  const result = await pair(tracking({ subtotal: 259.98000000000002 })).get(ID);
  assert.equal(result.subtotal, 259.98);
  await assert.rejects(pair(tracking({ subtotal: 259.981 })).get(ID), errorKind('invalid-response'));
});

test('tracking strips unknown properties and retains only frozen public item and address snapshots', async () => {
  const result = await pair(tracking({ customerUserId: 'private', idempotencyKey: 'private', token: 'private', trackingCode: 'private' }),
    detail({ customer: { email: 'private' }, notes: 'private', items: [item({ stockAvailable: 0, internal: 'private' })],
      shippingAddress: address({ sourceAddressId: 'private' }) })).get(ID);
  assert.deepEqual(Object.keys(result).sort(), ['cancelledAt', 'completedAt', 'confirmedAt', 'createdAt', 'currency', 'id', 'items',
    'reference', 'shippingAddress', 'status', 'subtotal', 'unitCount'].sort());
  assert.equal(JSON.stringify(result).includes('private'), false);
  assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result.items)); assert.ok(Object.isFrozen(result.items[0])); assert.ok(Object.isFrozen(result.shippingAddress));
  assert.equal((await pair(tracking(), detail({ shippingAddress: null })).get(ID)).shippingAddress, null);
});

test('invalid IDs never start either HTTP read', async () => {
  let reads = 0; const repo = repository(async () => { reads++; return response(detail()); });
  for (const id of ['', null, `${ID}?userId=other`, `${ID}\n`, '../private', 'g'.repeat(24)]) await assert.rejects(repo.get(id), errorKind('invalid-request'));
  assert.equal(reads, 0);
});

test('safe HTTP errors from either read never expose payload text or produce a partial tracking result', async () => {
  for (const stage of ['detail', 'tracking']) {
    for (const [status, kind] of [[400, 'invalid-request'], [401, 'unauthorized'], [403, 'forbidden'], [404, 'not-found'],
      [422, 'invalid-request'], [429, 'rate-limit'], [500, 'server'], [503, 'server'], [409, 'unknown']]) {
      let reads = 0;
      const repo = repository(async (url) => { reads++; const target = url.endsWith('/tracking') ? 'tracking' : 'detail';
        return target === stage ? response({ message: 'private token stack' }, status) : response(detail()); });
      await assert.rejects(repo.get(ID), errorKind(kind)); assert.equal(reads, stage === 'detail' ? 1 : 2);
    }
  }
});

test('a malformed detail stops the second request, while malformed tracking cannot publish a valid detail alone', async () => {
  let reads = 0;
  await assert.rejects(repository(async () => { reads++; return response({}); }).get(ID), errorKind('invalid-response'));
  assert.equal(reads, 1);
  for (const value of [null, [], {}, tracking({ status: 'delivered' }), tracking({ status: 'draft' })]) {
    await assert.rejects(pair(value).get(ID), errorKind('invalid-response'));
  }
  await assert.rejects(repository(async (url) => url.endsWith('/tracking')
    ? new Response('private', { headers: { 'content-type': 'application/json' } }) : response(detail())).get(ID), errorKind('invalid-response'));
});

test('transport failures are translated to tracking errors without retaining underlying diagnostics', async () => {
  for (const [kind, expected] of [['network', 'network'], ['timeout', 'timeout'], ['invalid-response', 'invalid-response'],
    ['invalid-request', 'configuration'], ['cancelled', 'cancelled']]) {
    await assert.rejects(new ApiOrderTrackingRepository({ request: async () => { throw new ApiError('private token stack', kind); } }).get(ID), errorKind(expected));
  }
  await assert.rejects(new ApiOrderTrackingRepository({ request: async () => { throw new Error('private token stack'); } }).get(ID), errorKind('unknown'));
});

test('a network failure on the tracking read discards the successful detail and later explicit retry re-reads both', async () => {
  let fail = true; const requests = [];
  const repo = repository(async (url) => { requests.push(url); if (url.endsWith('/tracking')) {
    if (fail) throw new Error('private'); return response(tracking({ status: 'confirmed', confirmedAt: CONFIRMED }));
  } return response(detail()); });
  await assert.rejects(repo.get(ID), errorKind('network')); fail = false;
  assert.equal((await repo.get(ID)).status, 'confirmed'); assert.equal(requests.length, 4);
});

test('an already cancelled read never requests detail or tracking', async () => {
  const abort = new AbortController(); abort.abort(); let reads = 0;
  const repo = repository(async () => { reads++; return response(detail()); });
  await assert.rejects(repo.get(ID, { signal: abort.signal }), errorKind('cancelled')); assert.equal(reads, 0);
});

test('cancellation after detail prevents starting tracking even when the dependency ignores abort', async () => {
  const abort = new AbortController(); let reads = 0;
  const repo = new ApiOrderTrackingRepository({ request: async () => { reads++; abort.abort(); return detail(); } });
  await assert.rejects(repo.get(ID, { signal: abort.signal }), errorKind('cancelled')); assert.equal(reads, 1);
});

test('cancellation on a late tracking success or rejection prevents publishing either half', async () => {
  for (const rejecting of [false, true]) {
    const abort = new AbortController(); let reads = 0;
    const repo = new ApiOrderTrackingRepository({ request: async (path, options) => {
      assert.equal(options.signal, abort.signal); assert.equal(options.authenticated, true); reads++;
      if (!path.endsWith('/tracking')) return detail();
      abort.abort(); if (rejecting) throw new ApiError('private', 'http', 401); return tracking();
    } });
    await assert.rejects(repo.get(ID, { signal: abort.signal }), errorKind('cancelled')); assert.equal(reads, 2);
  }
});
