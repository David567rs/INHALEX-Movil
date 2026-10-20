const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createCartController } = require('../src/features/cart/presentation/state/createCartController.ts');
const { CartError } = require('../src/features/cart/domain/errors/CartError.ts');
const { createCartActions } = require('../src/features/cart/domain/useCases/cartActions.ts');

const A = '507f1f77bcf86cd799439011';
const B = '507f1f77bcf86cd799439012';
const tick = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
}
const product = (id = A) => ({ id, name: id, description: 'Aroma', aromas: ['Floral'], price: 149,
  currency: 'MXN', image: null, inStock: true, originalPrice: null });
function cart(entries = []) {
  const items = entries.map(([id, quantity]) => ({ productId: id, quantity,
    subtotal: quantity * 149, product: product(id) }));
  return { items, totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.subtotal, 0), currency: 'MXN' };
}
const authenticated = (id = 'user-a') => ({ status: 'authenticated', message: null,
  user: { id, firstName: 'Ana', lastName: 'López', email: 'ana@example.test', phone: '5512345678' } });
function authSession(initial = authenticated()) {
  let state = initial;
  const listeners = new Set();
  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    publish(next) { state = next; for (const listener of [...listeners]) listener(); },
    listenerCount: () => listeners.size,
  };
}
function setup(overrides = {}, session = authSession()) {
  const actions = { list: async () => cart(), add: async (id, quantity) => cart([[id, quantity]]),
    updateQuantity: async (id, quantity) => cart([[id, quantity]]), remove: async () => cart(), ...overrides };
  return { session, controller: createCartController(session, actions) };
}

test('cart never reads or writes during checking, recovery error or anonymous session', async () => {
  let calls = 0;
  const session = authSession({ status: 'checking', user: null, message: null });
  const { controller } = setup({ list: async () => { calls++; return cart(); },
    add: async () => { calls++; return cart(); } }, session);
  controller.start();
  await controller.refresh(); await controller.add(product());
  assert.equal(controller.getSnapshot().status, 'checking');
  session.publish({ status: 'recovery-error', user: null, message: 'Reintenta la sesión.' });
  assert.equal(controller.getSnapshot().error, 'Reintenta la sesión.');
  await controller.refresh(); await controller.add(product());
  session.publish({ status: 'anonymous', user: null, message: null });
  await controller.refresh(); await controller.add(product()); await controller.updateQuantity(A, 1); await controller.remove(A);
  assert.equal(calls, 0);
  assert.equal(controller.getSnapshot().cart, null);
  session.publish(authenticated()); await tick();
  assert.equal(calls, 1);
  assert.equal(controller.getSnapshot().status, 'ready');
  assert.equal(controller.getSnapshot().loaded, true);
  assert.deepEqual(controller.getSnapshot().cart.items, []);
  controller.stop();
});

test('start is idempotent and one initial read blocks repeated reads and mutations', async () => {
  const response = deferred(); let reads = 0, writes = 0, signal;
  const { controller, session } = setup({ list: async (options) => {
    reads++; signal = options.signal; return response.promise;
  }, add: async () => { writes++; return cart(); } });
  await controller.refresh();
  assert.equal(reads, 0);
  controller.start(); controller.start();
  await controller.refresh(); await controller.add(product());
  assert.equal(reads, 1); assert.equal(writes, 0);
  assert.equal(session.listenerCount(), 1);
  assert.ok(signal instanceof AbortSignal);
  assert.equal(controller.getSnapshot().status, 'loading');
  assert.equal(controller.getSnapshot().loaded, false);
  assert.equal(controller.getSnapshot().cart, null);
  response.resolve(cart([[A, 2]])); await tick();
  assert.equal(controller.getSnapshot().cart.totalItems, 2);
  controller.stop(); assert.equal(session.listenerCount(), 0);
});

test('failed initial read keeps null and retry GET can establish a genuine empty cart', async () => {
  let reads = 0, writes = 0;
  const { controller } = setup({ list: async () => {
    if (++reads === 1) throw new CartError('Revisa la conexión.', 'network');
    return cart();
  }, add: async () => { writes++; return cart(); } });
  controller.start(); await tick();
  assert.equal(controller.getSnapshot().status, 'error');
  assert.equal(controller.getSnapshot().loaded, false);
  assert.equal(controller.getSnapshot().cart, null);
  await controller.add(product()); assert.equal(writes, 0);
  await controller.refresh();
  assert.equal(reads, 2);
  assert.equal(controller.getSnapshot().loaded, true);
  assert.equal(controller.getSnapshot().cart.subtotal, 0);
  assert.equal(controller.getSnapshot().error, null);
  controller.stop();
});

