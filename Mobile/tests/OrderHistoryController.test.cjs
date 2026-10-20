const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createOrderHistoryController } = require('../src/features/orderHistory/presentation/state/createOrderHistoryController.ts');
const { OrderHistoryError } = require('../src/features/orderHistory/domain/errors/OrderHistoryError.ts');

const A = '000000000000000000000001', B = '000000000000000000000002', C = '000000000000000000000003';
const USER = '111111111111111111111111', OTHER = '222222222222222222222222';
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const authenticated = (id = USER) => ({ status: 'authenticated', user: { id, firstName: 'Ana', lastName: 'López', email: 'ana@example.test', phone: '5512345678' }, message: null });
const summary = (id = A, overrides = {}) => ({ id, reference: `PED-${id.slice(-3)}`, status: 'pending_review', currency: 'MXN', unitCount: 2,
  subtotal: 200, createdAt: '2026-10-19T12:00:00.000Z', ...overrides });
const detail = (id = A, overrides = {}) => ({ ...summary(id), items: [{ productId: C, productName: 'Lavanda', presentation: '30 ml', image: null,
  quantity: 2, unitPrice: 100, subtotal: 200, currency: 'MXN' }], shippingAddress: { label: 'Casa', recipientName: 'Ana López', phone: '5512345678',
  street: 'Principal', exteriorNumber: '12', interiorNumber: '', neighborhood: 'Centro', municipality: 'Pachuca', state: 'Hidalgo', postalCode: '42000', references: '' }, ...overrides });
const page = (orders = [], nextCursor = null) => ({ orders, nextCursor });
function authSession(initial = authenticated()) {
  let state = initial; const listeners = new Set();
  return { getSnapshot: () => state, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async restore() {}, async signIn() { return state.user; }, async signOut() {},
    publish(next) { state = next; this.notify(); }, silent(next) { state = next; }, notify() { [...listeners].forEach((listener) => listener()); },
    listenerCount: () => listeners.size };
}
function setup(overrides = {}, session = authSession()) {
  const actions = { list: async () => page([summary()]), get: async (id) => detail(id), ...overrides };
  return { session, actions, controller: createOrderHistoryController(session, actions) };
}

test('history waits for verified authentication and never fabricates empty rows while checking, anonymous or recovering', async () => {
  let reads = 0;
  const session = authSession({ status: 'checking', user: null, message: null });
  const { controller } = setup({ list: async () => { reads++; return page(); } }, session);
  controller.start(); await controller.refresh(); await controller.loadMore(); await controller.selectOrder(A);
  assert.equal(controller.getSnapshot().status, 'checking'); assert.equal(controller.getSnapshot().orders, null);
  session.publish({ status: 'recovery-error', user: null, message: 'Reintenta tu sesión.' });
  assert.equal(controller.getSnapshot().status, 'recovery-error'); assert.equal(controller.getSnapshot().error, 'Reintenta tu sesión.');
  session.publish({ status: 'anonymous', user: null, message: null });
  await controller.refresh(); assert.equal(reads, 0); assert.equal(controller.getSnapshot().orders, null);
  session.publish(authenticated()); await tick(); assert.equal(reads, 1);
  assert.deepEqual(controller.getSnapshot().orders, []); assert.equal(controller.getSnapshot().status, 'ready'); controller.stop();
});

test('start is idempotent, forwards cancellation and blocks duplicate initial list requests', async () => {
  const response = deferred(); let reads = 0, signal, cursor;
  const { controller, session } = setup({ list: async (value, options) => { reads++; cursor = value; signal = options.signal; return response.promise; } });
  await controller.refresh(); assert.equal(reads, 0);
  controller.start(); controller.start(); await controller.refresh(); await controller.loadMore();
  assert.equal(reads, 1); assert.equal(cursor, undefined); assert.ok(signal instanceof AbortSignal);
  assert.equal(session.listenerCount(), 1); assert.equal(controller.getSnapshot().status, 'loading'); assert.equal(controller.getSnapshot().orders, null);
  response.resolve(page()); await tick(); assert.deepEqual(controller.getSnapshot().orders, []);
  controller.stop(); assert.equal(session.listenerCount(), 0);
});

