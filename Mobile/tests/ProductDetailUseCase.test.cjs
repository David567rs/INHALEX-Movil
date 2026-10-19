const assert = require('node:assert/strict');
const { test } = require('node:test');
const { ProductDetailError } = require('../src/features/productDetail/domain/errors/ProductDetailError.ts');
const { createGetProductDetail } = require('../src/features/productDetail/domain/useCases/getProductDetail.ts');

const id = '507f1f77bcf86cd799439011';
const product = { id, name: 'Eucalipto', description: 'Un aroma fresco y herbal.', aromas: [],
  price: 60, currency: 'MXN', image: null, inStock: true, originalPrice: null,
  longDescription: null, benefits: [], presentation: null, origin: null };
const isDetailError = (kind) => (error) => {
  assert.ok(error instanceof ProductDetailError); assert.equal(error.kind, kind); return true;
};

test('invalid route values return not-found without reaching the repository', async () => {
  let calls = 0;
  const get = createGetProductDetail({ getById: async () => { calls++; return product; } });
  for (const value of [undefined, null, [], {}, 5, '', ' ', ' eucalipto ', 'x/y', '../x', 'https://example.com',
    'x?query=1', 'x#anchor', 'x%2fy', 'x_y', 'x.y', '-', '--', 'árbol', 'x\ny', 'a'.repeat(161)]) {
    await assert.rejects(get(value), isDetailError('not-found'));
  }
  assert.equal(calls, 0);
});

test('ObjectIds and backend slugs up to 160 characters preserve route identity and cancellation options', async () => {
  const calls = [];
  const get = createGetProductDetail({ getById: async (value, options) => { calls.push({ value, options }); return product; } });
  const options = { signal: new AbortController().signal };
  for (const value of [id, id.toUpperCase(), 'eucalipto', 'Eucalipto-2', '-eucalipto', 'eucalipto-', 'euca--lipto', 'a', 'a'.repeat(160)]) {
    assert.equal(await get(value, options), product);
    assert.equal(calls.at(-1).value, value); assert.equal(calls.at(-1).options, options);
  }
});

test('an already cancelled lookup performs no repository request', async () => {
  let calls = 0;
  const get = createGetProductDetail({ getById: async () => { calls++; return product; } });
  const controller = new AbortController(); controller.abort();
  await assert.rejects(get(id, { signal: controller.signal }), isDetailError('cancelled'));
  assert.equal(calls, 0);
});

test('late success and failure are discarded if the repository ignores cancellation', async () => {
  for (const failure of [false, true]) {
    let finish;
    const get = createGetProductDetail({ getById: () => new Promise((resolve, reject) => {
      finish = () => failure ? reject(new Error('private late failure')) : resolve(product);
    }) });
    const controller = new AbortController();
    const pending = get(id, { signal: controller.signal });
    controller.abort(); finish();
    await assert.rejects(pending, isDetailError('cancelled'));
  }
});

test('domain failures are preserved and callers can retry explicitly without an automatic second lookup', async () => {
  for (const kind of ['configuration', 'network', 'timeout', 'not-found', 'invalid-response', 'server', 'cancelled']) {
    let calls = 0;
    const failure = new ProductDetailError('Safe domain message', kind);
    const get = createGetProductDetail({ getById: async () => { if (++calls === 1) throw failure; return product; } });
    await assert.rejects(get(id), (error) => error === failure); assert.equal(calls, 1);
    assert.equal(await get(id), product); assert.equal(calls, 2);
  }
});

test('unexpected repository errors are replaced by safe domain errors without retaining diagnostics', async () => {
  const get = createGetProductDetail({ getById: async () => { throw new Error('private repository internals'); } });
  await assert.rejects(get(id), (error) => {
    isDetailError('server')(error); assert.ok(!error.message.includes('private')); assert.equal(error.cause, undefined); return true;
  });
});