test('failed refresh preserves confirmed cart and gates mutation until a successful GET', async () => {
  let failure, writes = 0;
  const { controller } = setup({ list: async () => {
    if (failure) throw failure;
    return cart([[A, 2]]);
  }, add: async () => { writes++; return cart(); } });
  controller.start(); await tick();
  const confirmed = controller.getSnapshot().cart;
  for (const kind of ['network', 'timeout', 'server', 'invalid-response', 'configuration']) {
    failure = new CartError('No disponible.', kind);
    await controller.refresh();
    assert.equal(controller.getSnapshot().status, 'error');
    assert.equal(controller.getSnapshot().cart, confirmed);
    assert.equal(controller.getSnapshot().loaded, true);
    assert.equal(controller.getSnapshot().refreshing, false);
    await controller.add(product(B));
  }
  assert.equal(writes, 0);
  failure = null; await controller.refresh();
  assert.equal(controller.getSnapshot().status, 'ready');
  assert.equal(controller.getSnapshot().error, null);
  controller.stop();
});

test('add uses one global lock, no optimistic values, and the complete authoritative response', async () => {
  const response = deferred(); let reads = 0, writes = 0, updates = 0, removals = 0;
  const { controller } = setup({
    list: async () => { reads++; return cart([[A, 1]]); },
    add: async (id, quantity, options) => {
      writes++; assert.equal(id, B); assert.equal(quantity, 1); assert.ok(options.signal instanceof AbortSignal);
      return response.promise;
    }, updateQuantity: async () => { updates++; return cart(); }, remove: async () => { removals++; return cart(); },
  });
  controller.start(); await tick();
  const confirmed = controller.getSnapshot().cart;
  const adding = controller.add(product(B));
  await controller.add(product(B)); await controller.add(product(A));
  await controller.updateQuantity(A, 2); await controller.remove(A); await controller.refresh();
  assert.equal(writes, 1); assert.equal(updates, 0); assert.equal(removals, 0); assert.equal(reads, 1);
  assert.equal(controller.getSnapshot().cart, confirmed);
  assert.equal(controller.getSnapshot().pendingProductId, B);
  assert.equal(controller.getSnapshot().notice, null);
  response.resolve(cart([[A, 2], [B, 3]])); await adding;
  assert.equal(controller.getSnapshot().pendingProductId, null);
  assert.equal(controller.getSnapshot().cart.totalItems, 5);
  assert.equal(controller.getSnapshot().cart.items[0].quantity, 2);
  assert.equal(controller.getSnapshot().notice, 'Producto agregado a tu bolsa.');
  controller.stop();
});

test('a pending refresh blocks every mutation even when a confirmed cart is already visible', async () => {
  const response = deferred(); let reads = 0, writes = 0;
  const change = async () => { writes++; return cart(); };
  const { controller } = setup({ list: async () => ++reads === 1 ? cart([[A, 1]]) : response.promise,
    add: change, updateQuantity: change, remove: change });
  controller.start(); await tick();
  const refreshing = controller.refresh();
  assert.equal(controller.getSnapshot().refreshing, true);
  await controller.add(product(B)); await controller.updateQuantity(A, 2); await controller.remove(A);
  assert.equal(writes, 0);
  response.resolve(cart([[A, 3]])); await refreshing;
  assert.equal(controller.getSnapshot().cart.totalItems, 3);
  assert.equal(controller.getSnapshot().refreshing, false);
  controller.stop();
});

test('quantity and removal publish only confirmed full carts and serialize distinct products', async () => {
  const update = deferred(), removal = deferred(); let updates = 0, removals = 0;
  const { controller } = setup({ list: async () => cart([[A, 2], [B, 1]]),
    updateQuantity: async (id, quantity, options) => {
      updates++; assert.equal(id, A); assert.equal(quantity, 3); assert.ok(options.signal instanceof AbortSignal);
      return update.promise;
    }, remove: async (id) => { removals++; assert.equal(id, B); return removal.promise; } });
  controller.start(); await tick();
  const updating = controller.updateQuantity(A, 3);
  await controller.remove(B); await controller.updateQuantity(B, 2);
  assert.equal(removals, 0); assert.equal(updates, 1);
  assert.equal(controller.getSnapshot().cart.items[0].quantity, 2);
  update.resolve(cart([[A, 3], [B, 2]])); await updating;
  assert.equal(controller.getSnapshot().cart.items[1].quantity, 2);
  const removing = controller.remove(B);
  await controller.updateQuantity(A, 4);
  assert.equal(controller.getSnapshot().cart.items.length, 2);
  removal.resolve(cart([[A, 3]])); await removing;
  assert.equal(controller.getSnapshot().cart.items.length, 1);
  assert.equal(controller.getSnapshot().cart.subtotal, 447);
  controller.stop();
});

