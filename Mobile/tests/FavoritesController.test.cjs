const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createFavoritesController } = require('../src/features/favorites/presentation/state/createFavoritesController.ts');
const { FavoritesError } = require('../src/features/favorites/domain/errors/FavoritesError.ts');

const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
};
const product = (id) => ({ id, name: id, description: 'Aroma', aromas: [], price: 60,
  currency: 'MXN', image: null, inStock: true, originalPrice: null });
const user = (id = 'user-a') => ({ id, firstName: 'Ana', lastName: 'López', email: 'ana@example.test', phone: '5512345678' });
const authenticated = (id) => ({ status: 'authenticated', user: user(id), message: null });

function authSession(initial = authenticated()) {
  let state = initial;
  const listeners = new Set();
  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async restore() {}, async signIn() { return state.user; }, async signOut() {},
    publish(next) { state = next; [...listeners].forEach((listener) => listener()); },
    listenerCount: () => listeners.size,
  };
}

function setup(overrides = {}, session = authSession()) {
  const actions = { list: async () => [], add: async () => {}, remove: async () => {}, ...overrides };
  return { session, controller: createFavoritesController(session, actions) };
}

test('favorites waits for authenticated session and distinguishes checking, recovery error and anonymous', async () => {
  let reads = 0;
  const session = authSession({ status: 'checking', user: null, message: null });
  const { controller } = setup({ list: async () => { reads++; return []; } }, session);
  assert.equal(controller.getSnapshot().status, 'checking');
  controller.start(); await controller.refresh();
  assert.equal(reads, 0);
  session.publish({ status: 'recovery-error', user: null, message: 'Reintenta la sesión.' });
  assert.equal(controller.getSnapshot().status, 'recovery-error');
  assert.equal(controller.getSnapshot().error, 'Reintenta la sesión.');
  session.publish({ status: 'anonymous', user: null, message: null });
  await controller.add(product('a')); await controller.remove('a'); await controller.refresh();
  assert.equal(controller.getSnapshot().status, 'anonymous');
  assert.equal(reads, 0);
  session.publish(authenticated()); await tick();
  assert.equal(controller.getSnapshot().status, 'ready');
  assert.equal(controller.getSnapshot().loaded, true);
  assert.equal(reads, 1);
  controller.stop();
});

test('favorites starts one authenticated read and blocks repeated pending refresh', async () => {
  const response = deferred(); let reads = 0, signal;
  const { session, controller } = setup({ list: async (options) => {
    reads++; signal = options.signal; return response.promise;
  } });
  await controller.refresh();
  assert.equal(reads, 0);
  controller.start(); controller.start(); await controller.refresh();
  assert.equal(controller.getSnapshot().status, 'loading');
  assert.equal(controller.getSnapshot().loaded, false);
  assert.equal(session.listenerCount(), 1);
  assert.equal(reads, 1);
  assert.ok(signal instanceof AbortSignal);
  response.resolve([product('a')]); await tick();
  assert.equal(controller.getSnapshot().status, 'ready');
  assert.deepEqual(controller.getSnapshot().products.map((item) => item.id), ['a']);
  controller.stop(); assert.equal(session.listenerCount(), 0);
});

test('failed initial read exposes no sample collection and manual retry obtains a real empty list', async () => {
  let reads = 0;
  const { controller } = setup({ list: async () => {
    if (++reads === 1) throw new FavoritesError('Revisa la conexión.', 'network');
    return [];
  } });
  controller.start(); await tick();
  assert.equal(controller.getSnapshot().status, 'error');
  assert.equal(controller.getSnapshot().loaded, false);
  assert.deepEqual(controller.getSnapshot().products, []);
  assert.equal(controller.getSnapshot().error, 'Revisa la conexión.');
  await controller.add(product('a')); assert.equal(reads, 1);
  await controller.refresh();
  assert.equal(controller.getSnapshot().status, 'ready');
  assert.equal(controller.getSnapshot().loaded, true);
  assert.equal(controller.getSnapshot().error, null);
  controller.stop();
});

