const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createOrderReceiptController } = require('../src/features/orderReceipt/presentation/state/createOrderReceiptController.ts');
const { OrderReceiptError } = require('../src/features/orderReceipt/domain/errors/OrderReceiptError.ts');

const A = '000000000000000000000001', B = '000000000000000000000002';
const USER = '111111111111111111111111';
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const authenticated = (id = USER) => ({ status: 'authenticated', user: { id, firstName: 'Ana', lastName: 'López', email: 'ana@example.test', phone: '5512345678' }, message: null });
const order = (id = A, changes = {}) => ({
  id, reference: `INH-${id.slice(-4)}`, status: 'completed', receiptStatus: 'pending', completedAt: '2026-11-08T12:00:00.000Z', confirmedAt: null,
  totalItems: 2, subtotal: 120, currency: 'MXN',
  items: [{ id: B, productId: B, name: 'Lavanda', imageUrl: null, presentation: 'Natural', quantity: 2, unitPrice: 60, subtotal: 120 }],
  ...changes,
});
const confirmedOrder = (id = A, changes = {}) => order(id, { receiptStatus: 'confirmed', confirmedAt: '2026-11-08T13:00:00.000Z', ...changes });
function session(initial = authenticated()) {
  let state = initial; const listeners = new Set();
  return { getSnapshot: () => state, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async restore() {}, async signIn() { return state.user; }, async signOut() {},
    publish(next) { state = next; this.notify(); }, silent(next) { state = next; }, notify() { [...listeners].forEach((listener) => listener()); },
    listenerCount: () => listeners.size };
}
function setup(overrides = {}, auth = session()) {
  const actions = { list: async () => [order()], confirm: async (id) => confirmedOrder(id), ...overrides };
  return { auth, actions, controller: createOrderReceiptController(auth, actions) };
}

test('receipt waits for verified authentication and distinguishes unread from a successful empty collection', async () => {
  let reads = 0, writes = 0;
  const auth = session({ status: 'checking', user: null, message: null });
  const { controller } = setup({ list: async () => { reads++; return []; }, confirm: async () => { writes++; } }, auth);
  controller.start(); await controller.refresh(); controller.selectOrder(A); await controller.confirmReceipt();
  assert.equal(controller.getSnapshot().status, 'checking'); assert.equal(controller.getSnapshot().orders, null);
  auth.publish({ status: 'recovery-error', user: null, message: 'Reintenta tu sesión.' });
  assert.equal(controller.getSnapshot().status, 'recovery-error'); assert.equal(controller.getSnapshot().error, 'Reintenta tu sesión.');
  auth.publish({ status: 'anonymous', user: null, message: null }); await controller.refresh();
  assert.equal(reads, 0); assert.equal(writes, 0);
  auth.publish(authenticated()); await tick(); assert.equal(reads, 1);
  assert.deepEqual(controller.getSnapshot().orders, []); assert.equal(controller.getSnapshot().status, 'ready'); controller.stop();
});

test('start is idempotent; parallel refresh calls share one request and signal', async () => {
  let reads = 0, signal; const response = deferred();
  const { controller, auth } = setup({ list: async (options) => { reads++; signal = options.signal; return response.promise; } });
  await controller.refresh(); controller.start(); controller.start(); await controller.refresh();
  assert.equal(reads, 1); assert.equal(auth.listenerCount(), 1); assert.ok(signal instanceof AbortSignal);
  assert.equal(controller.getSnapshot().status, 'loading'); response.resolve([order()]); await tick();
  assert.equal(controller.getSnapshot().status, 'ready'); assert.equal(controller.getSnapshot().selectedOrderId, null); controller.stop();
});

