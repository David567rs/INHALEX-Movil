const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiError } = require('../src/core/network/ApiError.ts');
const { ApiOrderHistoryRepository } = require('../src/features/orderHistory/data/repositories/ApiOrderHistoryRepository.ts');
const { OrderHistoryError } = require('../src/features/orderHistory/domain/errors/OrderHistoryError.ts');

const id = '507f1f77bcf86cd799439011';
const otherId = '507f1f77bcf86cd799439012';
const productId = '507f1f77bcf86cd799439013';
const summary = (overrides = {}) => ({ id, reference: 'PED-20261020-ABC123', status: 'pending_review',
  currency: 'MXN', totalItems: 2, subtotal: 259.98, createdAt: '2026-10-20T12:00:00.000Z', ...overrides });
const item = (overrides = {}) => ({ productId, productName: 'Lavanda', presentation: '10 ml',
  image: '/products/lavanda.png', quantity: 2, unitPrice: 129.99, subtotal: 259.98, currency: 'MXN', ...overrides });
const address = (overrides = {}) => ({ label: 'Casa', recipientName: 'Cliente de prueba', phone: '5500000000',
  street: 'Calle Uno', exteriorNumber: '12', neighborhood: 'Centro', municipality: 'Ciudad', state: 'Estado',
  postalCode: '12345', ...overrides });
const detail = (overrides = {}) => ({ ...summary(), items: [item()], shippingAddress: address(), ...overrides });
const page = (overrides = {}) => ({ orders: [summary()], nextCursor: null, ...overrides });
const response = (payload, status = 200) => new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
const repository = (fetch) => new ApiOrderHistoryRepository(new HttpClient({
  baseUrl: 'https://api.example/api', fetch, getAccessToken: () => 'private.jwt.token',
}));
const errorKind = (kind) => (error) => {
  assert.ok(error instanceof OrderHistoryError); assert.equal(error.kind, kind);
  assert.equal(error.cause, undefined); assert.equal(error.message.includes('private'), false); return true;
};

test('history list sends only authenticated GET and whitelists immutable public summaries', async () => {
  let request;
  const result = await repository(async (url, options) => {
    request = { url, options };
    return response(page({ orders: [summary({ id: id.toUpperCase(), customer: { email: 'private' }, idempotencyKey: 'private' })], token: 'private' }));
  }).list(undefined, { accountId: 'private', email: 'private' });
  assert.equal(request.url, 'https://api.example/api/orders/me');
  assert.equal(request.options.method, 'GET'); assert.equal(request.options.body, undefined);
  assert.equal(request.options.headers.Authorization, 'Bearer private.jwt.token');
  assert.equal(request.options.headers['Idempotency-Key'], undefined);
  assert.deepEqual(result.orders[0], { id, reference: 'PED-20261020-ABC123', status: 'pending_review',
    currency: 'MXN', unitCount: 2, subtotal: 259.98, createdAt: '2026-10-20T12:00:00.000Z' });
  assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result.orders)); assert.ok(Object.isFrozen(result.orders[0]));
  assert.equal(JSON.stringify(result).includes('private'), false);
});

test('history pagination forwards only the opaque bounded cursor and accepts twenty summaries', async () => {
  let requested;
  const cursor = 'A_b-09';
  const orders = Array.from({ length: 20 }, (_, index) => summary({ id: index.toString(16).padStart(24, '0'), reference: `PED-${index}` }));
  const result = await repository(async (url) => { requested = url; return response(page({ orders, nextCursor: 'B_b-10' })); }).list(cursor);
  assert.equal(requested, `https://api.example/api/orders/me?cursor=${cursor}`);
  assert.equal(result.orders.length, 20); assert.equal(result.nextCursor, 'B_b-10');
  const empty = await repository(async () => response({ orders: [], nextCursor: null })).list();
  assert.deepEqual(empty, { orders: [], nextCursor: null }); assert.ok(Object.isFrozen(empty.orders));
});

test('history adapters reject invalid input before HTTP, including account query injection', async () => {
  let calls = 0;
  const repo = repository(async () => { calls++; return response(page()); });
  for (const cursor of ['', null, 'x'.repeat(257), 'abc\n', 'abc&email=private']) {
    await assert.rejects(repo.list(cursor), errorKind('invalid-request'));
  }
  for (const selected of ['', `${id}\n`, '../private', 'g'.repeat(24)]) {
    await assert.rejects(repo.get(selected), errorKind('invalid-request'));
  }
  assert.equal(calls, 0);
});

