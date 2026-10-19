const assert = require('node:assert/strict');
const { test } = require('node:test');
const { ProductSearchError } = require('../src/features/productSearch/domain/errors/ProductSearchError.ts');
const { createSearchProducts, PRODUCT_SEARCH_TERM_MAX_LENGTH } = require('../src/features/productSearch/domain/useCases/searchProducts.ts');

const emptyPage = { items: [], total: 0, page: 1, limit: 20, totalPages: 1 };
const input = { term: 'eucalipto', page: 1, limit: 20 };
const isSearchError = (kind) => (error) => {
  assert.ok(error instanceof ProductSearchError);
  assert.equal(error.kind, kind);
  return true;
};

test('search requires a nonempty string before calling its repository', async () => {
  let calls = 0;
  const search = createSearchProducts({ search: async () => { calls++; return emptyPage; } });
  for (const candidate of [null, undefined, {}, { ...input, term: '' }, { ...input, term: ' \t\n ' },
    { ...input, term: null }, { ...input, term: 1 }, { ...input, term: [] }]) {
    await assert.rejects(search(candidate), isSearchError('validation'));
  }
  assert.equal(calls, 0);
});

test('search trims only outer whitespace and forwards literal accents and internal spaces without unrelated fields', async () => {
  let sentInput;
  let sentOptions;
  const search = createSearchProducts({ search: async (value, options) => {
    sentInput = value; sentOptions = options; return emptyPage;
  } });
  const original = Object.freeze({ term: '  Té  [menta].* & #  ', page: 1, limit: 20,
    category: 'ignored', token: 'must-not-forward' });
  const options = { signal: new AbortController().signal };
  assert.equal(await search(original, options), emptyPage);
  assert.deepEqual(sentInput, { term: 'Té  [menta].* & #', page: 1, limit: 20 });
  assert.equal(sentOptions, options);
  assert.equal(original.term, '  Té  [menta].* & #  ');
});

test('search accepts exactly 100 trimmed characters and rejects longer terms without silently truncating them', async () => {
  const calls = [];
  const search = createSearchProducts({ search: async (value) => { calls.push(value); return emptyPage; } });
  assert.equal(PRODUCT_SEARCH_TERM_MAX_LENGTH, 100);
  await search({ ...input, term: `  ${'é'.repeat(100)}  ` });
  assert.equal(calls[0].term, 'é'.repeat(100));
  await assert.rejects(search({ ...input, term: 'é'.repeat(101) }), isSearchError('validation'));
  assert.equal(calls.length, 1);
});

test('search rejects unsafe pagination before invoking the repository', async () => {
  let calls = 0;
  const search = createSearchProducts({ search: async () => { calls++; return emptyPage; } });
  for (const pagination of [{}, { page: 0, limit: 20 }, { page: -1, limit: 20 },
    { page: 1.5, limit: 20 }, { page: '1', limit: 20 }, { page: NaN, limit: 20 },
    { page: Infinity, limit: 20 }, { page: Number.MAX_SAFE_INTEGER + 1, limit: 20 },
    { page: 1, limit: 0 }, { page: 1, limit: 101 }, { page: 1, limit: 2.5 },
    { page: 1, limit: '20' }, { page: 1, limit: NaN }]) {
    await assert.rejects(search({ term: 'menta', ...pagination }), isSearchError('configuration'));
  }
  assert.equal(calls, 0);
});

test('search preserves server pagination boundaries without imposing a 100-page cap', async () => {
  const calls = [];
  const search = createSearchProducts({ search: async (value) => { calls.push(value); return emptyPage; } });
  for (const pagination of [{ page: 1, limit: 1 }, { page: 101, limit: 100 },
    { page: Number.MAX_SAFE_INTEGER, limit: 20 }]) {
    await search({ term: 'menta', ...pagination });
    assert.deepEqual(calls.at(-1), { term: 'menta', ...pagination });
  }
});

test('search never starts a repository request if already cancelled', async () => {
  let calls = 0;
  const search = createSearchProducts({ search: async () => { calls++; return emptyPage; } });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(search(input, { signal: controller.signal }), isSearchError('cancelled'));
  assert.equal(calls, 0);
});

test('search discards a late result from a repository that ignores cancellation', async () => {
  let finish;
  const search = createSearchProducts({ search: () => new Promise((resolve) => { finish = resolve; }) });
  const controller = new AbortController();
  const pending = search(input, { signal: controller.signal });
  controller.abort();
  finish(emptyPage);
  await assert.rejects(pending, isSearchError('cancelled'));
});

test('search treats a late failure as cancellation after the caller aborts', async () => {
  let fail;
  const search = createSearchProducts({ search: () => new Promise((_resolve, reject) => { fail = reject; }) });
  const controller = new AbortController();
  const pending = search(input, { signal: controller.signal });
  controller.abort();
  fail(new Error('private late diagnostic'));
  await assert.rejects(pending, isSearchError('cancelled'));
});

test('search preserves safe domain errors without retrying failed requests automatically', async () => {
  for (const kind of ['validation', 'network', 'timeout', 'cancelled', 'server', 'invalid-response', 'configuration', 'unknown']) {
    let calls = 0;
    const failure = new ProductSearchError('Safe search error', kind);
    const search = createSearchProducts({ search: async () => { calls++; throw failure; } });
    await assert.rejects(search(input), (error) => error === failure);
    assert.equal(calls, 1);
  }
});

test('search hides unknown repository diagnostics without retaining their cause', async () => {
  for (const failure of [new Error('private repository diagnostic'), 'private value', null]) {
    const search = createSearchProducts({ search: async () => { throw failure; } });
    await assert.rejects(search(input), (error) => {
      isSearchError('unknown')(error);
      assert.ok(!error.message.includes('private'));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});