test('an initial GET failure never fabricates empty; explicit retry establishes empty', async () => {
  let reads = 0; const { controller } = setup({ list: async () => {
    if (++reads === 1) throw new OrderReceiptError('Sin conexión.', 'network'); return [];
  } }); controller.start(); await tick();
  assert.equal(controller.getSnapshot().status, 'error'); assert.equal(controller.getSnapshot().orders, null);
  await controller.refresh(); assert.equal(controller.getSnapshot().status, 'ready');
  assert.deepEqual(controller.getSnapshot().orders, []); assert.equal(controller.getSnapshot().requiresRefresh, false); controller.stop();
});

test('selection only accepts returned IDs; confirmed and issue orders are readable but never confirmed again', async () => {
  let writes = 0;
  for (const receiptStatus of ['confirmed', 'issue_reported']) {
    const { controller } = setup({ list: async () => [order(A, { receiptStatus })], confirm: async () => { writes++; } });
    controller.start(); await tick(); controller.selectOrder(B); assert.equal(controller.getSnapshot().selectedOrderId, null);
    controller.selectOrder(A); assert.equal(controller.getSnapshot().selectedOrderId, A);
    await controller.confirmReceipt(); assert.equal(writes, 0); controller.stop();
  }
});

test('pending receipt on a non-completed order cannot be submitted even by a direct controller call', async () => {
  let writes = 0; const { controller } = setup({ list: async () => [order(A, { status: 'cancelled' })], confirm: async () => { writes++; } });
  controller.start(); await tick(); controller.selectOrder(A); await controller.confirmReceipt();
  assert.equal(writes, 0); controller.stop();
});

test('one successful confirmation updates the selected receipt without changing the order status or other orders', async () => {
  let sent, writes = 0;
  const { controller } = setup({ list: async () => [order(), order(B)], confirm: async (id, options) => {
    writes++; sent = id; assert.ok(options.signal instanceof AbortSignal); return confirmedOrder(id);
  } }); controller.start(); await tick(); controller.selectOrder(A); await controller.confirmReceipt();
  const result = controller.getSnapshot(); assert.equal(sent, A); assert.equal(writes, 1);
  assert.equal(result.orders[0].receiptStatus, 'confirmed'); assert.equal(result.orders[0].status, 'completed');
  assert.equal(result.orders[1].receiptStatus, 'pending'); assert.equal(result.selectedOrderId, A);
  assert.equal(result.confirming, false); assert.match(result.notice, /Confirmaste la recepción/);
  await controller.confirmReceipt(); assert.equal(writes, 1); controller.stop();
});

test('double tap and overlapping selection or refresh cannot dispatch another write', async () => {
  const response = deferred(); let reads = 0, writes = 0;
  const { controller } = setup({ list: async () => { reads++; return [order(), order(B)]; }, confirm: async () => { writes++; return response.promise; } });
  controller.start(); await tick(); controller.selectOrder(A); const sending = controller.confirmReceipt();
  await controller.confirmReceipt(); await controller.refresh(); controller.selectOrder(B); controller.selectOrder(null);
  assert.equal(writes, 1); assert.equal(reads, 1); assert.equal(controller.getSnapshot().confirming, true);
  assert.equal(controller.getSnapshot().selectedOrderId, A); response.resolve(confirmedOrder()); await sending; controller.stop();
});

test('failed refresh preserves orders and selection but blocks confirmation until a successful GET', async () => {
  let reads = 0, writes = 0; const { controller } = setup({ list: async () => {
    if (++reads === 2) throw new OrderReceiptError('Sin conexión.', 'network'); return [order()];
  }, confirm: async () => { writes++; return confirmedOrder(); } });
  controller.start(); await tick(); controller.selectOrder(A); const before = controller.getSnapshot(); await controller.refresh();
  assert.equal(controller.getSnapshot().orders, before.orders); assert.equal(controller.getSnapshot().selectedOrderId, A);
  assert.equal(controller.getSnapshot().requiresRefresh, true); await controller.confirmReceipt(); assert.equal(writes, 0);
  await controller.refresh(); assert.equal(controller.getSnapshot().requiresRefresh, false);
  assert.equal(controller.getSnapshot().selectedOrderId, A); assert.equal(controller.getSnapshot().error, null); controller.stop();
});

