const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createProductSearchController } = require('../src/features/productSearch/presentation/state/createProductSearchController.ts');
const { ProductSearchError } = require('../src/features/productSearch/domain/errors/ProductSearchError.ts');

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
};
const product = (id, name = id) => ({ id, name, description: 'Descripción pública', aromas: [],
  price: 60, originalPrice: null, currency: 'MXN', image: null, inStock: true });
const page = (ids, number = 1, total = ids.length) => ({ items: ids.map((id) => product(id)),
  page: number, limit: 20, total, totalPages: Math.max(1, Math.ceil(total / 20)) });
const ids = (vm) => vm.getSnapshot().products.map((item) => item.id);

test('search never requests products on start, typing, clearing, whitespace submit or after stop', async () => {
  let calls = 0;
  const vm = createProductSearchController(async () => { calls++; return page(['unexpected']); });
  vm.start(); vm.start();
  vm.setQuery('Toronjil'); vm.clear(); vm.setQuery('   \t ');
  await vm.search(); await vm.retry(); await vm.loadMore();
  assert.equal(calls, 0);
  assert.equal(vm.getSnapshot().status, 'idle');
  assert.equal(vm.getSnapshot().query, '   \t ');
  assert.equal(vm.getSnapshot().term, null);
  vm.stop(); vm.setQuery('Mirra'); await vm.search();
  assert.equal(calls, 0);
});

test('an explicit search preserves the exact draft, submits trimmed words and publishes loading then real results', async () => {
  const result = deferred(); let input, signal;
  const vm = createProductSearchController(async (request, options) => {
    input = request; signal = options.signal; return result.promise;
  });
  vm.start(); vm.setQuery('  Té de limón  ');
  const request = vm.search();
  assert.deepEqual(input, { term: 'Té de limón', page: 1, limit: 20 });
  assert.ok(signal instanceof AbortSignal);
  assert.equal(vm.getSnapshot().query, '  Té de limón  ');
  assert.equal(vm.getSnapshot().term, 'Té de limón');
  assert.equal(vm.getSnapshot().status, 'loading');
  assert.deepEqual(ids(vm), []);
  result.resolve(page(['real-limon'])); await request;
  assert.equal(vm.getSnapshot().status, 'ready');
  assert.deepEqual(ids(vm), ['real-limon']);
  assert.equal(vm.getSnapshot().page, 1);
  assert.equal(vm.getSnapshot().total, 1);
  assert.equal(vm.getSnapshot().refreshing, false);
  assert.equal(vm.getSnapshot().error, null);
  vm.stop();
});

test('a successful empty search remains distinct from idle and from connection failure', async () => {
  const vm = createProductSearchController(async () => page([]));
  vm.start(); vm.setQuery('sin coincidencias'); await vm.search();
  assert.equal(vm.getSnapshot().status, 'ready');
  assert.equal(vm.getSnapshot().term, 'sin coincidencias');
  assert.equal(vm.getSnapshot().total, 0);
  assert.equal(vm.getSnapshot().page, 1);
  assert.deepEqual(ids(vm), []);
  assert.equal(vm.getSnapshot().error, null);
  vm.stop();
});

test('the latest submitted term wins even when the old transport ignores cancellation', async () => {
  const first = deferred(), second = deferred(); const signals = [];
  const vm = createProductSearchController(async ({ term }, options) => {
    signals.push(options.signal); return term === 'Toronjil' ? first.promise : second.promise;
  });
  vm.start(); vm.setQuery('Toronjil'); const oldRequest = vm.search();
  vm.setQuery('Mirra'); const newRequest = vm.search();
  assert.equal(signals[0].aborted, true);
  second.resolve(page(['mirra'])); await newRequest;
  first.resolve(page(['obsolete-toronjil'])); await oldRequest;
  assert.deepEqual(ids(vm), ['mirra']);
  assert.equal(vm.getSnapshot().term, 'Mirra');
  assert.equal(vm.getSnapshot().query, 'Mirra');
  vm.stop();
});