test('initial network error stays distinct from empty and an explicit retry can confirm an empty history', async () => {
  let reads = 0;
  const { controller } = setup({ list: async () => { if (++reads === 1) throw new OrderHistoryError('Sin conexión.', 'network'); return page(); } });
  controller.start(); await tick(); assert.equal(controller.getSnapshot().status, 'error'); assert.equal(controller.getSnapshot().orders, null);
  assert.equal(controller.getSnapshot().error, 'Sin conexión.'); await controller.refresh();
  assert.equal(controller.getSnapshot().status, 'ready'); assert.deepEqual(controller.getSnapshot().orders, []);
  assert.equal(controller.getSnapshot().error, null); controller.stop();
});

test('summaries are sorted by descending creation date and descending id for equal dates, stripping hidden properties', async () => {
  const source = [summary(A, { internalToken: 'hidden' }), summary(C), summary(B, { createdAt: '2026-10-20T12:00:00.000Z' })];
  const { controller } = setup({ list: async () => page(source) }); controller.start(); await tick();
  const state = controller.getSnapshot(); assert.deepEqual(state.orders.map((order) => order.id), [B, C, A]);
  assert.equal(state.orders[2].internalToken, undefined); assert.ok(Object.isFrozen(state)); assert.ok(Object.isFrozen(state.orders));
  assert.ok(Object.isFrozen(state.orders[0])); source[0].reference = 'mutated'; assert.notEqual(state.orders[2].reference, 'mutated'); controller.stop();
});

test('pagination uses the opaque server cursor once, preserves confirmed versions and deduplicates overlaps', async () => {
  const second = deferred(); const cursors = [];
  const { controller } = setup({ list: async (cursor) => { cursors.push(cursor); return cursor === undefined
    ? page([summary(C), summary(B)], 'opaque_first') : second.promise; } });
  controller.start(); await tick(); const loading = controller.loadMore(); await controller.loadMore();
  assert.equal(controller.getSnapshot().loadingMore, true); assert.equal(cursors.length, 2);
  second.resolve(page([summary(B, { subtotal: 99 }), summary(A)], null)); await loading;
  assert.deepEqual(cursors, [undefined, 'opaque_first']); assert.deepEqual(controller.getSnapshot().orders.map((order) => order.id), [C, B, A]);
  assert.equal(controller.getSnapshot().orders.find((order) => order.id === B).subtotal, 200);
  await controller.loadMore(); assert.equal(cursors.length, 2); assert.equal(controller.getSnapshot().nextCursor, null); controller.stop();
});

test('pagination failure retains the cursor, selected detail and rows for an explicit retry', async () => {
  let moreReads = 0;
  const { controller } = setup({ list: async (cursor) => { if (!cursor) return page([summary(C)], 'cursor_a');
    if (++moreReads === 1) throw new OrderHistoryError('Falló la página.', 'timeout'); return page([summary(B)]); } });
  controller.start(); await tick(); await controller.selectOrder(C); const before = controller.getSnapshot();
  await controller.loadMore(); const failed = controller.getSnapshot();
  assert.equal(failed.orders, before.orders); assert.equal(failed.detail, before.detail); assert.equal(failed.nextCursor, 'cursor_a');
  assert.equal(failed.loadMoreError, 'Falló la página.'); assert.equal(failed.loadingMore, false); assert.equal(failed.status, 'ready');
  await controller.loadMore(); assert.equal(moreReads, 2); assert.equal(controller.getSnapshot().orders.length, 2);
  assert.equal(controller.getSnapshot().loadMoreError, null); controller.stop();
});

test('a repeated pagination cursor is rejected without publishing its rows or looping', async () => {
  let calls = 0;
  const { controller } = setup({ list: async (cursor) => { calls++; return cursor ? page([summary(B)], cursor) : page([summary(C)], 'cursor_a'); } });
  controller.start(); await tick(); await controller.loadMore();
  assert.equal(calls, 2); assert.equal(controller.getSnapshot().orders.length, 1); assert.equal(controller.getSnapshot().nextCursor, 'cursor_a');
  assert.match(controller.getSnapshot().loadMoreError, /continuar el historial/); controller.stop();
});