test('every failed subsequent read retains the confirmed list until retry succeeds', async () => {
  let failure;
  const { controller } = setup({ list: async () => {
    if (failure) throw failure;
    return [product('a')];
  } });
  controller.start(); await tick();
  for (const kind of ['network', 'timeout', 'server', 'invalid-response', 'configuration']) {
    failure = new FavoritesError('No disponible.', kind);
    await controller.refresh();
    assert.equal(controller.getSnapshot().status, 'ready');
    assert.equal(controller.getSnapshot().loaded, true);
    assert.equal(controller.getSnapshot().refreshing, false);
    assert.deepEqual(controller.getSnapshot().products.map((item) => item.id), ['a']);
    assert.equal(controller.getSnapshot().error, 'No disponible.');
  }
  failure = null; await controller.refresh();
  assert.equal(controller.getSnapshot().error, null);
  controller.stop();
});

test('unexpected read and write errors never expose technical exception details', async () => {
  let failRead = false;
  const { controller } = setup({
    list: async () => { if (failRead) throw new Error('mongodb://private host'); return []; },
    add: async () => { throw new Error('Authorization: Bearer private'); },
  });
  controller.start(); await tick();
  await controller.add(product('a'));
  assert.equal(controller.getSnapshot().mutationError, 'No pudimos actualizar tus favoritos. Inténtalo de nuevo.');
  failRead = true; await controller.refresh();
  assert.equal(controller.getSnapshot().error, 'No pudimos cargar tus favoritos. Inténtalo de nuevo.');
  controller.stop();
});

test('adding changes the shared list only after server confirmation and blocks double taps', async () => {
  const response = deferred(); let additions = 0;
  const { controller } = setup({ add: async (id, options) => {
    additions++; assert.equal(id, 'a'); assert.ok(options.signal instanceof AbortSignal); return response.promise;
  } });
  controller.start(); await tick();
  const first = controller.add(product('a'));
  await controller.add(product('a')); await controller.remove('a');
  assert.equal(additions, 1);
  assert.deepEqual(controller.getSnapshot().products, []);
  assert.deepEqual(controller.getSnapshot().pendingProductIds, ['a']);
  response.resolve(); await first;
  assert.deepEqual(controller.getSnapshot().products.map((item) => item.id), ['a']);
  assert.deepEqual(controller.getSnapshot().pendingProductIds, []);
  await controller.add(product('a')); assert.equal(additions, 1);
  controller.stop();
});

test('removing retains the confirmed product while pending and after a failure, then retry removes it', async () => {
  const response = deferred(); let removals = 0;
  const { controller } = setup({
    list: async () => [product('a')],
    remove: async () => { if (++removals === 1) return response.promise; },
  });
  controller.start(); await tick();
  const first = controller.remove('a'); await controller.remove('a');
  assert.equal(removals, 1);
  assert.equal(controller.getSnapshot().products.length, 1);
  response.reject(new FavoritesError('No se pudo quitar.', 'network')); await first;
  assert.equal(controller.getSnapshot().products.length, 1);
  assert.equal(controller.getSnapshot().mutationError, 'No se pudo quitar.');
  assert.deepEqual(controller.getSnapshot().pendingProductIds, []);
  await controller.remove('a');
  assert.deepEqual(controller.getSnapshot().products, []);
  assert.equal(controller.getSnapshot().mutationError, null);
  controller.stop();
});

test('failed addition never invents a saved heart and a later attempt can succeed', async () => {
  let additions = 0;
  const { controller } = setup({ add: async () => {
    if (++additions === 1) throw new FavoritesError('No se pudo guardar.', 'server');
  } });
  controller.start(); await tick(); await controller.add(product('a'));
  assert.deepEqual(controller.getSnapshot().products, []);
  assert.equal(controller.getSnapshot().mutationError, 'No se pudo guardar.');
  await controller.add(product('a'));
  assert.deepEqual(controller.getSnapshot().products.map((item) => item.id), ['a']);
  controller.stop();
});

