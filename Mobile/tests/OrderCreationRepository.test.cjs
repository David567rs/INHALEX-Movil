const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiError } = require('../src/core/network/ApiError.ts');
const { ApiOrderCreationRepository } = require('../src/features/orderCreation/data/repositories/ApiOrderCreationRepository.ts');
const { OrderCreationError } = require('../src/features/orderCreation/domain/errors/OrderCreationError.ts');

const id = '507f1f77bcf86cd799439011';
const addressId = '507f1f77bcf86cd799439012';
const orderId = '507f1f77bcf86cd799439013';
const requestItems = [{ productId: id, quantity: 2 }];
const contact = { customerName: 'Valeria Flores', customerEmail: 'valeria@example.test', customerPhone: '5500000000', notes: '' };
const input = { ...contact, items: requestItems, shippingAddressId: addressId, previewSignature: 'a'.repeat(64) };
const key = 'order-test-idempotency-1234';
const item = (overrides = {}) => ({ productId: id, productName: 'Lavanda', productSlug: 'lavanda', image: '/products/lavanda.png',
  category: 'floral', presentation: '10 ml', origin: 'México', unitPrice: 129.99, currency: 'MXN', requestedQuantity: 2,
  quantity: 2, subtotal: 259.98, fulfillment: 'available', stockAvailable: 10, reservedQuantity: 2, backorderQuantity: 0,
  inventoryTracked: true, allowBackorder: false, ...overrides });
const quote = (overrides = {}) => ({ items: [item()], issues: [], subtotal: 259.98, totalItems: 2, currency: 'MXN',
  canCreateDraft: true, canConfirmOrder: true, needsManualReview: false, signature: 'a'.repeat(64), ...overrides });
const confirmation = (overrides = {}) => ({ ...quote(), orderId, reference: 'PED-20261019-ABC123', status: 'pending_review', createdAt: '2026-10-19T12:00:00.000Z', ...overrides });
const emptyCart = { items: [], subtotal: 0, totalItems: 0, currency: 'MXN' };
const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const sources = (overrides = {}) => ({ cart: { list: async () => emptyCart }, addresses: { list: async () => [] },
  profile: { get: async () => ({ id, firstName: 'Valeria', lastName: 'Flores', email: contact.customerEmail, phone: contact.customerPhone }) }, ...overrides });
const repository = (fetch, from = sources()) => new ApiOrderCreationRepository(new HttpClient({
  baseUrl: 'https://api.example/api', fetch, getAccessToken: () => 'private.jwt.token',
}), from);
const errorKind = (kind) => (error) => {
  assert.ok(error instanceof OrderCreationError); assert.equal(error.kind, kind); assert.equal(error.cause, undefined); return true;
};

test('order load composes injected account sources concurrently and readCart reuses the source', async () => {
  const calls = []; const options = { signal: new AbortController().signal };
  const from = sources({ cart: { list: async (received) => { calls.push(['cart', received]); return emptyCart; } },
    addresses: { list: async (received) => { calls.push(['addresses', received]); return []; } },
    profile: { get: async (received) => { calls.push(['profile', received]); return { id }; } } });
  const repo = repository(() => { throw new Error('unexpected HTTP'); }, from);
  const result = await repo.load(options);
  assert.deepEqual(result, { cart: emptyCart, addresses: [], profile: { id } });
  assert.ok(Object.isFrozen(result)); assert.equal(calls.length, 3);
  assert.ok(calls.every(([, received]) => received === options));
  assert.equal(await repo.readCart(options), emptyCart); assert.equal(calls.length, 4);
});

test('order preview POST authenticates, sends only normalized item input and projects safe readonly quote', async () => {
  let request;
  const repo = repository(async (url, options) => { request = { url, options }; return jsonResponse(quote({ customer: { email: 'private' }, token: 'private' })); });
  const result = await repo.preview([{ productId: id.toUpperCase(), quantity: 2, subtotal: 0.01 }]);
  assert.equal(request.url, 'https://api.example/api/orders/draft/preview');
  assert.equal(request.options.method, 'POST'); assert.equal(request.options.headers.Authorization, 'Bearer private.jwt.token');
  assert.equal(request.options.headers['Idempotency-Key'], undefined);
  assert.deepEqual(JSON.parse(request.options.body), { items: requestItems });
  assert.equal(result.items[0].productName, 'Lavanda'); assert.equal(result.items[0].message, null);
  assert.equal(JSON.stringify(result).includes('private'), false);
  assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result.items)); assert.ok(Object.isFrozen(result.items[0]));
});