test('pagination detects a multi-page cursor cycle and successful refresh resets the consumed cursor history', async () => {
  let calls = 0;
  const { controller } = setup({ list: async (cursor) => { calls++; if (!cursor) return page([summary(C)], 'cursor_a');
    return cursor === 'cursor_a' ? page([summary(B)], 'cursor_b') : page([summary(A)], 'cursor_a'); } });
  controller.start(); await tick(); await controller.loadMore(); await controller.loadMore();
  assert.equal(calls, 3); assert.deepEqual(controller.getSnapshot().orders.map((order) => order.id), [C, B]);
  assert.equal(controller.getSnapshot().nextCursor, 'cursor_b'); assert.ok(controller.getSnapshot().loadMoreError);
  await controller.refresh(); await controller.loadMore(); assert.equal(controller.getSnapshot().loadMoreError, null);
  assert.equal(controller.getSnapshot().nextCursor, 'cursor_b'); controller.stop();
});

test('refresh replaces old pages with a confirmed empty result and clears any selected receipt', async () => {
  let reads = 0;
  const { controller } = setup({ list: async () => ++reads === 1 ? page([summary()], 'cursor_a') : page() });
  controller.start(); await tick(); await controller.selectOrder(A); await controller.refresh(); const state = controller.getSnapshot();
  assert.deepEqual(state.orders, []); assert.equal(state.nextCursor, null); assert.equal(state.selectedOrderId, null);
  assert.equal(state.detail, null); assert.equal(state.status, 'ready'); controller.stop();
});

test('refresh failure preserves confirmed orders, selection and receipt while exposing a recoverable list notice', async () => {
  let reads = 0;
  const { controller } = setup({ list: async () => { if (++reads > 1) throw new OrderHistoryError('Sin conexión.', 'network'); return page([summary()]); } });
  controller.start(); await tick(); await controller.selectOrder(A); const before = controller.getSnapshot(); await controller.refresh();
  const state = controller.getSnapshot(); assert.equal(state.orders, before.orders); assert.equal(state.detail, before.detail);
  assert.equal(state.selectedOrderId, A); assert.equal(state.status, 'ready'); assert.equal(state.refreshing, false); assert.equal(state.error, 'Sin conexión.'); controller.stop();
});

test('a successful refresh re-reads the selected receipt so updated status and amount agree with its summary', async () => {
  let fresh = false, detailReads = 0;
  const { controller } = setup({ list: async () => page([summary(A, fresh ? { status: 'confirmed', subtotal: 300 } : {})]),
    get: async () => { detailReads++; return detail(A, fresh ? { status: 'confirmed', subtotal: 300 } : {}); } });
  controller.start(); await tick(); await controller.selectOrder(A); fresh = true; await controller.refresh();
  assert.equal(detailReads, 2); assert.equal(controller.getSnapshot().selectedOrderId, A);
  assert.equal(controller.getSnapshot().detail.status, 'confirmed'); assert.equal(controller.getSnapshot().detail.subtotal, 300); controller.stop();
});

test('refresh aborts an older detail request and an adapter ignoring abort cannot replace the revalidated receipt', async () => {
  const older = deferred(); let detailReads = 0, oldSignal;
  const { controller } = setup({ get: async (id, options) => { if (++detailReads === 1) { oldSignal = options.signal; return older.promise; }
    return detail(id, { status: 'confirmed' }); } });
  controller.start(); await tick(); const selecting = controller.selectOrder(A); await controller.refresh();
  assert.equal(oldSignal.aborted, true); older.resolve(detail(A, { reference: 'STALE' })); await selecting;
  assert.equal(controller.getSnapshot().detail.status, 'confirmed'); assert.notEqual(controller.getSnapshot().detail.reference, 'STALE'); controller.stop();
});

test('refresh failure after cancelling a loading detail leaves an explicit detail retry instead of an empty accordion', async () => {
  const older = deferred(); let reads = 0, gets = 0;
  const { controller } = setup({ list: async () => { if (++reads > 1) throw new OrderHistoryError('Sin conexión.', 'network'); return page([summary()]); },
    get: async () => ++gets === 1 ? older.promise : detail() });
  controller.start(); await tick(); const selecting = controller.selectOrder(A); await controller.refresh();
  assert.equal(controller.getSnapshot().selectedOrderId, A); assert.equal(controller.getSnapshot().detailLoading, false);
  assert.equal(controller.getSnapshot().detail, null); assert.match(controller.getSnapshot().detailError, /actualizar el resumen/);
  await controller.retryDetail(); assert.equal(controller.getSnapshot().detail.id, A);
  older.resolve(detail(A, { reference: 'STALE' })); await selecting;
  assert.notEqual(controller.getSnapshot().detail.reference, 'STALE'); controller.stop();
});

