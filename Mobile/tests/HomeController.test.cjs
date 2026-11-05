const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createHomeController } = require('../src/features/home/presentation/state/createHomeController.ts');
const { CatalogError } = require('../src/features/catalog/domain/errors/CatalogError.ts');
const { ProductLinesError } = require('../src/features/productLines/domain/errors/ProductLinesError.ts');

const categories = [{ id: 'linea-verde', name: 'Línea verde', count: 12 }, { id: 'linea-floral', name: 'Floral', count: 8 }];
const product = (id = 'lavanda') => ({ id, name: id, description: 'Aroma', aromas: [], price: 60,
  currency: 'MXN', image: null, inStock: true, originalPrice: null });
const page = (items = [product()], total = items.length) => ({ items, total, page: 1, limit: 6, totalPages: Math.max(1, Math.ceil(total / 6)) });
const deferred = () => { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const tick = () => new Promise((resolve) => setImmediate(resolve));

test('home starts public first page of six with server total and independently loaded categories', async () => {
  const requests = [];
  const items = Array.from({ length: 6 }, (_, i) => product(String(i)));
  const controller = createHomeController(async (input) => { requests.push(input); return page(items, 24); }, async () => categories);
  await controller.start();
  assert.deepEqual(requests, [{ page: 1, limit: 6 }]);
  assert.equal(controller.getSnapshot().total, 24);
  assert.equal(controller.getSnapshot().products.length, 6);
  assert.deepEqual(controller.getSnapshot().categories, categories);
  assert.equal(controller.getSnapshot().status, 'ready');
  await controller.start();
  assert.equal(requests.length, 1);
  controller.stop();
});

test('draft typing is independent until submit; category and search combine, then reset removes both', async () => {
  const requests = [];
  const controller = createHomeController(async (input) => { requests.push(input); return page(); }, async () => categories);
  await controller.start();
  controller.setSearchQuery('  Lavanda  ');
  assert.equal(requests.length, 1);
  assert.equal(controller.getSnapshot().appliedQuery, '');
  await controller.submitSearch();
  assert.deepEqual(requests.at(-1), { page: 1, limit: 6, search: 'Lavanda' });
  controller.setSearchQuery('draft not submitted');
  await controller.selectCategory('linea-floral');
  assert.deepEqual(requests.at(-1), { page: 1, limit: 6, category: 'linea-floral', search: 'Lavanda' });
  assert.equal(controller.getSnapshot().searchQuery, 'draft not submitted');
  await controller.refresh();
  assert.equal(requests.at(-1).search, 'Lavanda');
  await controller.resetFilters();
  assert.deepEqual(requests.at(-1), { page: 1, limit: 6 });
  assert.equal(controller.getSnapshot().searchQuery, '');
  assert.equal(controller.getSnapshot().selectedCategoryId, 'all');
  controller.stop();
});

test('changing a filter clears old products and late success cannot overwrite the newest results', async () => {
  const old = deferred(); const latest = deferred(); const signals = [];
  const controller = createHomeController(async (input, options) => {
    signals.push(options.signal);
    if (input.search === 'old') return old.promise;
    if (input.search === 'latest') return latest.promise;
    return page([product('initial')]);
  }, async () => categories);
  await controller.start();
  controller.setSearchQuery('old'); const first = controller.submitSearch();
  assert.deepEqual(controller.getSnapshot().products, []);
  assert.equal(controller.getSnapshot().total, 0);
  assert.equal(controller.getSnapshot().status, 'loading');
  await tick();
  controller.setSearchQuery('latest'); const second = controller.submitSearch();
  await tick();
  assert.equal(signals[1].aborted, true);
  latest.resolve(page([product('newest')])); await second;
  old.resolve(page([product('obsolete')])); await first;
  assert.equal(controller.getSnapshot().products[0].id, 'newest');
  assert.equal(controller.getSnapshot().appliedQuery, 'latest');
  controller.stop();
});

test('same-filter refresh failure preserves products and total; retry restores them with the same filters', async () => {
  const refresh = deferred(); let calls = 0; const requests = [];
  const controller = createHomeController(async (input) => {
    requests.push(input); calls++;
    return calls === 3 ? refresh.promise : page([product('current')], 7);
  }, async () => categories);
  await controller.start(); await controller.selectCategory('linea-verde');
  const pending = controller.refresh();
  assert.equal(controller.getSnapshot().refreshing, true);
  assert.equal(controller.getSnapshot().products[0].id, 'current');
  refresh.reject(new CatalogError('Sin conexión', 'network')); await pending;
  assert.equal(controller.getSnapshot().status, 'ready');
  assert.equal(controller.getSnapshot().total, 7);
  assert.equal(controller.getSnapshot().errorMessage, 'Sin conexión');
  await controller.retry();
  assert.equal(controller.getSnapshot().errorMessage, null);
  assert.deepEqual(requests[2], requests[3]);
  controller.stop();
});

test('new-filter failure never keeps products from the previous query', async () => {
  const controller = createHomeController(async (input) => {
    if (input.category) throw new CatalogError('Sin conexión', 'network');
    return page();
  }, async () => categories);
  await controller.start(); await controller.selectCategory('linea-verde');
  assert.equal(controller.getSnapshot().status, 'error');
  assert.deepEqual(controller.getSnapshot().products, []);
  assert.equal(controller.getSnapshot().total, 0);
  assert.equal(controller.getSnapshot().selectedCategoryId, 'linea-verde');
  controller.stop();
});

test('empty is a successful result and remains distinct from failed initial loads', async () => {
  let fail = false;
  const controller = createHomeController(async () => {
    if (fail) throw new CatalogError('Sin conexión', 'network');
    return page([]);
  }, async () => []);
  await controller.start();
  assert.equal(controller.getSnapshot().status, 'empty');
  fail = true; await controller.refresh();
  assert.equal(controller.getSnapshot().status, 'empty');
  assert.equal(controller.getSnapshot().errorMessage, 'Sin conexión');
  controller.stop();
  const initial = createHomeController(async () => { throw new Error('private diagnostic'); }, async () => []);
  await initial.start();
  assert.equal(initial.getSnapshot().status, 'error');
  assert.ok(!initial.getSnapshot().errorMessage.includes('private'));
  initial.stop();
});

test('category errors are independent and refreshing preserves prior categories and selected category', async () => {
  let fail = false;
  const controller = createHomeController(async () => page(), async () => {
    if (fail) throw new ProductLinesError('No hay conexión para categorías', 'network');
    return categories;
  });
  await controller.start(); await controller.selectCategory('linea-verde');
  fail = true; await controller.refresh();
  assert.equal(controller.getSnapshot().status, 'ready');
  assert.deepEqual(controller.getSnapshot().categories, categories);
  assert.equal(controller.getSnapshot().selectedCategoryId, 'linea-verde');
  assert.equal(controller.getSnapshot().errorMessage, null);
  assert.equal(controller.getSnapshot().categoriesErrorMessage, 'No hay conexión para categorías');
  fail = false; await controller.retry();
  assert.equal(controller.getSnapshot().categoriesErrorMessage, null);
  controller.stop();
});

test('parallel refresh and retry share outstanding reads instead of issuing duplicate requests', async () => {
  const products = deferred(); const lines = deferred(); let productCalls = 0; let lineCalls = 0;
  const controller = createHomeController(async () => { productCalls++; return products.promise; }, async () => { lineCalls++; return lines.promise; });
  const requests = [controller.start(), controller.refresh(), controller.retry()];
  await tick();
  assert.equal(productCalls, 1); assert.equal(lineCalls, 1);
  products.resolve(page()); lines.resolve(categories);
  await Promise.all(requests);
  controller.stop();
});

test('a removed category resets to all with the applied search and ignores its late filtered response', async () => {
  let remove = false; const old = deferred(); const requests = [];
  const controller = createHomeController(async (input) => {
    requests.push(input);
    if (remove && input.category) return old.promise;
    return page([product(input.category ? 'filtered' : 'all-results')]);
  }, async () => remove ? [] : categories);
  await controller.start();
  controller.setSearchQuery('Lavanda'); await controller.submitSearch(); await controller.selectCategory('linea-verde');
  controller.setSearchQuery('Unsent draft'); remove = true;
  const pending = controller.refresh(); await tick();
  assert.equal(controller.getSnapshot().selectedCategoryId, 'all');
  assert.equal(controller.getSnapshot().appliedQuery, 'Lavanda');
  assert.equal(controller.getSnapshot().searchQuery, 'Unsent draft');
  assert.equal(controller.getSnapshot().products[0].id, 'all-results');
  assert.deepEqual(requests.at(-1), { page: 1, limit: 6, search: 'Lavanda' });
  old.resolve(page([product('removed-category')])); await pending;
  assert.equal(controller.getSnapshot().products[0].id, 'all-results');
  controller.stop();
});

test('stop aborts both reads and ignores late successes and errors; restarting loads fresh data', async () => {
  const oldProducts = deferred(); const oldLines = deferred(); const signals = []; let productCalls = 0; let lineCalls = 0;
  const controller = createHomeController(async (_input, options) => {
    signals.push(options.signal); return ++productCalls === 1 ? oldProducts.promise : page([product('new')]);
  }, async (options) => { signals.push(options.signal); return ++lineCalls === 1 ? oldLines.promise : categories; });
  let notifications = 0;
  controller.subscribe(() => { notifications++; });
  const old = controller.start(); await tick(); controller.stop();
  assert.ok(signals.every((signal) => signal.aborted));
  const count = notifications;
  oldProducts.resolve(page([product('old')])); oldLines.reject(new Error('late')); await old;
  assert.equal(notifications, count);
  await controller.start();
  assert.equal(controller.getSnapshot().products[0].id, 'new');
  assert.deepEqual(controller.getSnapshot().categories, categories);
  controller.stop();
});

test('a late failed search cannot replace a newer success or show its error', async () => {
  const old = deferred();
  const controller = createHomeController(async (input) => input.search === 'old' ? old.promise : page(), async () => categories);
  await controller.start(); controller.setSearchQuery('old'); const pending = controller.submitSearch(); await tick();
  controller.setSearchQuery('new'); await controller.submitSearch();
  old.reject(new CatalogError('Old failure', 'network')); await pending;
  assert.equal(controller.getSnapshot().appliedQuery, 'new');
  assert.equal(controller.getSnapshot().status, 'ready');
  assert.equal(controller.getSnapshot().errorMessage, null);
  controller.stop();
});

test('invalid oversized searches and unknown categories do not change active results or perform reads', async () => {
  let calls = 0;
  const controller = createHomeController(async () => { calls++; return page(); }, async () => categories);
  await controller.start();
  controller.setSearchQuery('a'.repeat(101)); await controller.submitSearch(); await controller.selectCategory('not-a-real-category');
  assert.equal(calls, 1);
  assert.equal(controller.getSnapshot().appliedQuery, '');
  assert.equal(controller.getSnapshot().products[0].id, 'lavanda');
  assert.match(controller.getSnapshot().errorMessage, /100/);
  controller.setSearchQuery('   '); await controller.submitSearch();
  assert.equal(controller.getSnapshot().errorMessage, null);
  controller.stop();
});

test('throwing or unsubscribed observers do not corrupt successful state', async () => {
  const controller = createHomeController(async () => page(), async () => categories);
  controller.subscribe(() => { throw new Error('observer'); });
  let calls = 0; const unsubscribe = controller.subscribe(() => { calls++; }); unsubscribe();
  await controller.start();
  assert.equal(calls, 0); assert.equal(controller.getSnapshot().status, 'ready');
  controller.stop();
});
