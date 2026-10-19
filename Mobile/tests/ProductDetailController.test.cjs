const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createProductDetailController } = require('../src/features/productDetail/presentation/state/createProductDetailController.ts');
const { ProductDetailError } = require('../src/features/productDetail/domain/errors/ProductDetailError.ts');

const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const product = (id, name = id) => ({ id, name, description: 'Descripción pública', price: 60,
  originalPrice: null, currency: 'MXN', image: null, inStock: true, aromas: [],
  longDescription: null, benefits: [], presentation: null, origin: null });

test('detail loads only the selected ID, starts once and blocks repeated retry taps while pending', async () => {
  const pending = deferred(); let calls = 0;
  const vm = createProductDetailController('toronjil', async (id, options) => {
    calls++; assert.equal(id, 'toronjil'); assert.ok(options.signal instanceof AbortSignal);
    return pending.promise;
  });
  assert.equal(vm.getSnapshot().status, 'loading');
  assert.equal(vm.getSnapshot().product, null);
  vm.start(); vm.start(); await vm.refresh();
  assert.equal(calls, 1);
  pending.resolve(product('id-toronjil')); await tick();
  assert.equal(vm.getSnapshot().status, 'ready');
  assert.equal(vm.getSnapshot().product.id, 'id-toronjil');
  vm.stop();
});

test('initial network error shows no example data and manual retry recovers without automatic polling', async () => {
  let calls = 0;
  const vm = createProductDetailController('mirra', async () => {
    if (++calls === 1) throw new ProductDetailError('Revisa tu conexión.', 'network');
    return product('mirra');
  });
  vm.start(); await tick();
  assert.equal(vm.getSnapshot().status, 'error');
  assert.equal(vm.getSnapshot().product, null);
  assert.equal(vm.getSnapshot().error, 'Revisa tu conexión.');
  assert.equal(calls, 1);
  await vm.refresh();
  assert.equal(calls, 2);
  assert.equal(vm.getSnapshot().product.id, 'mirra');
  assert.equal(vm.getSnapshot().error, null);
  vm.stop();
});

test('refresh preserves the last validated detail on network failure and updates it after recovery', async () => {
  let mode = 'first';
  const vm = createProductDetailController('mirra', async () => {
    if (mode === 'offline') throw new ProductDetailError('Revisa tu conexión.', 'network');
    return product('mirra', mode);
  });
  vm.start(); await tick(); mode = 'offline'; await vm.refresh();
  assert.equal(vm.getSnapshot().status, 'ready');
  assert.equal(vm.getSnapshot().product.name, 'first');
  assert.equal(vm.getSnapshot().error, 'Revisa tu conexión.');
  assert.equal(vm.getSnapshot().refreshing, false);
  mode = 'updated'; await vm.refresh();
  assert.equal(vm.getSnapshot().product.name, 'updated');
  assert.equal(vm.getSnapshot().error, null);
  vm.stop();
});

test('404 removes a formerly available product instead of presenting it as current', async () => {
  let exists = true;
  const vm = createProductDetailController('mirra', async () => {
    if (!exists) throw new ProductDetailError('El producto ya no está disponible.', 'not-found');
    return product('mirra');
  });
  vm.start(); await tick(); exists = false; await vm.refresh();
  assert.equal(vm.getSnapshot().status, 'not-found');
  assert.equal(vm.getSnapshot().product, null);
  assert.equal(vm.getSnapshot().refreshing, false);
  vm.stop();
});

test('malformed response clears previous content; unknown errors never expose transport details', async () => {
  let error;
  const vm = createProductDetailController('mirra', async () => {
    if (error) throw error;
    return product('mirra');
  });
  vm.start(); await tick();
  error = new ProductDetailError('Respuesta no válida.', 'invalid-response'); await vm.refresh();
  assert.equal(vm.getSnapshot().status, 'error');
  assert.equal(vm.getSnapshot().product, null);
  error = new Error('mongodb://private-database stack trace'); await vm.refresh();
  assert.equal(vm.getSnapshot().error, 'No pudimos cargar el producto. Inténtalo de nuevo.');
  vm.stop();
});

test('leaving aborts the request and a late result cannot notify or replace state', async () => {
  const pending = deferred(); let signal; let notifications = 0;
  const vm = createProductDetailController('toronjil', async (_, options) => {
    signal = options.signal; return pending.promise;
  });
  const unsubscribe = vm.subscribe(() => notifications++);
  vm.start(); vm.stop(); const before = notifications;
  assert.equal(signal.aborted, true);
  pending.resolve(product('toronjil')); await tick();
  assert.equal(vm.getSnapshot().product, null);
  assert.equal(notifications, before);
  unsubscribe();
});

test('strict effect restart ignores the earlier request even when its transport ignores abort', async () => {
  const first = deferred(), second = deferred(); let calls = 0;
  const vm = createProductDetailController('toronjil', async () => ++calls === 1 ? first.promise : second.promise);
  vm.start(); vm.stop(); vm.start();
  second.resolve(product('toronjil', 'new')); await tick();
  first.resolve(product('toronjil', 'old')); await tick();
  assert.equal(vm.getSnapshot().product.name, 'new');
  assert.equal(vm.getSnapshot().refreshing, false);
  vm.stop();
});

test('a pending old route cannot overwrite a different product route', async () => {
  const pending = deferred();
  const oldRoute = createProductDetailController('toronjil', async () => pending.promise);
  const newRoute = createProductDetailController('mirra', async () => product('mirra'));
  oldRoute.start(); oldRoute.stop(); newRoute.start(); await tick();
  pending.resolve(product('toronjil')); await tick();
  assert.equal(newRoute.getSnapshot().product.id, 'mirra');
  assert.equal(oldRoute.getSnapshot().product, null);
  newRoute.stop();
});