test('order quote displays adjusted, backorder, manual and no surviving items without guessing availability', async () => {
  const variants = [
    quote({ items: [item({ quantity: 1, subtotal: 129.99, reservedQuantity: 1, stockAvailable: 1, fulfillment: 'adjusted' })], subtotal: 129.99, totalItems: 1 }),
    quote({ items: [item({ fulfillment: 'backorder', allowBackorder: true, reservedQuantity: 1, backorderQuantity: 1, stockAvailable: 1 })], needsManualReview: true }),
    quote({ items: [item({ fulfillment: 'manual', inventoryTracked: false, reservedQuantity: 0, stockAvailable: null })], needsManualReview: true }),
    quote({ items: [], issues: [{ code: 'product_not_found', severity: 'error', productId: id, title: 'Producto no disponible', description: 'El producto ya no está disponible.' }],
      subtotal: 0, totalItems: 0, canCreateDraft: false, canConfirmOrder: false }),
  ];
  for (const payload of variants) {
    const result = await repository(async () => jsonResponse(payload)).preview(requestItems);
    assert.equal(result.totalItems, payload.totalItems); assert.equal(result.subtotal, payload.subtotal);
    assert.equal(result.needsManualReview, payload.needsManualReview);
  }
});

test('order quote rejects malformed envelopes, money drift, duplicate or unrelated products and inconsistent totals', async () => {
  const malformed = [null, {}, [], quote({ items: [null] }), quote({ items: Array(21).fill(item()) }),
    quote({ items: [item(), item()] }), quote({ items: [item({ productId: addressId })] }),
    quote({ items: [item({ quantity: 0 })] }), quote({ items: [item({ requestedQuantity: 3 })] }),
    quote({ items: [item({ unitPrice: NaN })] }), quote({ items: [item({ unitPrice: -1 })] }),
    quote({ items: [item({ unitPrice: 129.991 })] }), quote({ items: [item({ subtotal: 259.99 })] }),
    quote({ items: [item({ fulfillment: 'unknown' })] }), quote({ items: [item({ inventoryTracked: 'yes' })] }),
    quote({ items: [item({ reservedQuantity: 3 })] }), quote({ items: [item({ stockAvailable: -1 })] }),
    quote({ items: [item({ stockAvailable: 1 })] }),
    quote({ items: [item({ fulfillment: 'manual' })], needsManualReview: true }),
    quote({ items: [item({ fulfillment: 'backorder' })], needsManualReview: true }),
    quote({ items: [], subtotal: 0, totalItems: 0, canCreateDraft: false, canConfirmOrder: false }),
    quote({ currency: 'BAD' }), quote({ currency: 'USD' }), quote({ subtotal: 0 }), quote({ totalItems: 3 }),
    quote({ canConfirmOrder: false }), quote({ needsManualReview: true }), quote({ signature: 'secret' }),
    quote({ issues: [{ code: 'bad', severity: 'warning', title: 'A', description: 'B', productId: addressId }] }),
    quote({ issues: [{ code: 'bad', severity: 'unknown', title: 'A', description: 'B' }] }),
    quote({ items: [item({ productName: 'x'.repeat(121) })] })];
  for (const payload of malformed) await assert.rejects(repository(async () => jsonResponse(payload)).preview(requestItems), errorKind('invalid-response'));
});

test('order quote preserves cent precision despite harmless floating multiplication drift', async () => {
  const result = await repository(async () => jsonResponse(quote({ items: [item({ unitPrice: 0.29, quantity: 2, subtotal: 0.29 * 2 })], subtotal: 0.29 * 2 }))).preview(requestItems);
  assert.equal(result.subtotal, 0.58);
});

test('order image mapper rejects unsafe sources while preserving local paths and secure remote images', async () => {
  for (const source of ['javascript:alert(1)', 'http://unsafe.test/p.png', 'https://user:secret@image.test/p.png', '//outside.test/a', '/a/../private', '/image%0a.png']) {
    const result = await repository(async () => jsonResponse(quote({ items: [item({ image: source })] }))).preview(requestItems);
    assert.equal(result.items[0].image, null);
  }
  const secure = 'https://images.example.test/lavanda.png';
  assert.equal((await repository(async () => jsonResponse(quote({ items: [item({ image: secure })] }))).preview(requestItems)).items[0].image, secure);
});