test('history list accepts all four account history states while rejecting drafts and inferred delivery states', async () => {
  for (const status of ['pending_review', 'confirmed', 'cancelled', 'completed']) {
    const result = await repository(async () => response(page({ orders: [summary({ status })] }))).list();
    assert.equal(result.orders[0].status, status);
  }
  for (const status of ['draft', 'delivered', 'preparing', 'unknown', null]) {
    await assert.rejects(repository(async () => response(page({ orders: [summary({ status })] }))).list(), errorKind('invalid-response'));
  }
});

test('history list rejects malformed envelopes, duplicate IDs and invalid continuation cursors', async () => {
  for (const payload of [null, [], {}, page({ orders: null }), page({ orders: [null] }), page({ orders: Array(21).fill(summary()) }),
    page({ orders: [summary(), summary({ id: id.toUpperCase() })] }), page({ nextCursor: undefined }),
    page({ nextCursor: '' }), page({ nextCursor: 'x'.repeat(257) }), page({ nextCursor: 'abc\n' }),
    page({ nextCursor: 'x?token=private' }), page({ orders: [], nextCursor: 'next' })]) {
    await assert.rejects(repository(async () => response(payload)).list(), errorKind('invalid-response'));
  }
  await assert.rejects(repository(async () => response(page({ nextCursor: 'same' }))).list('same'), errorKind('invalid-response'));
});

test('history summary rejects invalid references, identifiers, canonical dates, units and money', async () => {
  const overrides = [{ id: 'not-an-id' }, { id: `${id}\n` }, { reference: '' }, { reference: 'PED\nprivate' },
    { reference: ' PED-1' }, { reference: 'X'.repeat(81) }, { reference: 'PED?private' }, { currency: 'USD' },
    ...[0, 501, 1.5, '2'].map((totalItems) => ({ totalItems })),
    ...[-1, '259.98', 259.981, null].map((subtotal) => ({ subtotal })),
    ...['2026-02-30T12:00:00.000Z', '2026-10-20', '2026-10-20T12:00:00Z', 'private', null].map((createdAt) => ({ createdAt }))];
  for (const change of overrides) {
    await assert.rejects(repository(async () => response(page({ orders: [summary(change)] }))).list(), errorKind('invalid-response'));
  }
});

test('history detail reads the requested order snapshot and strips internal fields without current stock assumptions', async () => {
  let request;
  const payload = detail({ customerUserId: 'private', customer: { email: 'private' }, notes: 'private',
    items: [item({ stockAvailable: 0, reservedQuantity: 2, accessToken: 'private' })],
    shippingAddress: address({ sourceAddressId: 'private', internalNotes: 'private' }) });
  const result = await repository(async (url, options) => { request = { url, options }; return response(payload); }).get(id.toUpperCase());
  assert.equal(request.url, `https://api.example/api/orders/me/${id}`); assert.equal(request.options.method, 'GET');
  assert.equal(request.options.headers.Authorization, 'Bearer private.jwt.token'); assert.equal(request.options.body, undefined);
  assert.deepEqual(result.items[0], item());
  assert.deepEqual(result.shippingAddress, { ...address(), interiorNumber: '', references: '' });
  assert.equal(result.unitCount, 2); assert.equal(result.subtotal, 259.98);
  assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result.items)); assert.ok(Object.isFrozen(result.items[0]));
  assert.ok(Object.isFrozen(result.shippingAddress)); assert.equal(JSON.stringify(result).includes('private'), false);
});

test('history detail supports absent historical address and normalizes optional address strings', async () => {
  assert.equal((await repository(async () => response(detail({ shippingAddress: null }))).get(id)).shippingAddress, null);
  const result = await repository(async () => response(detail({ shippingAddress: address({ interiorNumber: 'A', references: 'Puerta verde' }) }))).get(id);
  assert.equal(result.shippingAddress.interiorNumber, 'A'); assert.equal(result.shippingAddress.references, 'Puerta verde');
  const multiline = 'Puerta verde\nTocar dos veces';
  assert.equal((await repository(async () => response(detail({ shippingAddress: address({ references: multiline }) }))).get(id))
    .shippingAddress.references, multiline);
  await assert.rejects(repository(async () => response(detail({ shippingAddress: undefined }))).get(id), errorKind('invalid-response'));
});