test('a stale request finishing cannot clear the newer in-flight request or allow duplicate submissions', async () => {
  const first = deferred(), second = deferred(); let calls = 0;
  const vm = createProductSearchController(async () => ++calls === 1 ? first.promise : second.promise);
  vm.start(); vm.setQuery('old'); const oldRequest = vm.search();
  vm.setQuery('new'); const newRequest = vm.search();
  first.resolve(page(['obsolete'])); await oldRequest;
  await vm.search(); await vm.retry();
  assert.equal(calls, 2);
  assert.equal(vm.getSnapshot().status, 'loading');
  second.resolve(page(['latest'])); await newRequest;
  assert.deepEqual(ids(vm), ['latest']);
  vm.stop();
});

test('editing the draft aborts a request and ignores its late error without publishing a notice', async () => {
  const result = deferred(); let signal;
  const vm = createProductSearchController(async (_, options) => { signal = options.signal; return result.promise; });
  vm.start(); vm.setQuery('Toronjil'); const request = vm.search();
  vm.setQuery('Toronjil nuevo');
  assert.equal(signal.aborted, true);
  result.reject(new ProductSearchError('Revisa tu conexión.', 'network')); await request;
  assert.equal(vm.getSnapshot().status, 'idle');
  assert.equal(vm.getSnapshot().query, 'Toronjil nuevo');
  assert.equal(vm.getSnapshot().term, null);
  assert.equal(vm.getSnapshot().error, null);
  assert.deepEqual(ids(vm), []);
  vm.stop();
});

test('clearing a pending search aborts it and a late success cannot restore old products or text', async () => {
  const result = deferred(); let signal;
  const vm = createProductSearchController(async (_, options) => { signal = options.signal; return result.promise; });
  vm.start(); vm.setQuery('Mirra'); const request = vm.search(); vm.clear();
  assert.equal(signal.aborted, true);
  result.resolve(page(['mirra'])); await request;
  assert.equal(vm.getSnapshot().status, 'idle');
  assert.equal(vm.getSnapshot().query, '');
  assert.equal(vm.getSnapshot().term, null);
  assert.deepEqual(ids(vm), []);
  vm.stop();
});

test('stopping aborts pending work and prevents a late error from notifying subscribers', async () => {
  const result = deferred(); let signal; let notifications = 0;
  const vm = createProductSearchController(async (_, options) => { signal = options.signal; return result.promise; });
  const unsubscribe = vm.subscribe(() => notifications++);
  vm.start(); vm.setQuery('Toronjil'); const request = vm.search();
  vm.stop(); const before = notifications;
  assert.equal(signal.aborted, true);
  assert.equal(vm.getSnapshot().status, 'idle');
  result.reject(new Error('private transport trace')); await request;
  assert.equal(notifications, before);
  assert.equal(vm.getSnapshot().error, null);
  assert.deepEqual(ids(vm), []);
  unsubscribe();
});

test('repeated submit and retry taps share one pending first page and cannot paginate before success', async () => {
  const result = deferred(); let calls = 0;
  const vm = createProductSearchController(async () => { calls++; return result.promise; });
  vm.start(); vm.setQuery('Toronjil'); const request = vm.search();
  await vm.search(); await vm.retry(); await vm.loadMore();
  assert.equal(calls, 1);
  result.resolve(page(['toronjil'])); await request;
  assert.deepEqual(ids(vm), ['toronjil']);
  vm.stop();
});