test('order confirmation POST forwards persisted idempotency key and only allowed normalized payload fields', async () => {
  let request;
  const result = await repository(async (url, options) => { request = { url, options }; return jsonResponse(confirmation({ customer: { phone: 'private' }, paymentToken: 'private' }), 201); })
    .confirm({ ...input, customerEmail: ' VALERIA@EXAMPLE.TEST ', shippingAddressId: addressId.toUpperCase(), notes: ' ', total: 0, role: 'admin' }, key);
  assert.equal(request.url, 'https://api.example/api/orders/confirm'); assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers.Authorization, 'Bearer private.jwt.token');
  assert.equal(request.options.headers['Idempotency-Key'], key); assert.deepEqual(JSON.parse(request.options.body), input);
  assert.equal(result.reference, 'PED-20261019-ABC123'); assert.equal(result.status, 'pending_review');
  assert.equal(JSON.stringify(result).includes('private'), false); assert.ok(Object.isFrozen(result));
});

test('order confirmation accepts replayed terminal states and absent creation time', async () => {
  for (const status of ['pending_review', 'confirmed', 'cancelled', 'completed']) {
    const result = await repository(async () => jsonResponse(confirmation({ status, createdAt: undefined, signature: 'b'.repeat(64) }))).confirm(input, key);
    assert.equal(result.status, status); assert.equal(result.createdAt, null);
  }
});

test('order confirmation recovers historical post-reservation stock snapshots while preview keeps current availability checks', async () => {
  // OrdersService.prepareOrderForCompletion can reconcile a manual/backorder item
  // into available, persisting stockAvailable=nextAvailable and reservedQuantity=quantity.
  const reconciled = item({ stockAvailable: 0, reservedQuantity: 2, backorderQuantity: 0,
    fulfillment: 'available', inventoryTracked: true, allowBackorder: true });
  for (const status of ['confirmed', 'cancelled', 'completed']) {
    const result = await repository(async () => jsonResponse(confirmation({ status, items: [reconciled], needsManualReview: false }))).confirm(input, key);
    assert.equal(result.status, status); assert.equal(result.items[0].stockAvailable, 0);
    assert.equal(result.items[0].reservedQuantity, 2); assert.equal(result.needsManualReview, false);
  }
  await assert.rejects(repository(async () => jsonResponse(quote({ items: [reconciled] }))).preview(requestItems), errorKind('invalid-response'));
  await assert.rejects(repository(async () => jsonResponse(confirmation({ status: 'pending_review', items: [reconciled] }))).confirm(input, key), errorKind('invalid-response'));
  await assert.rejects(repository(async () => jsonResponse(confirmation({ status: 'completed', items: [item({ ...reconciled, quantity: 3, subtotal: 389.97 })] }))).confirm(input, key), errorKind('invalid-response'));
});

test('order confirmation rejects non-confirmation receipts without retaining raw values', async () => {
  for (const payload of [confirmation({ orderId: 'not-mongo' }), confirmation({ reference: 'BOR-20261019-ABC123' }),
    confirmation({ reference: 'PED-20261019-ABC123\n' }), confirmation({ status: 'draft' }), confirmation({ status: 'unknown' }),
    confirmation({ createdAt: 'invalid' }), confirmation({ createdAt: '2026-02-31T01:00:00Z' }),
    confirmation({ createdAt: '2026-10-19' }),
    confirmation({ createdAt: '2026-10-19' + 'x'.repeat(100) })]) {
    await assert.rejects(repository(async () => jsonResponse(payload)).confirm(input, key), errorKind('invalid-response'));
  }
});

