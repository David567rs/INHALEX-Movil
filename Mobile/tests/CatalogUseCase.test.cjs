const assert = require('node:assert/strict');
const { test } = require('node:test');
const { CatalogError } = require('../src/features/catalog/domain/errors/CatalogError.ts');
const { createListCatalog } = require('../src/features/catalog/domain/useCases/listCatalog.ts');

const emptyPage = { items: [], total: 0, page: 1, limit: 20, totalPages: 1 };

test('catalog use case rejects malformed pagination before calling its repository', async () => {
  let calls = 0;
  const list = createListCatalog({ list: async () => { calls++; return emptyPage; } });
  for (const input of [null, undefined, {}, { page: 0, limit: 20 }, { page: -1, limit: 20 },
    { page: 1.5, limit: 20 }, { page: '1', limit: 20 }, { page: NaN, limit: 20 },
    { page: Number.MAX_SAFE_INTEGER + 1, limit: 20 }, { page: 1, limit: 0 },
    { page: 1, limit: 101 }, { page: 1, limit: 2.5 }, { page: 1, limit: '20' }]) {
    await assert.rejects(list(input), (error) => {
      assert.ok(error instanceof CatalogError);
      assert.equal(error.kind, 'configuration');
      return true;
    });
  }
  assert.equal(calls, 0);
});

test('catalog use case follows DTO limits: positive safe pages without a 100-page cap and limit 1 through 100', async () => {
  const requests = [];
  const list = createListCatalog({ list: async (input) => { requests.push(input); return { ...emptyPage, ...input }; } });
  for (const input of [{ page: 1, limit: 1 }, { page: 101, limit: 100 }, { page: Number.MAX_SAFE_INTEGER, limit: 20 }]) {
    const result = await list(input);
    assert.deepEqual(requests.at(-1), input);
    assert.equal(result.page, input.page);
  }
});

test('catalog use case only forwards page/limit and the same cancellation options without mutating its input', async () => {
  let sentInput;
  let sentOptions;
  const list = createListCatalog({ list: async (input, options) => { sentInput = input; sentOptions = options; return emptyPage; } });
  const input = Object.freeze({ page: 1, limit: 20, search: 'not-part-of-this-activity', category: 'not-part-of-this-activity' });
  const before = { ...input };
  const options = { signal: new AbortController().signal };
  assert.equal(await list(input, options), emptyPage);
  assert.deepEqual(sentInput, { page: 1, limit: 20 });
  assert.equal(sentOptions, options);
  assert.deepEqual(input, before);
});

test('catalog use case does not call its repository when already cancelled', async () => {
  let calls = 0;
  const list = createListCatalog({ list: async () => { calls++; return emptyPage; } });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(list({ page: 1, limit: 20 }, { signal: controller.signal }), (error) => {
    assert.ok(error instanceof CatalogError);
    assert.equal(error.kind, 'cancelled');
    return true;
  });
  assert.equal(calls, 0);
});

test('catalog use case discards late pages returned by a repository that ignores cancellation', async () => {
  let finish;
  const list = createListCatalog({ list: () => new Promise((resolve) => { finish = resolve; }) });
  const controller = new AbortController();
  const pending = list({ page: 1, limit: 20 }, { signal: controller.signal });
  controller.abort();
  finish(emptyPage);
  await assert.rejects(pending, (error) => {
    assert.ok(error instanceof CatalogError);
    assert.equal(error.kind, 'cancelled');
    return true;
  });
});

test('catalog use case preserves domain errors and does not retry failed requests automatically', async () => {
  for (const kind of ['network', 'timeout', 'cancelled', 'server', 'invalid-response', 'configuration']) {
    let calls = 0;
    const failure = new CatalogError('Safe domain error', kind);
    const list = createListCatalog({ list: async () => { calls++; throw failure; } });
    await assert.rejects(list({ page: 1, limit: 20 }), (error) => error === failure);
    assert.equal(calls, 1);
  }
});

test('catalog use case hides unexpected repository internals without retaining their cause', async () => {
  const list = createListCatalog({ list: async () => { throw new Error('private repository diagnostic'); } });
  await assert.rejects(list({ page: 1, limit: 20 }), (error) => {
    assert.ok(error instanceof CatalogError);
    assert.equal(error.kind, 'unknown');
    assert.ok(!error.message.includes('private'));
    assert.equal(error.cause, undefined);
    return true;
  });
});