test('initial failure shows a safe domain message, does not poll and retries the same submitted term', async () => {
  const requested = []; let fail = true;
  const vm = createProductSearchController(async (input) => {
    requested.push(input);
    if (fail) throw new ProductSearchError('Revisa tu conexión.', 'network');
    return page(['mirra']);
  });
  vm.start(); vm.setQuery('  Mirra  '); await vm.search();
  assert.equal(vm.getSnapshot().status, 'error');
  assert.equal(vm.getSnapshot().error, 'Revisa tu conexión.');
  assert.deepEqual(ids(vm), []);
  assert.equal(requested.length, 1);
  fail = false; await vm.retry();
  assert.deepEqual(requested, [{ term: 'Mirra', page: 1, limit: 20 }, { term: 'Mirra', page: 1, limit: 20 }]);
  assert.equal(vm.getSnapshot().query, '  Mirra  ');
  assert.equal(vm.getSnapshot().status, 'ready');
  assert.equal(vm.getSnapshot().error, null);
  vm.stop();
});

test('refresh of the same term retains validated products during loading and failure, then replaces them on success', async () => {
  let mode = 'initial'; const refresh = deferred();
  const vm = createProductSearchController(async () => {
    if (mode === 'pending') return refresh.promise;
    return mode === 'empty' ? page([]) : page(['original']);
  });
  vm.start(); vm.setQuery('Aroma'); await vm.search();
  mode = 'pending'; const request = vm.retry();
  assert.equal(vm.getSnapshot().status, 'ready');
  assert.equal(vm.getSnapshot().refreshing, true);
  assert.deepEqual(ids(vm), ['original']);
  refresh.reject(new ProductSearchError('Servicio no disponible.', 'server')); await request;
  assert.equal(vm.getSnapshot().status, 'ready');
  assert.equal(vm.getSnapshot().refreshing, false);
  assert.equal(vm.getSnapshot().error, 'Servicio no disponible.');
  assert.deepEqual(ids(vm), ['original']);
  mode = 'empty'; await vm.search();
  assert.deepEqual(ids(vm), []);
  assert.equal(vm.getSnapshot().total, 0);
  assert.equal(vm.getSnapshot().error, null);
  vm.stop();
});

test('editing successful results clears their products, count and previous notices before a new submission', async () => {
  let fail = false; let calls = 0;
  const vm = createProductSearchController(async () => {
    calls++;
    if (fail) throw new ProductSearchError('Revisa tu conexión.', 'network');
    return page(['toronjil'], 1, 25);
  });
  vm.start(); vm.setQuery('Toronjil'); await vm.search();
  fail = true; await vm.retry(); vm.setQuery('Mirra');
  assert.equal(calls, 2);
  assert.equal(vm.getSnapshot().status, 'idle');
  assert.deepEqual(ids(vm), []);
  assert.equal(vm.getSnapshot().term, null);
  assert.equal(vm.getSnapshot().total, 0);
  assert.equal(vm.getSnapshot().page, 0);
  assert.equal(vm.getSnapshot().error, null);
  assert.equal(vm.getSnapshot().moreError, null);
  vm.stop();
});

test('pagination requests the same term once, deduplicates overlapping products and stops at the last page', async () => {
  const next = deferred(); const requested = [];
  const vm = createProductSearchController(async (input) => {
    requested.push(input);
    return input.page === 1 ? page(['a', 'b'], 1, 23) : next.promise;
  });
  vm.start(); vm.setQuery('  aroma  '); await vm.search();
  const request = vm.loadMore(); await vm.loadMore();
  assert.equal(vm.getSnapshot().loadingMore, true);
  assert.deepEqual(ids(vm), ['a', 'b']);
  assert.deepEqual(requested, [{ term: 'aroma', page: 1, limit: 20 }, { term: 'aroma', page: 2, limit: 20 }]);
  next.resolve({ ...page(['b', 'c'], 2, 23), items: [product('b', 'Updated B'), product('c')] });
  await request;
  assert.deepEqual(ids(vm), ['a', 'b', 'c']);
  assert.equal(vm.getSnapshot().products[1].name, 'Updated B');
  assert.equal(vm.getSnapshot().page, 2);
  assert.equal(vm.getSnapshot().loadingMore, false);
  await vm.loadMore(); assert.equal(requested.length, 2);
  vm.stop();
});

