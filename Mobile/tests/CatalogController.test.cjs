const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createCatalogController } = require('../src/features/catalog/presentation/state/createCatalogController.ts');
const { CatalogError } = require('../src/features/catalog/domain/errors/CatalogError.ts');

const tick = () => new Promise((resolve) => setImmediate(resolve));
const product = (id) => ({ id, name: id, description: 'Aroma', aromas: [], image: null,
  price: 60, originalPrice: null, currency: 'MXN', inStock: true });
const page = (ids, number = 1, total = ids.length) => ({ items: ids.map(product),
  page: number, limit: 20, total, totalPages: Math.max(1, Math.ceil(total / 20)) });
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

test('catalog starts once without example products and distinguishes an empty successful catalog', async () => {
  const pending = deferred();
  let calls = 0;
  const vm = createCatalogController(async () => { calls++; return pending.promise; });
  assert.equal(vm.getSnapshot().status, 'loading');
  assert.deepEqual(vm.getSnapshot().products, []);
  vm.start(); vm.start();
  await vm.refresh();
  assert.equal(calls, 1);
  pending.resolve(page([])); await tick();
  assert.equal(vm.getSnapshot().status, 'ready');
  assert.equal(vm.getSnapshot().total, 0);
  vm.stop();
});

test('failed initial load exposes a safe retry and publishes recovered products without any automatic retry', async () => {
  let calls = 0;
  const vm = createCatalogController(async () => {
    if (++calls === 1) throw new CatalogError('Revisa tu conexión.', 'network');
    return page(['real-product']);
  });
  vm.start(); await tick();
  assert.equal(vm.getSnapshot().status, 'error');
  assert.equal(vm.getSnapshot().error, 'Revisa tu conexión.');
  assert.equal(calls, 1);
  await vm.refresh();
  assert.equal(vm.getSnapshot().status, 'ready');
  assert.equal(vm.getSnapshot().products[0].id, 'real-product');
  assert.equal(vm.getSnapshot().error, null);
  vm.stop();
});

test('next page is loaded once, deduplicates overlapping IDs and keeps server ordering', async () => {
  const next = deferred(); let calls = 0;
  const vm = createCatalogController(async (input) => {
    calls++; assert.equal(input.limit, 20);
    return input.page === 1 ? page(['a', 'b'], 1, 23) : next.promise;
  });
  vm.start(); await tick();
  const loading = vm.loadMore(); await vm.loadMore();
  assert.equal(vm.getSnapshot().loadingMore, true);
  assert.equal(calls, 2);
  next.resolve(page(['b', 'c'], 2, 23)); await loading;
  assert.deepEqual(vm.getSnapshot().products.map((item) => item.id), ['a', 'b', 'c']);
  assert.equal(vm.getSnapshot().page, 2);
  await vm.loadMore(); assert.equal(calls, 2);
  vm.stop();
});

test('pagination failure preserves products and retries the same page', async () => {
  const requested = []; let fail = true;
  const vm = createCatalogController(async ({ page: number }) => {
    requested.push(number);
    if (number === 2 && fail) throw new CatalogError('Servicio no disponible.', 'server');
    return page(number === 1 ? ['a'] : ['b'], number, 22);
  });
  vm.start(); await tick(); await vm.loadMore();
  assert.equal(vm.getSnapshot().status, 'ready');
  assert.equal(vm.getSnapshot().page, 1);
  assert.equal(vm.getSnapshot().products.length, 1);
  assert.equal(vm.getSnapshot().moreError, 'Servicio no disponible.');
  fail = false; await vm.loadMore();
  assert.deepEqual(requested, [1, 2, 2]);
  assert.equal(vm.getSnapshot().moreError, null);
  vm.stop();
});

test('refresh keeps the last collection on failure and replaces it completely after recovery', async () => {
  let mode = 'success';
  const vm = createCatalogController(async () => {
    if (mode === 'error') throw new Error('private server trace');
    return page(mode === 'empty' ? [] : ['a']);
  });
  vm.start(); await tick(); mode = 'error'; await vm.refresh();
  assert.equal(vm.getSnapshot().products.length, 1);
  assert.equal(vm.getSnapshot().status, 'ready');
  assert.ok(!vm.getSnapshot().error.includes('private'));
  assert.equal(vm.getSnapshot().refreshing, false);
  mode = 'empty'; await vm.refresh();
  assert.deepEqual(vm.getSnapshot().products, []);
  assert.equal(vm.getSnapshot().total, 0);
  assert.equal(vm.getSnapshot().error, null);
  vm.stop();
});

test('refresh cancels an older pagination request and ignores its late result', async () => {
  const more = deferred(); let signal; let calls = 0;
  const vm = createCatalogController(async ({ page: number }, options) => {
    calls++;
    if (number === 2) { signal = options.signal; return more.promise; }
    return page(calls === 1 ? ['old'] : ['new'], 1, 21);
  });
  vm.start(); await tick(); const pending = vm.loadMore();
  await vm.refresh(); assert.equal(signal.aborted, true);
  more.resolve(page(['late'], 2, 21)); await pending;
  assert.deepEqual(vm.getSnapshot().products.map((item) => item.id), ['new']);
  assert.equal(vm.getSnapshot().loadingMore, false);
  vm.stop();
});

test('unmount aborts a request and a remount can recover even when the old transport ignores abort', async () => {
  const first = deferred(); let signal; let calls = 0;
  const vm = createCatalogController(async (_input, options) => {
    if (++calls === 1) { signal = options.signal; return first.promise; }
    return page(['fresh']);
  });
  vm.start(); vm.stop();
  assert.equal(signal.aborted, true);
  vm.start(); await tick();
  first.resolve(page(['obsolete'])); await tick();
  assert.deepEqual(vm.getSnapshot().products.map((item) => item.id), ['fresh']);
  vm.stop();
});

test('a later page invalidated by collection changes restarts at the first page', async () => {
  const requested = [];
  const vm = createCatalogController(async ({ page: number }) => {
    requested.push(number);
    return requested.length === 1 ? page(['old'], 1, 21) : page(number === 1 ? ['current'] : [], number, 1);
  });
  vm.start(); await tick(); await vm.loadMore();
  assert.deepEqual(requested, [1, 2, 1]);
  assert.equal(vm.getSnapshot().page, 1);
  assert.deepEqual(vm.getSnapshot().products.map((item) => item.id), ['current']);
  vm.stop();
});
