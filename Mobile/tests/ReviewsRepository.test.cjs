const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiError } = require('../src/core/network/ApiError.ts');
const { ApiReviewsRepository } = require('../src/features/reviews/data/repositories/ApiReviewsRepository.ts');
const { ReviewsError } = require('../src/features/reviews/domain/errors/ReviewsError.ts');
const PRODUCT = '507f1f77bcf86cd799439011', ORDER = '507f1f77bcf86cd799439012', REVIEW = '507f1f77bcf86cd799439013', OTHER = '507f1f77bcf86cd799439014';
const DATE = '2026-11-04T12:00:00.000Z';
const input = (changes = {}) => ({ productId: PRODUCT, orderId: ORDER, rating: 5, comment: 'Buen aroma.', ...changes });
const review = (changes = {}) => ({ id: REVIEW, ...input(), userName: 'Demo', productName: 'Lavanda', productSlug: 'lavanda', productImage: 'https://example.com/lavanda.png', orderReference: 'INX-001', status: 'published', createdAt: DATE, ...changes });
const product = (changes = {}) => ({ orderId: ORDER, orderReference: 'INX-001', productId: PRODUCT, productName: 'Lavanda', productSlug: 'lavanda', productImage: 'https://example.com/lavanda.png', presentation: '10 ml', purchasedAt: DATE, ...changes });
const collection = (changes = {}) => ({ pending: [product()], completed: [], ...changes });
const response = (value, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
const repo = (fetch, timeout = 1000) => new ApiReviewsRepository(new HttpClient({ baseUrl: 'https://api.example/api', fetch, getAccessToken: () => 'private.jwt.token', requestTimeoutMs: timeout }));
const kind = (expected) => (error) => { assert.ok(error instanceof ReviewsError); assert.equal(error.kind, expected); assert.doesNotMatch(error.message, /private|token|stack/); assert.equal(error.cause, undefined); return true; };

test('eligible GET uses private Bearer, omits caller identity, strips metadata and returns immutable models', async () => {
  let request;
  const result = await repo(async (url, options) => { request = { url, options }; return response(collection({ userEmail: 'private', pending: [product({ userId: 'private', metadata: { token: 'private' } })] })); }).list({ userId: 'private', status: 'completed' });
  assert.equal(request.url, 'https://api.example/api/reviews/me/eligible'); assert.equal(request.options.method, 'GET');
  assert.equal(request.options.headers.Authorization, 'Bearer private.jwt.token'); assert.equal(request.options.body, undefined);
  assert.deepEqual(result, { pending: [{ ...product(), review: null }], completed: [] });
  assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result.pending)); assert.ok(Object.isFrozen(result.pending[0]));
  assert.equal(JSON.stringify(result).includes('private'), false);
});

test('submitted list preserves hidden reviews and original review order when a product was repurchased', async () => {
  const result = await repo(async () => response(collection({ pending: [], completed: [product({ review: review({ orderId: OTHER, status: 'hidden' }) })] }))).list();
  assert.equal(result.completed[0].review.status, 'hidden'); assert.equal(result.completed[0].orderId, ORDER); assert.equal(result.completed[0].review.orderId, OTHER);
  assert.ok(Object.isFrozen(result.completed[0].review));
});

test('optional dates remain unknown and unsafe image URLs use the shared image fallback', async () => {
  const result = await repo(async () => response(collection({ pending: [], completed: [product({ purchasedAt: undefined, productImage: 'javascript:private', review: review({ createdAt: undefined, productImage: 'data:private' }) })] }))).list();
  assert.equal(result.completed[0].purchasedAt, null); assert.equal(result.completed[0].review.createdAt, null);
  assert.equal(result.completed[0].productImage, null); assert.equal(result.completed[0].review.productImage, null);
});

test('malformed collections, contradictory categories and duplicate normalized product identities are rejected', async () => {
  for (const payload of [null, [], {}, collection({ pending: null }), collection({ completed: [product()] }), collection({ pending: [product({ review: review() })] }),
    collection({ pending: [product(), product({ productId: PRODUCT.toUpperCase() })] }), collection({ completed: [product({ review: review() })] }),
    collection({ pending: [], completed: [product({ review: review({ productId: OTHER }) })] }), collection({ pending: Array(601).fill(product()) })]) {
    await assert.rejects(repo(async () => response(payload)).list(), kind('invalid-response'));
  }
  assert.deepEqual(await repo(async () => response({ pending: [], completed: [] })).list(), { pending: [], completed: [] });
});

