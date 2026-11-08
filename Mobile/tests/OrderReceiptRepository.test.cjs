const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiError } = require('../src/core/network/ApiError.ts');
const { ApiOrderReceiptRepository } = require('../src/features/orderReceipt/data/repositories/ApiOrderReceiptRepository.ts');
const { OrderReceiptError } = require('../src/features/orderReceipt/domain/errors/OrderReceiptError.ts');
const ORDER = '507f1f77bcf86cd799439012', PRODUCT = '507f1f77bcf86cd799439011', OTHER = '507f1f77bcf86cd799439013';
const DATE = '2026-11-08T12:00:00.000Z';
const item = (changes = {}) => ({ productId: PRODUCT, productName: 'Lavanda', productSlug: 'lavanda', image: '/images/lavanda.jpg', presentation: '10 ml', currency: 'MXN', quantity: 2, unitPrice: 60, subtotal: 120, ...changes });
const order = (changes = {}) => ({ id: ORDER, reference: 'INX-DEMO-001', status: 'completed', customerReceiptStatus: 'pending', completedAt: DATE,
  totalItems: 2, subtotal: 120, currency: 'MXN', items: [item()], ...changes });
const confirmed = (changes = {}) => order({ customerReceiptStatus: 'confirmed', customerReceiptConfirmedAt: DATE, ...changes });
const response = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
const repo = (fetch, timeout = 1000) => new ApiOrderReceiptRepository(new HttpClient({ baseUrl: 'https://api.example/api', fetch, getAccessToken: () => 'private.jwt.token', requestTimeoutMs: timeout }));
const kind = (expected) => (error) => { assert.ok(error instanceof OrderReceiptError); assert.equal(error.kind, expected); assert.doesNotMatch(error.message, /private|token|stack/); assert.equal(error.cause, undefined); return true; };

test('receipt GET authenticates privately, preserves server order, strips metadata and freezes nested models', async () => {
  let request;
  const result = await repo(async (url, options) => { request = { url, options }; return response([order({ id: ORDER.toUpperCase(), customerEmail: 'private', customerReceiptIssueNote: 'private', metadata: { token: 'private' }, items: [item({ userId: 'private' })] }), confirmed({ id: OTHER })]); }).list({ userId: 'private' });
  assert.equal(request.url, 'https://api.example/api/orders/me/receipt-confirmations'); assert.equal(request.options.method, 'GET');
  assert.equal(request.options.headers.Authorization, 'Bearer private.jwt.token'); assert.equal(request.options.body, undefined);
  assert.equal(result[0].id, ORDER); assert.equal(result[1].id, OTHER); assert.equal(result[0].receiptStatus, 'pending'); assert.equal(result[1].receiptStatus, 'confirmed');
  assert.deepEqual(result[0].items[0], { id: PRODUCT, productId: PRODUCT, name: 'Lavanda', imageUrl: '/images/lavanda.jpg', presentation: '10 ml', quantity: 2, unitPrice: 60, subtotal: 120 });
  assert.equal(result[0].completedAt, DATE); assert.equal(result[0].confirmedAt, null); assert.equal(result[1].confirmedAt, DATE);
  for (const value of [result, result[0], result[0].items, result[0].items[0]]) assert.ok(Object.isFrozen(value));
  assert.equal(JSON.stringify(result).includes('private'), false);
});

test('legacy missing/not_required completed receipts normalize pending; missing dates stay unknown and unsafe images fall back', async () => {
  for (const customerReceiptStatus of [undefined, null, 'not_required']) {
    const result = await repo(async () => response([order({ customerReceiptStatus, completedAt: undefined, items: [item({ image: 'javascript:private' })] })])).list();
    assert.equal(result[0].receiptStatus, 'pending'); assert.equal(result[0].completedAt, null); assert.equal(result[0].items[0].imageUrl, null);
  }
  const result = await repo(async () => response([order({ customerReceiptStatus: 'issue_reported' })])).list();
  assert.equal(result[0].receiptStatus, 'issue_reported');
});

test('only a valid empty array means no receipt orders; malformed or partial collections are errors', async () => {
  assert.deepEqual(await repo(async () => response([])).list(), []);
  for (const payload of [null, {}, { items: [] }, [order(), null], Array(13).fill(order()), [order(), order({ id: ORDER.toUpperCase() })]]) {
    await assert.rejects(repo(async () => response(payload)).list(), kind('invalid-response'));
  }
});

test('receipt presentations support the same 160-character bound as order history on reads and confirmations', async () => {
  for (const length of [121, 160]) {
    const presentation = 'A'.repeat(length);
    const items = [item({ presentation })];
    const listed = await repo(async () => response([order({ items })])).list();
    const receipt = await repo(async () => response(confirmed({ items }))).confirm(ORDER);
    assert.equal(listed[0].items[0].presentation, presentation);
    assert.equal(receipt.items[0].presentation, presentation);
  }
  const items = [item({ presentation: 'A'.repeat(161) })];
  await assert.rejects(repo(async () => response([order({ items })])).list(), kind('invalid-response'));
  await assert.rejects(repo(async () => response(confirmed({ items }))).confirm(ORDER), kind('invalid-response'));
});