test('historical adjusted confirmations accept remaining stock after reservation while current quotes remain strict', async () => {
  // prepareOrderForCompletion retains ADJUSTED fulfillment while persisting the
  // complementary reservation's nextAvailable, which can be zero.
  const adjusted = item({ quantity: 1, subtotal: 129.99, reservedQuantity: 1, stockAvailable: 0, fulfillment: 'adjusted' });
  const adjustedQuote = { items: [adjusted], subtotal: 129.99, totalItems: 1 };
  for (const status of ['confirmed', 'cancelled', 'completed']) {
    const result = await repository(async () => jsonResponse(confirmation({ ...adjustedQuote, status }))).confirm(input, key);
    assert.equal(result.status, status); assert.equal(result.items[0].fulfillment, 'adjusted');
    assert.equal(result.items[0].stockAvailable, 0); assert.equal(result.items[0].quantity, 1);
  }
  await assert.rejects(repository(async () => jsonResponse(quote(adjustedQuote))).preview(requestItems), errorKind('invalid-response'));
  await assert.rejects(repository(async () => jsonResponse(confirmation(adjustedQuote))).confirm(input, key), errorKind('invalid-response'));
  for (const invalid of [
    { ...adjusted, allowBackorder: true },
    { ...adjusted, reservedQuantity: 0, backorderQuantity: 1 },
    { ...adjusted, quantity: 2, reservedQuantity: 2, subtotal: 259.98 },
    { ...adjusted, stockAvailable: -1 },
  ]) {
    await assert.rejects(repository(async () => jsonResponse(confirmation({ ...adjustedQuote, status: 'completed', items: [invalid] })))
      .confirm(input, key), errorKind('invalid-response'));
  }
});

test('order API errors are safe and classify 401, 409, input errors and uncertain transport/server failures', async () => {
  for (const [status, kind] of [[401, 'unauthorized'], [409, 'conflict'], [400, 'invalid-request'], [422, 'invalid-request'], [500, 'network'], [503, 'network'], [403, 'server']]) {
    await assert.rejects(repository(async () => jsonResponse({ message: 'private token secret' }, status)).confirm(input, key), (error) => {
      errorKind(kind)(error); assert.equal(error.message.includes('private'), false); return true;
    });
  }
  await assert.rejects(repository(async () => { throw new Error('private connection'); }).confirm(input, key), errorKind('network'));
  const fake = new ApiOrderCreationRepository({ request: async () => { throw new ApiError('secret', 'timeout'); } }, sources());
  await assert.rejects(fake.confirm(input, key), errorKind('timeout'));
});

test('order source failures are translated and late cancellation prevents publication', async () => {
  const repo = repository(() => { throw new Error('unexpected'); }, sources({ profile: { get: async () => { throw { kind: 'unauthorized', cause: 'secret' }; } } }));
  await assert.rejects(repo.load(), errorKind('unauthorized'));
  const abort = new AbortController(); abort.abort(); let requests = 0;
  await assert.rejects(repository(async () => { requests++; return jsonResponse(quote()); }).preview(requestItems, { signal: abort.signal }), errorKind('cancelled'));
  assert.equal(requests, 0);
  const late = new AbortController();
  const fake = new ApiOrderCreationRepository({ request: async () => { late.abort(); return quote(); } }, sources());
  await assert.rejects(fake.preview(requestItems, { signal: late.signal }), errorKind('cancelled'));
});

test('order clearCart sends only authenticated DELETE and requires a verified empty cart response', async () => {
  let request;
  const repo = repository(async (url, options) => { request = { url, options }; return jsonResponse(emptyCart); });
  assert.deepEqual(await repo.clearCart(), emptyCart);
  assert.equal(request.url, 'https://api.example/api/cart'); assert.equal(request.options.method, 'DELETE');
  assert.equal(request.options.headers.Authorization, 'Bearer private.jwt.token'); assert.equal(request.options.body, undefined);
  assert.equal(request.options.headers['Idempotency-Key'], undefined);
  for (const invalid of [null, {}, { ...emptyCart, subtotal: 1 }, { ...emptyCart, totalItems: 1 }]) {
    await assert.rejects(repository(async () => jsonResponse(invalid)).clearCart(), errorKind('invalid-response'));
  }
});

test('order adapters reject invalid input before sending HTTP or creating drafts', async () => {
  let calls = 0; const repo = repository(async () => { calls++; return jsonResponse(confirmation()); });
  await assert.rejects(repo.preview([]), errorKind('invalid-request'));
  await assert.rejects(repo.confirm(input, 'bad'), errorKind('invalid-request'));
  await assert.rejects(repo.confirm({ ...input, shippingAddressId: '' }, key), errorKind('invalid-request'));
  assert.equal(calls, 0);
});