test('successfully refreshed window removes obsolete selection and never retains extra acknowledged orders', async () => {
  let reads = 0; const { controller } = setup({ list: async () => ++reads === 1 ? [order()] : [order(B)] });
  controller.start(); await tick(); controller.selectOrder(A); await controller.confirmReceipt(); await controller.refresh();
  assert.equal(controller.getSnapshot().selectedOrderId, null); assert.deepEqual(controller.getSnapshot().orders.map((item) => item.id), [B]);
  controller.stop();
});

test('failed confirmation requires explicit read verification before a second explicit write', async () => {
  let reads = 0, writes = 0; const { controller } = setup({ list: async () => { reads++; return [order()]; }, confirm: async () => {
    if (++writes === 1) throw new OrderReceiptError('Sin conexión.', 'network'); return confirmedOrder();
  } }); controller.start(); await tick(); controller.selectOrder(A); const before = controller.getSnapshot(); await controller.confirmReceipt();
  assert.equal(controller.getSnapshot().orders, before.orders); assert.equal(controller.getSnapshot().selectedOrderId, A);
  assert.equal(controller.getSnapshot().confirming, false); assert.equal(controller.getSnapshot().requiresRefresh, true);
  assert.equal(controller.getSnapshot().notice, null); assert.match(controller.getSnapshot().confirmError, /Sin conexión/);
  await controller.confirmReceipt(); assert.equal(writes, 1); assert.equal(reads, 1);
  await controller.refresh(); assert.equal(writes, 1); assert.equal(reads, 2);
  assert.equal(controller.getSnapshot().requiresRefresh, false); assert.equal(controller.getSnapshot().confirmError, null);
  await controller.confirmReceipt(); assert.equal(writes, 2); assert.equal(controller.getSnapshot().orders[0].receiptStatus, 'confirmed'); controller.stop();
});

test('lost PATCH response is reconciled by GET without a second confirmation or invented new success', async () => {
  let writes = 0; const { controller } = setup({ list: async () => writes ? [confirmedOrder()] : [order()], confirm: async () => {
    writes++; throw new OrderReceiptError('Tiempo agotado.', 'timeout');
  } }); controller.start(); await tick(); controller.selectOrder(A); await controller.confirmReceipt(); await controller.refresh();
  assert.equal(controller.getSnapshot().orders[0].receiptStatus, 'confirmed');
  assert.equal(controller.getSnapshot().notice, 'La recepción de este pedido ya está confirmada.');
  assert.equal(controller.getSnapshot().selectedOrderId, A); await controller.confirmReceipt(); assert.equal(writes, 1); controller.stop();
});

test('failed verification retains uncertainty and data through retries without dispatching a PATCH', async () => {
  let reads = 0, writes = 0; const { controller } = setup({ list: async () => {
    if (++reads > 1) throw new OrderReceiptError('Sin conexión.', 'network'); return [order()];
  }, confirm: async () => { writes++; throw new OrderReceiptError('Tiempo agotado.', 'timeout'); } });
  controller.start(); await tick(); controller.selectOrder(A); await controller.confirmReceipt();
  await controller.refresh(); await controller.refresh(); await controller.confirmReceipt();
  assert.equal(writes, 1); assert.equal(reads, 3); assert.equal(controller.getSnapshot().requiresRefresh, true);
  assert.equal(controller.getSnapshot().orders[0].receiptStatus, 'pending'); assert.equal(controller.getSnapshot().selectedOrderId, A);
  assert.equal(controller.getSnapshot().notice, null); controller.stop();
});