test('uncertain mutation failure preserves cart and retry reconciles by GET without repeating POST', async () => {
  let remoteQuantity = 1, writes = 0, failRead = false;
  const { controller } = setup({
    list: async () => { if (failRead) throw new CartError('Sin conexión.', 'network'); return cart([[A, remoteQuantity]]); },
    add: async () => {
      writes++; remoteQuantity++;
      throw new CartError('Se perdió la respuesta.', 'timeout');
    },
  });
  controller.start(); await tick();
  const confirmed = controller.getSnapshot().cart;
  await controller.add(product());
  assert.equal(controller.getSnapshot().cart, confirmed);
  assert.equal(controller.getSnapshot().status, 'error');
  assert.equal(controller.getSnapshot().mutationError, 'Se perdió la respuesta.');
  await controller.add(product()); await controller.updateQuantity(A, 5); await controller.remove(A);
  assert.equal(writes, 1);
  failRead = true; await controller.refresh();
  await controller.add(product()); assert.equal(writes, 1);
  assert.equal(controller.getSnapshot().cart, confirmed);
  failRead = false; await controller.refresh();
  assert.equal(writes, 1);
  assert.equal(controller.getSnapshot().cart.totalItems, 2);
  assert.equal(controller.getSnapshot().status, 'ready');
  assert.equal(controller.getSnapshot().mutationError, null);
  assert.equal(controller.getSnapshot().error, null);
  controller.stop();
});

test('failed update or removal retains every confirmed item and re-enables writes only after refresh', async () => {
  for (const operation of ['updateQuantity', 'remove']) {
    let writes = 0;
    const { controller } = setup({ list: async () => cart([[A, 2], [B, 1]]), [operation]: async () => {
      writes++; throw new CartError('No se pudo confirmar.', 'server');
    } });
    controller.start(); await tick();
    const confirmed = controller.getSnapshot().cart;
    await controller[operation](A, 3);
    assert.equal(controller.getSnapshot().cart, confirmed);
    assert.equal(controller.getSnapshot().pendingProductId, null);
    assert.equal(controller.getSnapshot().status, 'error');
    await controller[operation](A, 3); assert.equal(writes, 1);
    await controller.refresh(); assert.equal(controller.getSnapshot().status, 'ready');
    controller.stop();
  }
});

test('unexpected errors never expose transport or credential details', async () => {
  let failRead = false;
  const { controller } = setup({ list: async () => {
    if (failRead) throw new Error('mongodb://private host');
    return cart();
  }, add: async () => { throw new Error('Authorization: Bearer private'); } });
  controller.start(); await tick(); await controller.add(product());
  assert.equal(controller.getSnapshot().mutationError, 'No pudimos actualizar tu bolsa. Actualiza la lista para comprobar su estado.');
  failRead = true; await controller.refresh();
  assert.equal(controller.getSnapshot().error, 'No pudimos cargar tu bolsa. Inténtalo de nuevo.');
  controller.stop();
});

test('logout synchronously clears personal data, aborts pending mutation and discards late success', async () => {
  const response = deferred(); let signal;
  const { controller, session } = setup({ list: async () => cart([[A, 1]]), add: async (_, __, options) => {
    signal = options.signal; return response.promise;
  } });
  controller.start(); await tick();
  const adding = controller.add(product(B));
  session.publish({ status: 'anonymous', user: null, message: null });
  assert.equal(signal.aborted, true);
  assert.equal(controller.getSnapshot().status, 'anonymous');
  assert.equal(controller.getSnapshot().cart, null);
  assert.equal(controller.getSnapshot().pendingProductId, null);
  assert.equal(controller.getSnapshot().notice, null);
  response.resolve(cart([[A, 1], [B, 1]])); await adding;
  assert.equal(controller.getSnapshot().cart, null);
  controller.stop();
});

test('switching accounts discards late reads even when the old transport ignores abort', async () => {
  const first = deferred(), second = deferred(); let reads = 0, signal;
  const { controller, session } = setup({ list: async (options) => {
    if (++reads === 1) { signal = options.signal; return first.promise; }
    return second.promise;
  } });
  controller.start(); session.publish(authenticated('user-b'));
  assert.equal(signal.aborted, true);
  assert.equal(controller.getSnapshot().cart, null);
  second.resolve(cart([[B, 3]])); await tick();
  first.resolve(cart([[A, 1]])); await tick();
  assert.equal(controller.getSnapshot().cart.items[0].productId, B);
  controller.stop();
});