test('refresh supersedes a pending additional page without appending a late response', async () => {
  const older = deferred(); let initialReads = 0, oldSignal;
  const { controller } = setup({ list: async (cursor, options) => {
    if (cursor) { oldSignal = options.signal; return older.promise; }
    return ++initialReads === 1 ? page([summary(C)], 'cursor_a') : page([summary(B)]);
  } }); controller.start(); await tick(); const more = controller.loadMore(); await controller.refresh();
  assert.equal(oldSignal.aborted, true); older.resolve(page([summary(A)])); await more;
  assert.deepEqual(controller.getSnapshot().orders.map((order) => order.id), [B]); assert.equal(controller.getSnapshot().loadingMore, false); controller.stop();
});

test('selecting only a loaded order queries detail once, and selecting null collapses and aborts it', async () => {
  const response = deferred(); let reads = 0, signal;
  const { controller } = setup({ get: async (id, options) => { reads++; signal = options.signal; return response.promise; } });
  controller.start(); await tick(); await controller.selectOrder(B); assert.equal(reads, 0);
  const selecting = controller.selectOrder(A); await controller.selectOrder(A); assert.equal(reads, 1);
  assert.equal(controller.getSnapshot().detailLoading, true); assert.equal(controller.getSnapshot().detail, null);
  await controller.selectOrder(null); assert.equal(signal.aborted, true); response.resolve(detail()); await selecting;
  assert.equal(controller.getSnapshot().selectedOrderId, null); assert.equal(controller.getSnapshot().detail, null); controller.stop();
});

test('selecting another order cancels and ignores the former detail response', async () => {
  const older = deferred(); let oldSignal;
  const { controller } = setup({ list: async () => page([summary(A), summary(B)]), get: async (id, options) => {
    if (id === A) { oldSignal = options.signal; return older.promise; } return detail(B);
  } }); controller.start(); await tick(); const first = controller.selectOrder(A); await controller.selectOrder(B);
  assert.equal(oldSignal.aborted, true); older.resolve(detail(A)); await first;
  assert.equal(controller.getSnapshot().selectedOrderId, B); assert.equal(controller.getSnapshot().detail.id, B); controller.stop();
});

test('detail failure is separate from the list and explicit detail retry recovers the same selected order', async () => {
  let detailReads = 0;
  const { controller } = setup({ get: async (id) => { if (++detailReads === 1) throw new OrderHistoryError('No está disponible.', 'not-found'); return detail(id); } });
  controller.start(); await tick(); await controller.selectOrder(A); const failed = controller.getSnapshot();
  assert.equal(failed.selectedOrderId, A); assert.equal(failed.orders.length, 1); assert.equal(failed.detail, null);
  assert.equal(failed.detailError, 'No está disponible.'); assert.equal(failed.error, null);
  await controller.retryDetail(); assert.equal(detailReads, 2); assert.equal(controller.getSnapshot().detail.id, A); assert.equal(controller.getSnapshot().detailError, null); controller.stop();
});

test('detail identity mismatch is rejected and unknown exceptions never expose raw transport or credential text', async () => {
  let detailReads = 0;
  const { controller } = setup({ get: async () => { if (++detailReads === 1) return detail(B); throw new Error('SECRET token transport body'); } });
  controller.start(); await tick(); await controller.selectOrder(A); assert.equal(controller.getSnapshot().detail, null);
  assert.match(controller.getSnapshot().detailError, /confirmar el pedido seleccionado/); await controller.retryDetail();
  assert.doesNotMatch(controller.getSnapshot().detailError, /SECRET|token|transport/); controller.stop();
});