test('receipt mapper rejects ineligible states, invalid identities, unknown statuses and impossible dates', async () => {
  for (const changes of [{ id: '../private' }, { reference: '' }, { reference: 'private\n' }, { status: 'confirmed' }, { status: 'cancelled' },
    { customerReceiptStatus: 'delivered' }, { currency: 'USD' }, { totalItems: '2' }, { totalItems: 0 }, { completedAt: '2026-02-30T12:00:00.000Z' },
    { completedAt: '2026-11-08' }, { customerReceiptConfirmedAt: DATE }, { customerReceiptStatus: 'confirmed', customerReceiptConfirmedAt: 'bad' }]) {
    await assert.rejects(repo(async () => response([order(changes)])).list(), kind('invalid-response'));
  }
});

test('receipt quantities and money must match every item and the entire order without floating point drift', async () => {
  const payloads = [order({ items: [] }), order({ items: Array(21).fill(item()) }), order({ items: [item(), item()], totalItems: 4, subtotal: 240 }),
    order({ totalItems: 3 }), order({ subtotal: 119 }), order({ items: [item({ quantity: 26 })] }), order({ items: [item({ quantity: 0 })] }),
    order({ items: [item({ quantity: 1.5 })] }), order({ items: [item({ unitPrice: -1 })] }), order({ items: [item({ subtotal: 119 })] }),
    order({ items: [item({ unitPrice: 60.001 })] }), order({ items: [item({ currency: 'USD' })] }), order({ items: [item({ productName: '' })] }),
    order({ items: [item({ productId: 'wrong' })] }), order({ items: [item({ presentation: 'bad\u0000' })] })];
  for (const payload of payloads) await assert.rejects(repo(async () => response([payload])).list(), kind('invalid-response'));
  const result = await repo(async () => response([order({ totalItems: 3, subtotal: 0.3, items: [item({ quantity: 3, unitPrice: 0.1, subtotal: 0.3 })] })])).list();
  assert.equal(result[0].subtotal, 0.3);
});

test('PATCH confirms only the exact chosen order, sends no body/account fields and retains completed status', async () => {
  let request;
  const result = await repo(async (url, options) => { request = { url, options }; return response(confirmed({ customerEmail: 'private' })); }).confirm(ORDER.toUpperCase());
  assert.equal(request.url, `https://api.example/api/orders/${ORDER}/receipt/confirm`); assert.equal(request.options.method, 'PATCH');
  assert.equal(request.options.body, undefined); assert.equal(request.options.headers.Authorization, 'Bearer private.jwt.token');
  assert.equal(request.options.headers['Idempotency-Key'], undefined); assert.equal(result.id, ORDER); assert.equal(result.status, 'completed'); assert.equal(result.receiptStatus, 'confirmed');
});

test('a successful PATCH must acknowledge the same order and confirmed reception, never infer success from HTTP alone', async () => {
  for (const payload of [order(), confirmed({ id: OTHER }), confirmed({ status: 'confirmed' }), confirmed({ customerReceiptStatus: 'issue_reported' }), confirmed({ customerReceiptConfirmedAt: undefined }), null]) {
    await assert.rejects(repo(async () => response(payload)).confirm(ORDER), kind('invalid-response'));
  }
});

test('invalid direct repository targets cannot send requests', async () => {
  let requests = 0; const repository = repo(async () => { requests++; return response(confirmed()); });
  for (const value of [undefined, null, [], '../private', '', ORDER+' ']) await assert.rejects(repository.confirm(value), kind('invalid-request'));
  assert.equal(requests, 0);
});

test('read and write map HTTP failures to safe distinct errors; conflict is not a new success', async () => {
  for (const [status, expected] of [[400, 'invalid-request'], [401, 'unauthorized'], [403, 'forbidden'], [404, 'not-found'], [409, 'conflict'], [422, 'invalid-request'], [429, 'rate-limit'], [500, 'server'], [503, 'server']]) {
    const repository = repo(async () => response({ message: 'private token stack' }, status));
    await assert.rejects(repository.list(), kind(expected)); await assert.rejects(repository.confirm(ORDER), kind(expected));
  }
});

test('failed/uncertain PATCH is sent once and network/timeout/non-JSON remain failures', async () => {
  let requests = 0;
  await assert.rejects(repo(async () => { requests++; throw new TypeError('private'); }).confirm(ORDER), kind('network')); assert.equal(requests, 1);
  await assert.rejects(repo(() => new Promise(() => {}), 5).confirm(ORDER), kind('timeout'));
  await assert.rejects(repo(async () => new Response('{', { headers: { 'content-type': 'application/json' } })).confirm(ORDER), kind('invalid-response'));
  await assert.rejects(repo(async () => new Response('private html', { headers: { 'content-type': 'text/html' } })).list(), kind('invalid-response'));
  await assert.rejects(new ApiOrderReceiptRepository({ request: async () => { throw new ApiError('private', 'invalid-request'); } }).list(), kind('configuration'));
});

test('cancellation before request sends nothing and cancellation after a response discards its data', async () => {
  let calls = 0; const abort = new AbortController(); abort.abort();
  await assert.rejects(repo(async () => { calls++; return response(confirmed()); }).confirm(ORDER, { signal: abort.signal }), kind('cancelled')); assert.equal(calls, 0);
  const late = new AbortController();
  await assert.rejects(new ApiOrderReceiptRepository({ request: async () => { late.abort(); return [order()]; } }).list({ signal: late.signal }), kind('cancelled'));
});