test('a new login to the same account cancels the old mutation and starts with no stale cart', async () => {
  const write = deferred(), nextRead = deferred(); let reads = 0, signal;
  const { controller, session } = setup({ list: async () => ++reads === 1 ? cart([[A, 2]]) : nextRead.promise,
    remove: async (_, options) => { signal = options.signal; return write.promise; } });
  controller.start(); await tick();
  const removing = controller.remove(A);
  session.publish(authenticated());
  assert.equal(signal.aborted, true);
  assert.equal(controller.getSnapshot().status, 'loading');
  assert.equal(controller.getSnapshot().cart, null);
  nextRead.resolve(cart([[B, 1]])); await tick();
  write.resolve(cart()); await removing;
  assert.equal(controller.getSnapshot().cart.items[0].productId, B);
  assert.equal(controller.getSnapshot().notice, null);
  controller.stop();
});

test('401 from GET clears cart and blocks reads and writes across restart until another authentication', async () => {
  let reads = 0, writes = 0;
  const { controller, session } = setup({ list: async () => {
    if (++reads === 2) throw new CartError('No autorizada.', 'unauthorized');
    return cart([[A, 1]]);
  }, add: async () => { writes++; return cart(); } });
  controller.start(); await tick(); await controller.refresh();
  assert.equal(controller.getSnapshot().status, 'session-expired');
  assert.equal(controller.getSnapshot().cart, null);
  assert.equal(controller.getSnapshot().loaded, false);
  await controller.refresh(); await controller.add(product());
  controller.stop(); controller.start(); await controller.refresh();
  assert.equal(reads, 2); assert.equal(writes, 0);
  session.publish(authenticated()); await tick();
  assert.equal(reads, 3);
  assert.equal(controller.getSnapshot().status, 'ready');
  controller.stop();
});

test('401 from mutation clears cart and cannot be retried as another write or GET', async () => {
  let reads = 0, writes = 0;
  const { controller } = setup({ list: async () => { reads++; return cart([[A, 1]]); },
    remove: async () => { writes++; throw new CartError('No autorizada.', 'unauthorized'); } });
  controller.start(); await tick(); await controller.remove(A);
  assert.equal(controller.getSnapshot().status, 'session-expired');
  assert.equal(controller.getSnapshot().cart, null);
  assert.equal(controller.getSnapshot().pendingProductId, null);
  assert.equal(controller.getSnapshot().mutationError, null);
  await controller.remove(A); await controller.refresh();
  assert.equal(reads, 1); assert.equal(writes, 1);
  controller.stop();
});

test('an obsolete 401 cannot expire a newly authenticated account', async () => {
  const old = deferred(); let reads = 0;
  const { controller, session } = setup({ list: async () => ++reads === 1 ? old.promise : cart([[B, 1]]) });
  controller.start(); session.publish(authenticated('user-b')); await tick();
  old.reject(new CartError('No autorizada.', 'unauthorized')); await tick();
  assert.equal(controller.getSnapshot().status, 'ready');
  assert.equal(controller.getSnapshot().cart.items[0].productId, B);
  controller.stop();
});

test('stop aborts current work without late notifications and restart ignores the stopped response', async () => {
  const first = deferred(), second = deferred(); let reads = 0, signal, notifications = 0;
  const { controller } = setup({ list: async (options) => {
    if (++reads === 1) { signal = options.signal; return first.promise; }
    return second.promise;
  } });
  const unsubscribe = controller.subscribe(() => notifications++);
  controller.start(); controller.stop();
  const afterStop = notifications;
  assert.equal(signal.aborted, true);
  assert.equal(controller.getSnapshot().cart, null);
  first.resolve(cart([[A, 1]])); await tick();
  assert.equal(notifications, afterStop);
  controller.start(); second.resolve(cart([[B, 1]])); await tick();
  assert.equal(controller.getSnapshot().cart.items[0].productId, B);
  assert.equal(reads, 2);
  controller.stop(); unsubscribe();
});