test('409 or 404 keeps error state until explicit verification and does not automatically retry either operation', async () => {
  for (const kind of ['conflict', 'not-found']) {
    let reads = 0, writes = 0; const { controller } = setup({ list: async () => { reads++; return reads === 1 ? [order()] : []; },
      confirm: async () => { writes++; throw new OrderReceiptError('Actualiza tus pedidos.', kind); } });
    controller.start(); await tick(); controller.selectOrder(A); await controller.confirmReceipt();
    assert.equal(reads, 1); assert.equal(writes, 1); assert.equal(controller.getSnapshot().requiresRefresh, true);
    assert.equal(controller.getSnapshot().notice, null); await controller.refresh();
    assert.equal(reads, 2); assert.equal(writes, 1); assert.deepEqual(controller.getSnapshot().orders, []);
    assert.equal(controller.getSnapshot().selectedOrderId, null); controller.stop();
  }
});

test('leaving a failed confirmation clears selection but cannot bypass verification with another order', async () => {
  const { controller } = setup({ list: async () => [order(), order(B)], confirm: async () => { throw new OrderReceiptError('Sin conexión.', 'network'); } });
  controller.start(); await tick(); controller.selectOrder(A); await controller.confirmReceipt(); controller.selectOrder(null);
  assert.equal(controller.getSnapshot().selectedOrderId, null); controller.selectOrder(B);
  assert.equal(controller.getSnapshot().selectedOrderId, null); assert.equal(controller.getSnapshot().requiresRefresh, true);
  await controller.refresh(); controller.selectOrder(B); assert.equal(controller.getSnapshot().selectedOrderId, B); controller.stop();
});

test('mismatched or unconfirmed PATCH result cannot overwrite receipt or claim success', async () => {
  for (const result of [confirmedOrder(B), order(), confirmedOrder(A, { status: 'cancelled' }), null]) {
    const { controller } = setup({ confirm: async () => result }); controller.start(); await tick(); controller.selectOrder(A);
    await controller.confirmReceipt(); assert.equal(controller.getSnapshot().orders[0].receiptStatus, 'pending');
    assert.equal(controller.getSnapshot().requiresRefresh, true); assert.equal(controller.getSnapshot().selectedOrderId, A);
    assert.equal(controller.getSnapshot().notice, null); assert.ok(controller.getSnapshot().confirmError); controller.stop();
  }
});

test('a stale GET cannot revert a known confirmation or reenable its PATCH', async () => {
  let writes = 0; const { controller } = setup({ confirm: async () => { writes++; return confirmedOrder(); } });
  controller.start(); await tick(); controller.selectOrder(A); await controller.confirmReceipt();
  await controller.refresh(); assert.equal(controller.getSnapshot().orders[0].receiptStatus, 'confirmed');
  assert.equal(controller.getSnapshot().orders[0].confirmedAt, confirmedOrder().confirmedAt);
  await controller.confirmReceipt(); assert.equal(writes, 1); assert.equal(controller.getSnapshot().orders.length, 1); controller.stop();
});

test('snapshots whitelist and deeply freeze public fields independently of repository object mutation', async () => {
  const source = order(A, { token: 'private', userId: USER }); source.items[0].secret = 'private';
  const { controller } = setup({ list: async () => [source] }); controller.start(); await tick();
  const result = controller.getSnapshot().orders; assert.equal(result[0].token, undefined); assert.equal(result[0].userId, undefined);
  assert.equal(result[0].items[0].secret, undefined); assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result[0]));
  assert.ok(Object.isFrozen(result[0].items)); assert.ok(Object.isFrozen(result[0].items[0]));
  source.reference = 'Changed'; source.items[0].name = 'Changed'; assert.notEqual(result[0].reference, 'Changed');
  assert.notEqual(result[0].items[0].name, 'Changed'); controller.stop();
});

test('malformed read result retains the previously known collection rather than inventing empty or crashing', async () => {
  let reads = 0; const { controller } = setup({ list: async () => ++reads === 1 ? [order()] : [null] });
  controller.start(); await tick(); controller.selectOrder(A); const before = controller.getSnapshot().orders; await controller.refresh();
  assert.equal(controller.getSnapshot().orders, before); assert.equal(controller.getSnapshot().status, 'ready');
  assert.equal(controller.getSnapshot().requiresRefresh, true); assert.ok(controller.getSnapshot().error); controller.stop();
});