test('a pagination failure preserves current results and retries that same page before advancing', async () => {
  const requested = []; let fail = true;
  const vm = createProductSearchController(async (input) => {
    requested.push(input.page);
    if (input.page === 2 && fail) throw new ProductSearchError('Revisa tu conexión.', 'network');
    return page(input.page === 1 ? ['a'] : ['b'], input.page, 22);
  });
  vm.start(); vm.setQuery('aroma'); await vm.search(); await vm.loadMore();
  assert.equal(vm.getSnapshot().status, 'ready');
  assert.deepEqual(ids(vm), ['a']);
  assert.equal(vm.getSnapshot().page, 1);
  assert.equal(vm.getSnapshot().total, 22);
  assert.equal(vm.getSnapshot().moreError, 'Revisa tu conexión.');
  assert.equal(vm.getSnapshot().error, null);
  assert.equal(vm.getSnapshot().loadingMore, false);
  fail = false; await vm.loadMore();
  assert.deepEqual(requested, [1, 2, 2]);
  assert.deepEqual(ids(vm), ['a', 'b']);
  assert.equal(vm.getSnapshot().moreError, null);
  vm.stop();
});

test('refresh cancels an older page request and ignores its late result after replacing the first page', async () => {
  const next = deferred(); let moreSignal; let firstPages = 0;
  const vm = createProductSearchController(async (input, options) => {
    if (input.page === 2) { moreSignal = options.signal; return next.promise; }
    return page([++firstPages === 1 ? 'original' : 'fresh'], 1, 21);
  });
  vm.start(); vm.setQuery('aroma'); await vm.search(); const request = vm.loadMore();
  await vm.retry();
  assert.equal(moreSignal.aborted, true);
  next.resolve(page(['obsolete-next-page'], 2, 21)); await request;
  assert.deepEqual(ids(vm), ['fresh']);
  assert.equal(vm.getSnapshot().page, 1);
  assert.equal(vm.getSnapshot().loadingMore, false);
  vm.stop();
});

test('editing during pagination aborts it and prevents an old page error from appearing under the new draft', async () => {
  const next = deferred(); let moreSignal;
  const vm = createProductSearchController(async (input, options) => {
    if (input.page === 1) return page(['a'], 1, 21);
    moreSignal = options.signal; return next.promise;
  });
  vm.start(); vm.setQuery('aroma'); await vm.search(); const request = vm.loadMore();
  vm.setQuery('otra palabra');
  assert.equal(moreSignal.aborted, true);
  next.reject(new ProductSearchError('Aviso obsoleto.', 'network')); await request;
  assert.equal(vm.getSnapshot().query, 'otra palabra');
  assert.equal(vm.getSnapshot().status, 'idle');
  assert.deepEqual(ids(vm), []);
  assert.equal(vm.getSnapshot().moreError, null);
  vm.stop();
});

test('when the collection shrinks beyond the requested page, pagination restarts page one once', async () => {
  const requested = []; let initial = true;
  const vm = createProductSearchController(async (input) => {
    requested.push(input.page);
    if (input.page === 2) return page([], 2, 1);
    const result = initial ? page(['old'], 1, 21) : page(['current']);
    initial = false; return result;
  });
  vm.start(); vm.setQuery('aroma'); await vm.search(); await vm.loadMore();
  assert.deepEqual(requested, [1, 2, 1]);
  assert.deepEqual(ids(vm), ['current']);
  assert.equal(vm.getSnapshot().page, 1);
  assert.equal(vm.getSnapshot().totalPages, 1);
  assert.equal(vm.getSnapshot().total, 1);
  assert.equal(vm.getSnapshot().loadingMore, false);
  assert.equal(vm.getSnapshot().refreshing, false);
  await vm.loadMore(); assert.equal(requested.length, 3);
  vm.stop();
});