test('confirmed snapshots are frozen copies and observer errors cannot corrupt success', async () => {
  const source = cart([[A, 2]]);
  const { controller } = setup({ list: async () => source });
  controller.subscribe(() => { throw new Error('Observer failure'); });
  controller.start(); await tick();
  const state = controller.getSnapshot();
  assert.equal(state.status, 'ready');
  for (const value of [state, state.cart, state.cart.items, state.cart.items[0],
    state.cart.items[0].product, state.cart.items[0].product.aromas]) assert.equal(Object.isFrozen(value), true);
  source.items[0].quantity = 25; source.items[0].product.name = 'Changed'; source.items[0].product.aromas.push('Changed');
  source.items.push(cart([[B, 1]]).items[0]); source.subtotal = 0;
  assert.equal(state.cart.items[0].quantity, 2);
  assert.equal(state.cart.items[0].product.name, A);
  assert.deepEqual(state.cart.items[0].product.aromas, ['Floral']);
  assert.equal(state.cart.items.length, 1);
  assert.equal(state.cart.subtotal, 298);
  controller.stop();
});

test('quantity limits come from real domain actions: 1 and 25 pass, invalid values never reach repository', async () => {
  const calls = [];
  const actions = createCartActions({
    list: async () => cart([[A, 1]]),
    add: async (id, quantity) => { calls.push(['add', id, quantity]); return cart([[id, quantity]]); },
    updateQuantity: async (id, quantity) => { calls.push(['update', id, quantity]); return cart([[id, quantity]]); },
    remove: async () => cart(),
  });
  const controller = createCartController(authSession(), actions);
  controller.start(); await tick();
  await controller.add(product(), 1); await controller.add(product(), 25);
  await controller.updateQuantity(A, 1); await controller.updateQuantity(A, 25);
  assert.deepEqual(calls.map(([operation, , quantity]) => [operation, quantity]),
    [['add', 1], ['add', 25], ['update', 1], ['update', 25]]);
  for (const quantity of [0, -1, 26, 1.5, NaN, Infinity]) {
    for (const operation of ['add', 'updateQuantity']) {
      const confirmed = controller.getSnapshot().cart;
      await controller[operation](operation === 'add' ? product() : A, quantity);
      assert.equal(controller.getSnapshot().status, 'error');
      assert.equal(typeof controller.getSnapshot().mutationError, 'string');
      assert.equal(controller.getSnapshot().cart, confirmed);
      assert.equal(calls.length, 4);
      await controller.refresh();
    }
  }
  controller.stop();
});

test('checkout serializes cart operations and publishes only a current confirmed cart', async () => {
  let reads = 0, writes = 0;
  const { controller } = setup({ list: async () => { reads++; return cart([[A, 2]]); },
    add: async () => { writes++; return cart([[A, 3]]); },
    remove: async () => { writes++; return cart(); },
    updateQuantity: async () => { writes++; return cart([[A, 1]]); } });
  controller.start(); await tick();
  const lease = controller.acquireCheckout();
  assert.ok(lease && lease.isCurrent());
  assert.equal(controller.getSnapshot().checkoutLocked, true);
  assert.equal(controller.acquireCheckout(), null);
  await controller.refresh(); await controller.add(product()); await controller.remove(A); await controller.updateQuantity(A, 1);
  assert.equal(reads, 1); assert.equal(writes, 0);
  const confirmed = cart(); lease.release(confirmed);
  assert.equal(lease.isCurrent(), false);
  assert.equal(controller.getSnapshot().checkoutLocked, false);
  assert.equal(controller.getSnapshot().cart.totalItems, 0);
  lease.release(cart([[A, 9]]));
  assert.equal(controller.getSnapshot().cart.totalItems, 0);
  controller.stop();
});

test('a checkout lease cannot overwrite a new account or survive stop', async () => {
  const { controller, session } = setup({ list: async () => cart([[A, 2]]) });
  controller.start(); await tick();
  const old = controller.acquireCheckout(); assert.ok(old);
  session.publish({ status: 'anonymous', user: null, message: null });
  assert.equal(old.isCurrent(), false); old.release(cart([[A, 9]]));
  assert.equal(controller.getSnapshot().cart, null);
  session.publish(authenticated('user-b')); await tick();
  const current = controller.acquireCheckout(); assert.ok(current);
  old.release(cart()); assert.equal(current.isCurrent(), true);
  controller.stop(); assert.equal(current.isCurrent(), false);
  current.release(cart()); assert.equal(controller.getSnapshot().cart, null);
});

test('checkout cannot acquire while cart I/O is pending or the session is expired', async () => {
  const pending = deferred();
  const { controller } = setup({ list: async () => pending.promise });
  controller.start(); assert.equal(controller.acquireCheckout(), null);
  pending.reject(new CartError('Inicia sesión.', 'unauthorized')); await tick();
  assert.equal(controller.acquireCheckout(), null); controller.stop();
});