test('confirmed details are copied and frozen without retaining unknown item, address or top-level properties', async () => {
  const source = detail(A, { token: 'hidden' }); source.items[0].inventory = 55; source.shippingAddress.ownerId = OTHER;
  const { controller } = setup({ get: async () => source }); controller.start(); await tick(); await controller.selectOrder(A);
  const result = controller.getSnapshot().detail;
  assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result.items)); assert.ok(Object.isFrozen(result.items[0])); assert.ok(Object.isFrozen(result.shippingAddress));
  assert.equal(result.token, undefined); assert.equal(result.items[0].inventory, undefined); assert.equal(result.shippingAddress.ownerId, undefined);
  source.items[0].productName = 'Mutated'; source.shippingAddress.street = 'Changed';
  assert.equal(result.items[0].productName, 'Lavanda'); assert.equal(result.shippingAddress.street, 'Principal'); controller.stop();
});

test('logout immediately hides rows and detail, aborts concurrent reads and ignores an obsolete rejection', async () => {
  const pending = deferred(); let signal;
  const { controller, session } = setup({ get: async (id, options) => { signal = options.signal; return pending.promise; } });
  controller.start(); await tick(); const selecting = controller.selectOrder(A);
  session.publish({ status: 'anonymous', user: null, message: null }); assert.equal(signal.aborted, true);
  assert.equal(controller.getSnapshot().status, 'anonymous'); assert.equal(controller.getSnapshot().orders, null); assert.equal(controller.getSnapshot().selectedOrderId, null);
  pending.reject(new OrderHistoryError('Old 401', 'unauthorized')); await selecting;
  assert.equal(controller.getSnapshot().status, 'anonymous'); assert.equal(controller.getSnapshot().error, null); controller.stop();
});

test('switching accounts without logout never exposes the former account while the new history is loading', async () => {
  const older = deferred(), newer = deferred(); let reads = 0, oldSignal;
  const { controller, session } = setup({ list: async (cursor, options) => { if (++reads === 1) { oldSignal = options.signal; return older.promise; } return newer.promise; } });
  controller.start(); session.publish(authenticated(OTHER)); assert.equal(oldSignal.aborted, true);
  assert.equal(controller.getSnapshot().orders, null); older.resolve(page([summary(A)])); await tick(); assert.equal(controller.getSnapshot().orders, null);
  newer.resolve(page([summary(B)])); await tick(); assert.deepEqual(controller.getSnapshot().orders.map((order) => order.id), [B]); controller.stop();
});

test('a new authorization object for the same user invalidates responses from their previous login', async () => {
  const older = deferred(), newer = deferred(); let reads = 0;
  const { controller, session } = setup({ list: async () => ++reads === 1 ? older.promise : newer.promise });
  controller.start(); session.publish(authenticated(USER)); older.resolve(page([summary(A)])); await tick();
  assert.equal(controller.getSnapshot().orders, null); newer.resolve(page([summary(B)])); await tick();
  assert.deepEqual(controller.getSnapshot().orders.map((order) => order.id), [B]); controller.stop();
});

test('the visible snapshot hides personal data before a delayed authorization notification and remains reference-stable', async () => {
  const { controller, session } = setup(); controller.start(); await tick(); await controller.selectOrder(A);
  session.silent(authenticated(OTHER)); const hidden = controller.getSnapshot();
  assert.equal(hidden.orders, null); assert.equal(hidden.detail, null); assert.equal(hidden.selectedOrderId, null);
  assert.equal(controller.getSnapshot(), hidden); session.notify(); await tick(); assert.equal(controller.getSnapshot().orders.length, 1); controller.stop();
});

test('an obsolete detail response cannot publish before a delayed account notification', async () => {
  const response = deferred(); const { controller, session } = setup({ get: async () => response.promise });
  controller.start(); await tick(); const selecting = controller.selectOrder(A); session.silent(authenticated(OTHER));
  response.resolve(detail(A)); await selecting; assert.equal(controller.getSnapshot().orders, null); assert.equal(controller.getSnapshot().detail, null);
  session.notify(); await tick(); assert.equal(controller.getSnapshot().detail, null); controller.stop();
});