test('401 from GET or PATCH clears personal state and blocks the same session even after stop/start', async () => {
  for (const operation of ['read', 'write']) {
    let reads = 0, writes = 0; const { controller, auth } = setup({ list: async () => {
      reads++; if (operation === 'read' && reads === 2) throw new OrderReceiptError('Sesión vencida.', 'unauthorized'); return [order()];
    }, confirm: async () => { writes++; throw new OrderReceiptError('Sesión vencida.', 'unauthorized'); } });
    controller.start(); await tick(); controller.selectOrder(A);
    if (operation === 'read') await controller.refresh(); else await controller.confirmReceipt();
    assert.equal(controller.getSnapshot().status, 'session-expired'); assert.equal(controller.getSnapshot().orders, null);
    assert.equal(controller.getSnapshot().selectedOrderId, null); const before = [reads, writes];
    await controller.refresh(); await controller.confirmReceipt(); controller.stop(); controller.start(); await tick();
    assert.deepEqual([reads, writes], before); auth.publish(authenticated()); await tick();
    assert.equal(controller.getSnapshot().status, 'ready'); assert.equal(reads, before[0] + 1); controller.stop();
  }
});

test('403 clears personal data without expiring session and a later successful GET recovers', async () => {
  for (const operation of ['read', 'write']) {
    let reads = 0; const { controller } = setup({ list: async () => {
      if (++reads === 2 && operation === 'read') throw new OrderReceiptError('Acceso no permitido.', 'forbidden'); return [order()];
    }, confirm: async () => { throw new OrderReceiptError('Acceso no permitido.', 'forbidden'); } });
    controller.start(); await tick(); controller.selectOrder(A);
    if (operation === 'read') await controller.refresh(); else await controller.confirmReceipt();
    assert.equal(controller.getSnapshot().status, 'error'); assert.equal(controller.getSnapshot().orders, null);
    assert.equal(controller.getSnapshot().selectedOrderId, null); await controller.refresh();
    assert.equal(controller.getSnapshot().status, 'ready'); controller.stop();
  }
});

test('500 and rate-limit errors do not expire the session or discard a previously loaded order', async () => {
  for (const kind of ['server', 'rate-limit']) {
    const { controller } = setup({ confirm: async () => { throw new OrderReceiptError('Inténtalo más tarde.', kind); } });
    controller.start(); await tick(); controller.selectOrder(A); await controller.confirmReceipt();
    assert.equal(controller.getSnapshot().status, 'ready'); assert.equal(controller.getSnapshot().selectedOrderId, A);
    assert.equal(controller.getSnapshot().orders[0].receiptStatus, 'pending'); assert.equal(controller.getSnapshot().requiresRefresh, true); controller.stop();
  }
});

test('logout aborts an in-flight PATCH, clears data and rejects its late success', async () => {
  const response = deferred(); let signal; const { controller, auth } = setup({ confirm: async (id, options) => { signal = options.signal; return response.promise; } });
  controller.start(); await tick(); controller.selectOrder(A); const sending = controller.confirmReceipt();
  auth.publish({ status: 'anonymous', user: null, message: null }); assert.equal(signal.aborted, true);
  assert.equal(controller.getSnapshot().status, 'anonymous'); assert.equal(controller.getSnapshot().orders, null);
  assert.equal(controller.getSnapshot().selectedOrderId, null); response.resolve(confirmedOrder()); await sending;
  assert.equal(controller.getSnapshot().orders, null); assert.equal(controller.getSnapshot().notice, null); controller.stop();
});

test('a new login, even to the same account, rejects an earlier pending GET', async () => {
  for (const id of [USER, B]) {
    const response = deferred(); let reads = 0, signal; const { controller, auth } = setup({ list: async (options) => {
      if (++reads === 1) { signal = options.signal; return response.promise; } return [];
    } }); controller.start(); auth.publish(authenticated(id)); await tick(); assert.equal(signal.aborted, true);
    response.resolve([order()]); await tick(); assert.deepEqual(controller.getSnapshot().orders, []); controller.stop();
  }
});