test('history detail rejects another order, duplicate products, inconsistent quantities and item money', async () => {
  const malformed = [detail({ id: otherId }), detail({ items: [] }), detail({ items: [null] }),
    detail({ items: Array(21).fill(item()) }), detail({ items: [item(), item()] }),
    detail({ totalItems: 3 }), detail({ subtotal: 260 }),
    ...[{ quantity: 0 }, { quantity: 26 }, { quantity: 1.5 }, { productId: 'bad' }, { productName: 'private\0' },
      { productName: 'x'.repeat(121) }, { presentation: '' }, { currency: 'USD' }, { unitPrice: 129.991 },
      { unitPrice: -1 }, { subtotal: 259.99 }].map((entry) => detail({ items: [item(entry)] }))];
  for (const payload of malformed) await assert.rejects(repository(async () => response(payload)).get(id), errorKind('invalid-response'));
});

test('history detail verifies multiple snapshot lines against the summary and normalizes cent drift', async () => {
  const payload = detail({ totalItems: 3, subtotal: 1.45, items: [
    item({ unitPrice: 0.29, quantity: 2, subtotal: 0.29 * 2 }),
    item({ productId: otherId, unitPrice: 0.87, quantity: 1, subtotal: 0.87 }),
  ] });
  const result = await repository(async () => response(payload)).get(id);
  assert.equal(result.items[0].subtotal, 0.58); assert.equal(result.unitCount, 3); assert.equal(result.subtotal, 1.45);
});

test('history detail rejects malformed address text and keeps safe historical address projection', async () => {
  for (const value of [[], 'private', {}, address({ label: '' }), address({ phone: 'private' }),
    address({ postalCode: '1234' }), address({ street: 'private\0' }), address({ references: 'x'.repeat(301) })]) {
    await assert.rejects(repository(async () => response(detail({ shippingAddress: value }))).get(id), errorKind('invalid-response'));
  }
});

test('history image mapping uses existing safe catalog policy without making any external request', async () => {
  for (const image of ['javascript:private', 'http://unsafe.test/a.png', '//outside.test/a.png', 'https://user:private@image.test/a', '/a/../private', undefined]) {
    const result = await repository(async () => response(detail({ items: [item({ image })] }))).get(id);
    assert.equal(result.items[0].image, null);
  }
  const image = 'https://images.example.test/lavanda.png';
  assert.equal((await repository(async () => response(detail({ items: [item({ image })] }))).get(id)).items[0].image, image);
});

test('history HTTP errors use bounded messages instead of server payload or causes', async () => {
  for (const [status, kind] of [[400, 'invalid-request'], [401, 'unauthorized'], [403, 'forbidden'], [404, 'not-found'],
    [422, 'invalid-request'], [429, 'rate-limit'], [500, 'server'], [503, 'server'], [409, 'unknown']]) {
    for (const operation of [(repo) => repo.list(), (repo) => repo.get(id)]) {
      await assert.rejects(operation(repository(async () => response({ message: 'private access token' }, status))), errorKind(kind));
    }
  }
});

test('history transport failures distinguish network, timeout, invalid JSON and configuration', async () => {
  await assert.rejects(repository(async () => { throw new Error('private'); }).list(), errorKind('network'));
  for (const [kind, expected] of [['timeout', 'timeout'], ['invalid-request', 'configuration'], ['invalid-response', 'invalid-response'], ['cancelled', 'cancelled']]) {
    const repo = new ApiOrderHistoryRepository({ request: async () => { throw new ApiError('private', kind, null, 'private'); } });
    await assert.rejects(repo.list(), errorKind(expected));
  }
  await assert.rejects(repository(async () => new Response('private', { headers: { 'content-type': 'application/json' } })).list(), errorKind('invalid-response'));
  await assert.rejects(new ApiOrderHistoryRepository({ request: async () => { throw new Error('private'); } }).list(), errorKind('unknown'));
});

test('history abort guards prevent requests and publication after late completion', async () => {
  let requests = 0;
  const aborted = new AbortController(); aborted.abort();
  const repo = repository(async () => { requests++; return response(page()); });
  await assert.rejects(repo.list(undefined, { signal: aborted.signal }), errorKind('cancelled'));
  await assert.rejects(repo.get(id, { signal: aborted.signal }), errorKind('cancelled'));
  assert.equal(requests, 0);
  const late = new AbortController();
  await assert.rejects(new ApiOrderHistoryRepository({ request: async () => { late.abort(); return page(); } })
    .list(undefined, { signal: late.signal }), errorKind('cancelled'));
});