test('a pending refresh blocks all writes and pending writes block reads', async () => {
  const read = deferred(), write = deferred(); let reads = 0, additions = 0, removals = 0;
  const { controller } = setup({
    list: async () => ++reads === 1 ? [product('a')] : read.promise,
    add: async () => { additions++; return write.promise; },
    remove: async () => { removals++; },
  });
  controller.start(); await tick();
  const refreshing = controller.refresh();
  assert.equal(controller.getSnapshot().refreshing, true);
  await controller.add(product('b')); await controller.remove('a');
  assert.equal(additions, 0); assert.equal(removals, 0);
  read.resolve([product('a')]); await refreshing;
  const adding = controller.add(product('b'));
  await controller.refresh(); assert.equal(reads, 2);
  write.resolve(); await adding;
  assert.deepEqual(controller.getSnapshot().products.map((item) => item.id), ['a', 'b']);
  controller.stop();
});

test('different products can be confirmed independently without losing another pending operation', async () => {
  const a = deferred(), b = deferred();
  const { controller } = setup({ add: async (id) => id === 'a' ? a.promise : b.promise });
  controller.start(); await tick();
  const addingA = controller.add(product('a')), addingB = controller.add(product('b'));
  assert.deepEqual(controller.getSnapshot().pendingProductIds, ['a', 'b']);
  b.resolve(); await addingB;
  assert.deepEqual(controller.getSnapshot().products.map((item) => item.id), ['b']);
  assert.deepEqual(controller.getSnapshot().pendingProductIds, ['a']);
  a.resolve(); await addingA;
  assert.deepEqual(controller.getSnapshot().products.map((item) => item.id), ['b', 'a']);
  controller.stop();
});

test('logout synchronously clears private products and aborts a late write confirmation', async () => {
  const response = deferred(); let signal;
  const { session, controller } = setup({ list: async () => [product('a')],
    add: async (_, options) => { signal = options.signal; return response.promise; } });
  controller.start(); await tick();
  const adding = controller.add(product('b'));
  session.publish({ status: 'anonymous', user: null, message: null });
  assert.equal(signal.aborted, true);
  assert.equal(controller.getSnapshot().status, 'anonymous');
  assert.deepEqual(controller.getSnapshot().products, []);
  assert.deepEqual(controller.getSnapshot().pendingProductIds, []);
  response.resolve(); await adding;
  assert.deepEqual(controller.getSnapshot().products, []);
  controller.stop();
});

test('switching accounts ignores an obsolete read even if its transport ignores abort', async () => {
  const first = deferred(), second = deferred(); let reads = 0, oldSignal;
  const { session, controller } = setup({ list: async (options) => {
    if (++reads === 1) { oldSignal = options.signal; return first.promise; }
    return second.promise;
  } });
  controller.start(); session.publish(authenticated('user-b'));
  assert.equal(oldSignal.aborted, true);
  assert.deepEqual(controller.getSnapshot().products, []);
  second.resolve([product('b')]); await tick();
  first.resolve([product('a')]); await tick();
  assert.deepEqual(controller.getSnapshot().products.map((item) => item.id), ['b']);
  controller.stop();
});

test('another login to the same account clears the earlier list and cancels its pending mutation', async () => {
  const pending = deferred(), nextRead = deferred(); let reads = 0, signal;
  const { session, controller } = setup({
    list: async () => ++reads === 1 ? [product('old')] : nextRead.promise,
    remove: async (_, options) => { signal = options.signal; return pending.promise; },
  });
  controller.start(); await tick();
  const removing = controller.remove('old');
  session.publish(authenticated('user-a'));
  assert.equal(signal.aborted, true);
  assert.equal(controller.getSnapshot().status, 'loading');
  assert.deepEqual(controller.getSnapshot().products, []);
  nextRead.resolve([product('current')]); await tick();
  pending.resolve(); await removing;
  assert.deepEqual(controller.getSnapshot().products.map((item) => item.id), ['current']);
  controller.stop();
});