test('malformed review fields and impossible dates are rejected without exposing response content', async () => {
  for (const changes of [{ id: '../private' }, { rating: 0 }, { rating: 6 }, { rating: 2.5 }, { rating: '5' }, { comment: 'abc' }, { comment: 'a'.repeat(701) },
    { status: 'approved' }, { userName: '' }, { productName: ' private ' }, { createdAt: '2026-02-30T12:00:00.000Z' }, { createdAt: '2026-11-04' }]) {
    await assert.rejects(repo(async () => response(collection({ pending: [], completed: [product({ review: review(changes) })] }))).list(), kind('invalid-response'));
  }
});

test('POST publishes exactly normalized content, no account fields or unsupported idempotency header', async () => {
  let request;
  const result = await repo(async (url, options) => { request = { url, options }; return response(review({ userEmail: 'private', moderation: 'private' }), 201); })
    .publish(input({ productId: PRODUCT.toUpperCase(), comment: '  Buen aroma.  ', userId: 'private', status: 'hidden' }));
  assert.equal(request.url, 'https://api.example/api/reviews'); assert.equal(request.options.method, 'POST');
  assert.deepEqual(JSON.parse(request.options.body), input()); assert.equal(request.options.headers.Authorization, 'Bearer private.jwt.token');
  assert.equal(request.options.headers['Idempotency-Key'], undefined); assert.deepEqual(result, review());
});

test('successful POST must confirm the exact selected product, order, rating and trimmed comment', async () => {
  for (const changes of [{ productId: OTHER }, { orderId: OTHER }, { rating: 4 }, { comment: 'Otro comentario' }, { status: 'hidden' }]) {
    await assert.rejects(repo(async () => response(review(changes), 201)).publish(input()), kind('invalid-response'));
  }
});

test('invalid publish inputs do not send HTTP even when repository is called directly', async () => {
  let calls = 0; const repository = repo(async () => { calls++; return response(review(), 201); });
  for (const value of [null, input({ productId: '../other' }), input({ orderId: '' }), input({ rating: 0 }), input({ comment: '   ' })]) await assert.rejects(repository.publish(value), kind('invalid-request'));
  assert.equal(calls, 0);
});

test('HTTP statuses are safe distinct domain errors for read and write; duplicate remains a conflict', async () => {
  for (const [status, expected] of [[400, 'invalid-request'], [401, 'unauthorized'], [403, 'forbidden'], [404, 'not-found'], [409, 'conflict'], [422, 'invalid-request'], [429, 'rate-limit'], [500, 'server'], [503, 'server']]) {
    const repository = repo(async () => response({ message: 'private token stack' }, status));
    await assert.rejects(repository.list(), kind(expected)); await assert.rejects(repository.publish(input()), kind(expected));
  }
});

test('network failure, timeout and malformed JSON preserve failure meaning without retrying POST', async () => {
  let requests = 0;
  await assert.rejects(repo(async () => { requests++; throw new TypeError('private'); }).publish(input()), kind('network')); assert.equal(requests, 1);
  await assert.rejects(repo(() => new Promise(() => {}), 5).publish(input()), kind('timeout'));
  await assert.rejects(repo(async () => new Response('{', { status: 201, headers: { 'content-type': 'application/json' } })).publish(input()), kind('invalid-response'));
  await assert.rejects(new ApiReviewsRepository({ request: async () => { throw new ApiError('private', 'invalid-request'); } }).list(), kind('configuration'));
});

test('pre-cancelled write sends nothing and cancellation after response discards the data', async () => {
  let calls = 0; const abort = new AbortController(); abort.abort();
  await assert.rejects(repo(async () => { calls++; return response(review()); }).publish(input(), { signal: abort.signal }), kind('cancelled')); assert.equal(calls, 0);
  const late = new AbortController();
  await assert.rejects(new ApiReviewsRepository({ request: async () => { late.abort(); return collection(); } }).list({ signal: late.signal }), kind('cancelled'));
});
