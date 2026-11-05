const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createReviewsActions, normalizeReviewInput, validateReviewDraft } = require('../src/features/reviews/domain/useCases/reviewsActions.ts');
const { ReviewsError } = require('../src/features/reviews/domain/errors/ReviewsError.ts');
const PRODUCT = '507f1f77bcf86cd799439011', ORDER = '507f1f77bcf86cd799439012';
const input = (changes = {}) => ({ productId: PRODUCT, orderId: ORDER, rating: 5, comment: 'Muy buen aroma.', ...changes });
const kind = (expected) => (error) => error instanceof ReviewsError && error.kind === expected;

test('review drafts require integer stars and four trimmed characters without transforming the rating', () => {
  for (const rating of [0, 6, 1.5, NaN, Infinity, '5', null, undefined]) assert.ok(validateReviewDraft(rating, 'Buen aroma').rating);
  for (const comment of ['', '   ', 'abc', '  abc  ', 'a'.repeat(701), 'Hola\u0000', null, undefined, {}]) assert.ok(validateReviewDraft(5, comment).comment);
  for (const rating of [1, 2, 3, 4, 5]) assert.deepEqual(validateReviewDraft(rating, ' Bien\naromático '), {});
  assert.deepEqual(validateReviewDraft(5, 'a'.repeat(700)), {});
  assert.deepEqual(validateReviewDraft(undefined, ''), { rating: 'Selecciona una calificación de 1 a 5 estrellas.', comment: 'Escribe un comentario de 4 a 700 caracteres.' });
});

test('publication normalizes IDs and comment while stripping all caller identity fields', async () => {
  let received;
  const actions = createReviewsActions({ list: async () => ({ pending: [], completed: [] }), publish: async (value) => { received = value; return 'result'; } });
  assert.equal(await actions.publish(input({ productId: PRODUCT.toUpperCase(), comment: '  Gran aroma\nLo recomiendo.  ', userId: 'private', userEmail: 'private', status: 'published' })), 'result');
  assert.deepEqual(received, input({ comment: 'Gran aroma\nLo recomiendo.' }));
  assert.ok(Object.isFrozen(received));
});

test('invalid target and content never reach the repository', async () => {
  let calls = 0;
  const actions = createReviewsActions({ list: async () => [], publish: async () => { calls++; } });
  for (const value of [null, [], {}, input({ productId: '../other' }), input({ orderId: ' ' }), input({ rating: '5' }), input({ comment: '  ' })]) {
    await assert.rejects(actions.publish(value), kind('invalid-request'));
  }
  assert.equal(calls, 0); assert.deepEqual(normalizeReviewInput(input()), input());
});

test('read and explicit publish pass cancellation and never retry rejected writes automatically', async () => {
  const abort = new AbortController(); let calls = 0;
  const actions = createReviewsActions({ list: async (options) => { assert.equal(options.signal, abort.signal); return { pending: [], completed: [] }; },
    publish: async () => { calls++; throw new ReviewsError('Sin conexión.', 'network'); } });
  assert.deepEqual(await actions.list({ signal: abort.signal }), { pending: [], completed: [] });
  await assert.rejects(actions.publish(input()), kind('network')); assert.equal(calls, 1);
  abort.abort(); await assert.rejects(actions.publish(input(), { signal: abort.signal }), kind('cancelled')); assert.equal(calls, 1);
});

test('late result after cancellation is discarded and unexpected failures are sanitized', async () => {
  const abort = new AbortController();
  const actions = createReviewsActions({ list: async () => { abort.abort(); return { pending: [], completed: [] }; }, publish: async () => { throw new Error('private backend token'); } });
  await assert.rejects(actions.list({ signal: abort.signal }), kind('cancelled'));
  await assert.rejects(actions.publish(input()), (error) => { assert.equal(error.kind, 'unknown'); assert.doesNotMatch(error.message, /private|token/); assert.equal(error.cause, undefined); return true; });
});