test('a list 401 expires only this module, clears personal data and blocks retry until a new authorization identity', async () => {
  let reads = 0, fail = false;
  const { controller, session } = setup({ list: async () => { reads++; if (fail) throw new OrderHistoryError('Sesión rechazada.', 'unauthorized'); return page([summary()]); } });
  controller.start(); await tick(); await controller.selectOrder(A); fail = true; const auth = session.getSnapshot(); await controller.refresh();
  assert.equal(session.getSnapshot(), auth); assert.equal(controller.getSnapshot().status, 'session-expired'); assert.equal(controller.getSnapshot().orders, null);
  assert.equal(controller.getSnapshot().detail, null); await controller.refresh(); await controller.retryDetail(); assert.equal(reads, 2);
  controller.stop(); controller.start(); await tick(); assert.equal(reads, 2); assert.equal(controller.getSnapshot().status, 'session-expired');
  fail = false; session.publish(authenticated(USER)); await tick(); assert.equal(reads, 3); assert.equal(controller.getSnapshot().status, 'ready'); controller.stop();
});

test('detail 401 cancels a simultaneous additional page and its late success cannot revive private rows', async () => {
  const more = deferred(), selected = deferred(); let moreSignal;
  const { controller, session } = setup({ list: async (cursor, options) => { if (!cursor) return page([summary()], 'cursor_a'); moreSignal = options.signal; return more.promise; },
    get: async () => selected.promise }); controller.start(); await tick();
  const loadingMore = controller.loadMore(), selecting = controller.selectOrder(A);
  selected.reject(new OrderHistoryError('Sesión no válida.', 'unauthorized')); await selecting;
  assert.equal(moreSignal.aborted, true); more.resolve(page([summary(B)])); await loadingMore;
  assert.equal(controller.getSnapshot().status, 'session-expired'); assert.equal(controller.getSnapshot().orders, null);
  assert.equal(session.getSnapshot().status, 'authenticated'); controller.stop();
});

test('forbidden and malformed list results surface safe module errors without changing global authentication', async () => {
  for (const kind of ['forbidden', 'invalid-response']) {
    const { controller, session } = setup({ list: async () => { throw new OrderHistoryError('Respuesta no disponible.', kind); } });
    controller.start(); await tick(); assert.equal(controller.getSnapshot().status, 'error'); assert.equal(controller.getSnapshot().orders, null);
    assert.equal(controller.getSnapshot().error, 'Respuesta no disponible.'); assert.equal(session.getSnapshot().status, 'authenticated'); controller.stop();
  }
});

test('a failed selected receipt revalidation does not invent details or corrupt the refreshed list', async () => {
  let gets = 0;
  const { controller } = setup({ get: async () => { if (++gets > 1) throw new OrderHistoryError('Pedido retirado.', 'not-found'); return detail(); } });
  controller.start(); await tick(); await controller.selectOrder(A); await controller.refresh();
  assert.equal(controller.getSnapshot().orders.length, 1); assert.equal(controller.getSnapshot().detail, null);
  assert.equal(controller.getSnapshot().selectedOrderId, A); assert.equal(controller.getSnapshot().detailError, 'Pedido retirado.'); controller.stop();
});

test('stop cancels outstanding requests and a later start makes a fresh request without old personal data', async () => {
  const older = deferred(); let calls = 0, signal;
  const { controller } = setup({ list: async (cursor, options) => { if (++calls === 1) { signal = options.signal; return older.promise; } return page([summary(B)]); } });
  controller.start(); controller.stop(); assert.equal(signal.aborted, true); older.resolve(page([summary(A)])); await tick();
  assert.equal(controller.getSnapshot().orders, null); controller.start(); await tick();
  assert.equal(calls, 2); assert.deepEqual(controller.getSnapshot().orders.map((order) => order.id), [B]); controller.stop();
});

test('observer exceptions cannot turn confirmed history into an error or prevent other subscribers', async () => {
  const { controller } = setup(); let notified = 0;
  const unsubscribe = controller.subscribe(() => { throw new Error('Observer failed'); });
  controller.subscribe(() => { notified++; }); controller.start(); await tick();
  assert.equal(controller.getSnapshot().status, 'ready'); assert.equal(controller.getSnapshot().orders.length, 1); assert.ok(notified >= 2);
  unsubscribe(); controller.stop();
});

test('reentrant logout from a loading observer prevents the unauthorized read from starting', async () => {
  let reads = 0;
  const { controller, session } = setup({ list: async () => { reads++; return page(); } });
  controller.subscribe(() => { if (controller.getSnapshot().status === 'loading') session.publish({ status: 'anonymous', user: null, message: null }); });
  controller.start(); await tick(); assert.equal(reads, 0); assert.equal(controller.getSnapshot().status, 'anonymous'); controller.stop();
});