test('401 from a read clears the collection and blocks operations until another login', async () => {
  let reads = 0, additions = 0;
  const { session, controller } = setup({
    list: async () => { if (++reads === 2) throw new FavoritesError('No autorizada.', 'unauthorized'); return [product('a')]; },
    add: async () => { additions++; },
  });
  controller.start(); await tick(); await controller.refresh();
  assert.equal(controller.getSnapshot().status, 'session-expired');
  assert.equal(controller.getSnapshot().loaded, false);
  assert.deepEqual(controller.getSnapshot().products, []);
  await controller.refresh(); await controller.add(product('b')); await controller.remove('a');
  assert.equal(reads, 2); assert.equal(additions, 0);
  controller.stop(); controller.start(); await controller.refresh();
  assert.equal(controller.getSnapshot().status, 'session-expired');
  assert.equal(reads, 2);
  session.publish(authenticated('user-a')); await tick();
  assert.equal(reads, 3);
  assert.equal(controller.getSnapshot().status, 'ready');
  controller.stop();
});

test('401 from one mutation aborts other pending writes and ignores their late confirmations', async () => {
  const first = deferred(), second = deferred(); let otherSignal;
  const { controller } = setup({ add: async (id, options) => {
    if (id === 'a') return first.promise;
    otherSignal = options.signal; return second.promise;
  } });
  controller.start(); await tick();
  const a = controller.add(product('a')), b = controller.add(product('b'));
  first.reject(new FavoritesError('No autorizada.', 'unauthorized')); await a;
  assert.equal(controller.getSnapshot().status, 'session-expired');
  assert.equal(otherSignal.aborted, true);
  second.resolve(); await b;
  assert.deepEqual(controller.getSnapshot().products, []);
  assert.deepEqual(controller.getSnapshot().pendingProductIds, []);
  controller.stop();
});

test('obsolete 401 cannot expire a newly authenticated account', async () => {
  const old = deferred(); let reads = 0;
  const { session, controller } = setup({ list: async () => ++reads === 1 ? old.promise : [product('b')] });
  controller.start(); session.publish(authenticated('user-b')); await tick();
  old.reject(new FavoritesError('No autorizada.', 'unauthorized')); await tick();
  assert.equal(controller.getSnapshot().status, 'ready');
  assert.deepEqual(controller.getSnapshot().products.map((item) => item.id), ['b']);
  controller.stop();
});

test('stop aborts in-flight reads and clears state without allowing late notifications', async () => {
  const response = deferred(); let signal, notifications = 0;
  const { controller } = setup({ list: async (options) => { signal = options.signal; return response.promise; } });
  const unsubscribe = controller.subscribe(() => notifications++);
  controller.start(); controller.stop(); const before = notifications;
  assert.equal(signal.aborted, true);
  response.resolve([product('a')]); await tick();
  assert.deepEqual(controller.getSnapshot().products, []);
  assert.equal(controller.getSnapshot().loaded, false);
  assert.equal(notifications, before);
  unsubscribe();
});

test('effect restart loads a fresh collection and never accepts an older stopped read', async () => {
  const first = deferred(), second = deferred(); let reads = 0;
  const { controller } = setup({ list: async () => ++reads === 1 ? first.promise : second.promise });
  controller.start(); controller.stop(); controller.start();
  second.resolve([product('new')]); await tick();
  first.resolve([product('old')]); await tick();
  assert.equal(reads, 2);
  assert.deepEqual(controller.getSnapshot().products.map((item) => item.id), ['new']);
  controller.stop();
});