test('an unsuccessful collection-shrink restart keeps validated products and allows an explicit first-page retry', async () => {
  const requested = []; let firstPages = 0;
  const vm = createProductSearchController(async (input) => {
    requested.push(input.page);
    if (input.page === 2) return page([], 2, 0);
    firstPages++;
    if (firstPages === 2) throw new ProductSearchError('Revisa tu conexión.', 'network');
    return firstPages === 1 ? page(['previous'], 1, 21) : page(['recovered']);
  });
  vm.start(); vm.setQuery('aroma'); await vm.search(); await vm.loadMore();
  assert.deepEqual(requested, [1, 2, 1]);
  assert.deepEqual(ids(vm), ['previous']);
  assert.equal(vm.getSnapshot().status, 'ready');
  assert.equal(vm.getSnapshot().error, 'Revisa tu conexión.');
  assert.equal(vm.getSnapshot().loadingMore, false);
  await vm.retry();
  assert.deepEqual(requested, [1, 2, 1, 1]);
  assert.deepEqual(ids(vm), ['recovered']);
  assert.equal(vm.getSnapshot().error, null);
  vm.stop();
});

test('unknown initial and pagination failures never expose transport details', async () => {
  let mode = 'initial-error';
  const vm = createProductSearchController(async (input) => {
    if (mode === 'initial-error' || input.page === 2) throw new Error('mongodb://private-password internal stack trace');
    return page(['public-product'], 1, 21);
  });
  vm.start(); vm.setQuery('aroma'); await vm.search();
  assert.equal(vm.getSnapshot().error, 'No pudimos buscar los productos. Inténtalo de nuevo.');
  mode = 'ready'; await vm.retry(); await vm.loadMore();
  assert.equal(vm.getSnapshot().moreError, 'No pudimos buscar los productos. Inténtalo de nuevo.');
  assert.deepEqual(ids(vm), ['public-product']);
  assert.equal(vm.getSnapshot().error, null);
  vm.stop();
});

test('subscriptions observe draft and request transitions; unsubscribing prevents later notifications', async () => {
  const result = deferred(); const observed = [];
  const vm = createProductSearchController(async () => result.promise);
  const unsubscribe = vm.subscribe(() => observed.push(vm.getSnapshot().status));
  vm.start(); assert.deepEqual(observed, []);
  vm.setQuery('aroma'); const request = vm.search();
  assert.deepEqual(observed, ['idle', 'loading']);
  result.resolve(page(['a'])); await request;
  assert.deepEqual(observed, ['idle', 'loading', 'ready']);
  unsubscribe(); unsubscribe(); vm.clear();
  assert.deepEqual(observed, ['idle', 'loading', 'ready']);
  vm.stop();
});

test('setting an identical draft does not abort a pending search or discard its results', async () => {
  const result = deferred(); let signal; let notifications = 0;
  const vm = createProductSearchController(async (_, options) => { signal = options.signal; return result.promise; });
  vm.subscribe(() => notifications++);
  vm.start(); vm.setQuery('aroma'); const request = vm.search(); const before = notifications;
  vm.setQuery('aroma');
  assert.equal(signal.aborted, false);
  assert.equal(notifications, before);
  result.resolve(page(['a'])); await request; vm.setQuery('aroma');
  assert.deepEqual(ids(vm), ['a']);
  assert.equal(vm.getSnapshot().status, 'ready');
  vm.stop();
});

test('an effect restart makes no automatic request and a subsequent manual search ignores the abandoned result', async () => {
  const old = deferred(); let calls = 0;
  const vm = createProductSearchController(async () => ++calls === 1 ? old.promise : page(['new']));
  vm.start(); vm.setQuery('aroma'); const oldRequest = vm.search();
  vm.stop(); vm.start(); assert.equal(calls, 1);
  await vm.search(); old.resolve(page(['abandoned'])); await oldRequest;
  assert.equal(calls, 2);
  assert.deepEqual(ids(vm), ['new']);
  assert.equal(vm.getSnapshot().status, 'ready');
  assert.equal(vm.getSnapshot().refreshing, false);
  assert.equal(vm.getSnapshot().loadingMore, false);
  vm.stop();
});