test('switching accounts during PATCH cannot confirm an order in the next account snapshot', async () => {
  const response = deferred(); const { controller, auth } = setup({ list: async () => auth.getSnapshot().user.id === USER ? [order()] : [order(B)],
    confirm: async () => response.promise }); controller.start(); await tick(); controller.selectOrder(A);
  const sending = controller.confirmReceipt(); auth.publish(authenticated(B)); await tick();
  response.resolve(confirmedOrder()); await sending; assert.deepEqual(controller.getSnapshot().orders.map((item) => item.id), [B]);
  assert.equal(controller.getSnapshot().orders[0].receiptStatus, 'pending'); assert.equal(controller.getSnapshot().notice, null); controller.stop();
});

test('silent auth changes hide personal snapshots synchronously and use stable hidden snapshots', async () => {
  const { controller, auth } = setup(); controller.start(); await tick(); controller.selectOrder(A);
  auth.silent({ status: 'anonymous', user: null, message: null }); const hidden = controller.getSnapshot();
  assert.equal(hidden.orders, null); assert.equal(hidden.selectedOrderId, null); assert.equal(hidden.status, 'anonymous');
  assert.equal(controller.getSnapshot(), hidden); auth.notify(); assert.equal(controller.getSnapshot().orders, null); controller.stop();
});

test('stop cancels a write and restart loads afresh instead of resubmitting', async () => {
  const response = deferred(); let writes = 0, reads = 0, signal;
  const { controller, auth } = setup({ list: async () => { reads++; return [order()]; },
    confirm: async (id, options) => { writes++; signal = options.signal; return response.promise; } });
  controller.start(); await tick(); controller.selectOrder(A); const sending = controller.confirmReceipt(); controller.stop(); controller.stop();
  assert.equal(signal.aborted, true); assert.equal(auth.listenerCount(), 0); assert.equal(controller.getSnapshot().orders, null);
  controller.start(); await tick(); response.resolve(confirmedOrder()); await sending;
  assert.equal(reads, 2); assert.equal(writes, 1); assert.equal(controller.getSnapshot().orders[0].receiptStatus, 'pending');
  assert.equal(controller.getSnapshot().notice, null); controller.stop();
});

test('observer failures cannot convert a successful confirmation into an error', async () => {
  const { controller } = setup(); controller.start(); await tick(); controller.selectOrder(A);
  controller.subscribe(() => { throw new Error('Observer failed.'); }); await controller.confirmReceipt();
  assert.equal(controller.getSnapshot().confirmError, null); assert.match(controller.getSnapshot().notice, /Confirmaste/); controller.stop();
});

test('logout by an observer before dispatch prevents the PATCH entirely', async () => {
  let writes = 0; const { controller, auth } = setup({ confirm: async () => { writes++; return confirmedOrder(); } });
  controller.start(); await tick(); controller.selectOrder(A); controller.subscribe(() => {
    if (controller.getSnapshot().confirming) auth.publish({ status: 'anonymous', user: null, message: null });
  }); await controller.confirmReceipt(); assert.equal(writes, 0); assert.equal(controller.getSnapshot().status, 'anonymous'); controller.stop();
});

test('an auth change during publication of GET success preserves the new account request lock', async () => {
  const next = deferred(); let reads = 0; const { controller, auth } = setup({ list: async () => {
    if (++reads === 1) return [order()]; return next.promise;
  } }); let switched = false;
  controller.subscribe(() => {
    if (!switched && controller.getSnapshot().status === 'ready') { switched = true; auth.publish(authenticated(B)); }
  }); controller.start(); await tick(); await controller.refresh(); assert.equal(reads, 2);
  assert.equal(controller.getSnapshot().status, 'loading'); next.resolve([]); await tick();
  assert.deepEqual(controller.getSnapshot().orders, []); controller.stop();
});
