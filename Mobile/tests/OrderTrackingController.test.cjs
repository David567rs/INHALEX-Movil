const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createOrderTrackingController } = require('../src/features/orderTracking/presentation/state/createOrderTrackingController.ts');
const { OrderTrackingError } = require('../src/features/orderTracking/domain/errors/OrderTrackingError.ts');
const { trackingTimeline, formatTrackingDate } = require('../src/features/orderTracking/presentation/state/trackingTimeline.ts');
const { trackingRouteState } = require('../src/features/orderTracking/presentation/state/trackingRouteState.ts');

const A = '000000000000000000000001', B = '000000000000000000000002';
const USER = '111111111111111111111111', OTHER = '222222222222222222222222';
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const authenticated = (id = USER) => ({ status: 'authenticated', user: { id, firstName: 'Ana', lastName: 'López', email: 'ana@example.test', phone: '5512345678' }, message: null });
const order = (id = A, changes = {}) => ({ id, reference: `PED-${id.slice(-3)}`, status: 'pending_review', currency: 'MXN',
  unitCount: 2, subtotal: 200, createdAt: '2026-10-19T12:00:00.000Z', confirmedAt: null, cancelledAt: null, completedAt: null,
  items: [{ productId: B, productName: 'Lavanda', presentation: '10 ml', image: null, quantity: 2, unitPrice: 100, subtotal: 200, currency: 'MXN' }],
  shippingAddress: { label: 'Casa', recipientName: 'Ana López', phone: '5512345678', street: 'Principal', exteriorNumber: '12',
    interiorNumber: '', neighborhood: 'Centro', municipality: 'Pachuca', state: 'Hidalgo', postalCode: '42000', references: '' }, ...changes });
function session(initial = authenticated()) {
  let state = initial; const listeners = new Set();
  return { getSnapshot: () => state, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async restore() {}, async signIn() { return state.user; }, async signOut() {},
    publish(next) { state = next; this.notify(); }, silent(next) { state = next; }, notify() { [...listeners].forEach((listener) => listener()); },
    listenerCount: () => listeners.size };
}
function setup(get = async (id) => order(id), auth = session()) {
  return { auth, controller: createOrderTrackingController(auth, { get }) };
}

test('tracking starts without an eager request and waits for a selected order and verified session', async () => {
  let reads = 0; const auth = session({ status: 'checking', user: null, message: null });
  const { controller } = setup(async () => { reads++; return order(); }, auth);
  controller.start(); await controller.refresh(); assert.equal(reads, 0); assert.equal(controller.getSnapshot().status, 'checking');
  await controller.selectOrder(A); assert.equal(reads, 0);
  auth.publish({ status: 'recovery-error', user: null, message: 'Reintenta tu sesión.' });
  assert.equal(controller.getSnapshot().status, 'recovery-error'); assert.equal(controller.getSnapshot().order, null);
  auth.publish({ status: 'anonymous', user: null, message: null }); await controller.refresh(); assert.equal(reads, 0);
  auth.publish(authenticated()); await tick(); assert.equal(reads, 1); assert.equal(controller.getSnapshot().order.id, A); controller.stop();
});

test('authenticated tracking remains idle without an ID and start is idempotent', async () => {
  let reads = 0; const { controller, auth } = setup(async () => { reads++; return order(); });
  controller.start(); controller.start(); await controller.refresh(); await tick();
  assert.equal(reads, 0); assert.equal(auth.listenerCount(), 1); assert.equal(controller.getSnapshot().status, 'idle');
  assert.equal(controller.getSnapshot().selectedOrderId, null); controller.stop(); assert.equal(auth.listenerCount(), 0);
});

test('tracking rejects an invalid route identifier without any request or fabricated data', async () => {
  let reads = 0; const { controller } = setup(async () => { reads++; return order(); }); controller.start();
  for (const id of ['', '../private', 'a'.repeat(25), `${A}\n`]) {
    await controller.selectOrder(id); await controller.refresh();
    assert.equal(controller.getSnapshot().status, 'not-found'); assert.equal(controller.getSnapshot().order, null);
  }
  assert.equal(reads, 0); await controller.selectOrder(null); assert.equal(controller.getSnapshot().status, 'idle'); controller.stop();
});

test('tracking normalizes the ID, forwards its signal and blocks duplicate selection and refresh', async () => {
  const response = deferred(); let reads = 0, selected, signal;
  const { controller } = setup(async (id, options) => { reads++; selected = id; signal = options.signal; return response.promise; }); controller.start();
  const opening = controller.selectOrder(A.toUpperCase()); await controller.selectOrder(A); await controller.refresh();
  assert.equal(reads, 1); assert.equal(selected, A); assert.ok(signal instanceof AbortSignal);
  assert.equal(controller.getSnapshot().status, 'loading'); assert.equal(controller.getSnapshot().order, null);
  response.resolve(order()); await opening; await controller.selectOrder(A); assert.equal(reads, 1);
  assert.equal(controller.getSnapshot().status, 'ready'); controller.stop();
});

test('selecting another order clears the prior snapshot and ignores a late response from the old selection', async () => {
  const old = deferred(), next = deferred(); let oldSignal;
  const { controller } = setup(async (id, options) => { if (id === A) { oldSignal = options.signal; return old.promise; } return next.promise; }); controller.start();
  const opening = controller.selectOrder(A); const changing = controller.selectOrder(B);
  assert.equal(oldSignal.aborted, true); assert.equal(controller.getSnapshot().selectedOrderId, B); assert.equal(controller.getSnapshot().order, null);
  old.resolve(order(A)); await opening; assert.equal(controller.getSnapshot().order, null);
  next.resolve(order(B)); await changing; assert.equal(controller.getSnapshot().order.id, B); controller.stop();
});

test('clearing the route cancels an in-flight request and returns to idle without reviving a late success', async () => {
  const response = deferred(); let signal;
  const { controller } = setup(async (id, options) => { signal = options.signal; return response.promise; }); controller.start();
  const opening = controller.selectOrder(A); await controller.selectOrder(null); assert.equal(signal.aborted, true);
  response.resolve(order()); await opening; assert.equal(controller.getSnapshot().status, 'idle');
  assert.equal(controller.getSnapshot().order, null); assert.equal(controller.getSnapshot().selectedOrderId, null); controller.stop();
});

test('refresh errors preserve the confirmed order and an explicit retry replaces it with a fresh snapshot', async () => {
  for (const kind of ['network', 'timeout', 'server', 'invalid-response']) {
    let reads = 0; const { controller } = setup(async () => {
      if (++reads === 2) throw new OrderTrackingError('No disponible.', kind);
      return order(A, reads > 2 ? { status: 'confirmed', confirmedAt: '2026-10-20T12:00:00.000Z' } : {});
    }); controller.start(); await controller.selectOrder(A); const before = controller.getSnapshot().order;
    await controller.refresh(); assert.equal(controller.getSnapshot().order, before);
    assert.equal(controller.getSnapshot().status, 'ready'); assert.equal(controller.getSnapshot().error, 'No disponible.');
    assert.equal(controller.getSnapshot().refreshing, false); await controller.refresh();
    assert.equal(controller.getSnapshot().order.status, 'confirmed'); assert.equal(controller.getSnapshot().error, null); controller.stop();
  }
});

test('initial failure remains distinct from not-found and does not fabricate an order', async () => {
  let reads = 0; const { controller } = setup(async () => { if (++reads === 1) throw new OrderTrackingError('Sin conexión.', 'network'); return order(); });
  controller.start(); await controller.selectOrder(A); assert.equal(controller.getSnapshot().status, 'error');
  assert.equal(controller.getSnapshot().order, null); await controller.refresh(); assert.equal(controller.getSnapshot().status, 'ready'); controller.stop();
});

test('refreshing a confirmed order exposes busy while retaining its snapshot', async () => {
  const response = deferred(); let reads = 0;
  const { controller } = setup(async () => ++reads === 1 ? order() : response.promise); controller.start(); await controller.selectOrder(A);
  const before = controller.getSnapshot().order; const refreshing = controller.refresh();
  assert.equal(controller.getSnapshot().refreshing, true); assert.equal(controller.getSnapshot().status, 'ready');
  assert.equal(controller.getSnapshot().order, before); response.resolve(order(A, { status: 'completed' })); await refreshing;
  assert.equal(controller.getSnapshot().refreshing, false); assert.equal(controller.getSnapshot().order.status, 'completed'); controller.stop();
});

test('404 clears a prior order and an explicit retry can recover the selected order', async () => {
  let reads = 0; const { controller } = setup(async () => { if (++reads === 2) throw new OrderTrackingError('Retirado.', 'not-found'); return order(); });
  controller.start(); await controller.selectOrder(A); await controller.refresh();
  assert.equal(controller.getSnapshot().status, 'not-found'); assert.equal(controller.getSnapshot().order, null);
  assert.equal(controller.getSnapshot().selectedOrderId, A); await controller.refresh(); assert.equal(controller.getSnapshot().order.id, A); controller.stop();
});

test('403 withdraws confirmed data without changing global auth and keeps the selected ID for an explicit retry', async () => {
  let reads = 0;
  const { controller, auth } = setup(async () => { if (++reads === 2) throw new OrderTrackingError('Acceso rechazado.', 'forbidden'); return order(); });
  controller.start(); await controller.selectOrder(A); const authBefore = auth.getSnapshot(); await controller.refresh();
  const rejected = controller.getSnapshot(); assert.equal(rejected.status, 'error'); assert.equal(rejected.order, null);
  assert.equal(rejected.selectedOrderId, A); assert.equal(rejected.refreshing, false); assert.equal(rejected.error, 'Acceso rechazado.');
  assert.equal(auth.getSnapshot(), authBefore); await controller.refresh(); assert.equal(controller.getSnapshot().order.id, A);
  assert.equal(controller.getSnapshot().status, 'ready'); assert.equal(controller.getSnapshot().error, null); controller.stop();
});

test('a returned order with a different ID is rejected and unexpected errors hide raw details', async () => {
  let reads = 0; const { controller } = setup(async () => { if (++reads === 1) return order(B); throw new Error('SECRET credential response'); });
  controller.start(); await controller.selectOrder(A); assert.equal(controller.getSnapshot().status, 'error');
  assert.equal(controller.getSnapshot().order, null); assert.match(controller.getSnapshot().error, /confirmar el pedido seleccionado/);
  await controller.refresh(); assert.doesNotMatch(controller.getSnapshot().error, /SECRET|credential|response/); controller.stop();
});

test('confirmed snapshots are projected and deeply frozen without internal response properties', async () => {
  const source = order(A, { token: 'hidden' }); source.items[0].inventory = 99; source.shippingAddress.ownerId = OTHER;
  const { controller } = setup(async () => source); controller.start(); await controller.selectOrder(A); const result = controller.getSnapshot().order;
  assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result.items)); assert.ok(Object.isFrozen(result.items[0])); assert.ok(Object.isFrozen(result.shippingAddress));
  assert.equal(result.token, undefined); assert.equal(result.items[0].inventory, undefined); assert.equal(result.shippingAddress.ownerId, undefined);
  source.items[0].productName = 'Changed'; source.shippingAddress.street = 'Changed';
  assert.equal(result.items[0].productName, 'Lavanda'); assert.equal(result.shippingAddress.street, 'Principal'); controller.stop();
});

test('logout hides the prior order immediately, aborts refresh and ignores obsolete failures', async () => {
  const response = deferred(); let reads = 0, signal;
  const { controller, auth } = setup(async (id, options) => { if (++reads === 1) return order(id); signal = options.signal; return response.promise; });
  controller.start(); await controller.selectOrder(A); const refreshing = controller.refresh();
  auth.publish({ status: 'anonymous', user: null, message: null }); assert.equal(signal.aborted, true);
  assert.equal(controller.getSnapshot().status, 'anonymous'); assert.equal(controller.getSnapshot().order, null);
  response.reject(new OrderTrackingError('Old session.', 'unauthorized')); await refreshing;
  assert.equal(controller.getSnapshot().status, 'anonymous'); assert.equal(controller.getSnapshot().error, null); controller.stop();
});

test('switching authorization identities clears old data and cannot publish a late response from the former owner', async () => {
  const old = deferred(), next = deferred(); let reads = 0, signal;
  const { controller, auth } = setup(async (id, options) => { if (++reads === 1) { signal = options.signal; return old.promise; } return next.promise; });
  controller.start(); const first = controller.selectOrder(A); auth.publish(authenticated(OTHER));
  assert.equal(signal.aborted, true); assert.equal(controller.getSnapshot().order, null);
  old.resolve(order(A, { reference: 'OLD-OWNER' })); await first; assert.equal(controller.getSnapshot().order, null);
  next.resolve(order(A, { reference: 'NEW-OWNER' })); await tick(); assert.equal(controller.getSnapshot().order.reference, 'NEW-OWNER'); controller.stop();
});

test('reauthorizing the same account invalidates the prior request without exposing its result', async () => {
  const old = deferred(), next = deferred(); let reads = 0;
  const { controller, auth } = setup(async () => ++reads === 1 ? old.promise : next.promise);
  controller.start(); const selecting = controller.selectOrder(A); auth.publish(authenticated(USER));
  old.resolve(order(A, { reference: 'STALE' })); await selecting; assert.equal(controller.getSnapshot().order, null);
  next.resolve(order()); await tick(); assert.notEqual(controller.getSnapshot().order.reference, 'STALE'); assert.equal(reads, 2); controller.stop();
});

test('snapshot hides prior owner data before delayed auth notification and remains reference stable', async () => {
  const { controller, auth } = setup(); controller.start(); await controller.selectOrder(A);
  auth.silent(authenticated(OTHER)); const hidden = controller.getSnapshot();
  assert.equal(hidden.order, null); assert.equal(controller.getSnapshot(), hidden);
  auth.notify(); await tick(); assert.equal(controller.getSnapshot().order.id, A); controller.stop();
});

test('a late detail response cannot publish before a delayed session change notification', async () => {
  const response = deferred(); const { controller, auth } = setup(async () => response.promise); controller.start();
  const selecting = controller.selectOrder(A); auth.silent({ status: 'anonymous', user: null, message: null });
  response.resolve(order()); await selecting; assert.equal(controller.getSnapshot().order, null);
  assert.equal(controller.getSnapshot().status, 'anonymous'); auth.notify(); controller.stop();
});

test('401 clears data and blocks refresh and reselection until a new authorization identity', async () => {
  let reads = 0, reject = false;
  const { controller, auth } = setup(async (id) => { reads++; if (reject) throw new OrderTrackingError('Sesión rechazada.', 'unauthorized'); return order(id); });
  controller.start(); await controller.selectOrder(A); reject = true; await controller.refresh(); const authBefore = auth.getSnapshot();
  assert.equal(controller.getSnapshot().status, 'session-expired'); assert.equal(controller.getSnapshot().order, null);
  await controller.refresh(); await controller.selectOrder(B); assert.equal(reads, 2); assert.equal(auth.getSnapshot(), authBefore);
  controller.stop(); controller.start(); await tick(); assert.equal(controller.getSnapshot().status, 'session-expired'); assert.equal(reads, 2);
  reject = false; auth.publish(authenticated(USER)); await tick(); assert.equal(reads, 3); assert.equal(controller.getSnapshot().status, 'ready'); controller.stop();
});

test('stop aborts work and restarting issues a fresh selected-order read without old data', async () => {
  const old = deferred(); let reads = 0, signal;
  const { controller } = setup(async (id, options) => { if (++reads === 1) { signal = options.signal; return old.promise; } return order(id); });
  controller.start(); const selecting = controller.selectOrder(A); controller.stop(); assert.equal(signal.aborted, true);
  old.resolve(order(A, { reference: 'STALE' })); await selecting; assert.equal(controller.getSnapshot().order, null);
  controller.start(); await tick(); assert.equal(reads, 2); assert.notEqual(controller.getSnapshot().order.reference, 'STALE'); controller.stop();
});

test('observer exceptions do not corrupt data and reentrant logout prevents an unauthorized read', async () => {
  const { controller } = setup(); let notified = 0;
  controller.subscribe(() => { throw new Error('Observer failed'); }); controller.subscribe(() => { notified++; });
  controller.start(); await controller.selectOrder(A); assert.equal(controller.getSnapshot().status, 'ready'); assert.ok(notified >= 2); controller.stop();
  let reads = 0; const second = setup(async () => { reads++; return order(); }); second.controller.start();
  second.controller.subscribe(() => { if (second.controller.getSnapshot().status === 'loading') second.auth.publish({ status: 'anonymous', user: null, message: null }); });
  await second.controller.selectOrder(A); assert.equal(reads, 0); assert.equal(second.controller.getSnapshot().status, 'anonymous'); second.controller.stop();
});

test('timeline dates receipt from createdAt without claiming a review-start timestamp', () => {
  const steps = trackingTimeline(order());
  assert.equal(steps[0].label, 'Pedido recibido'); assert.equal(steps[0].dateLabel, formatTrackingDate(order().createdAt));
  assert.equal(steps[0].state, 'current'); assert.equal(steps[1].state, 'upcoming'); assert.equal(steps[1].dateLabel, null);
  assert.equal(steps[2].state, 'upcoming'); assert.equal(steps[2].dateLabel, null);
  assert.ok(Object.isFrozen(steps)); assert.ok(steps.every(Object.isFrozen));
});

test('completed historical orders without confirmedAt never invent a prior confirmation step', () => {
  const steps = trackingTimeline(order(A, { status: 'completed', completedAt: '2026-10-20T14:00:00.000Z' }));
  assert.deepEqual(steps.map((step) => step.id), ['pending_review', 'completed']);
  assert.equal(steps.at(-1).state, 'current'); assert.equal(steps.at(-1).dateLabel, formatTrackingDate('2026-10-20T14:00:00.000Z'));
});

test('cancelled orders only include confirmation when the server returned confirmedAt and never show completion', () => {
  const noConfirmation = trackingTimeline(order(A, { status: 'cancelled', cancelledAt: null }));
  assert.deepEqual(noConfirmation.map((step) => step.id), ['pending_review', 'cancelled']);
  assert.equal(noConfirmation.at(-1).state, 'current'); assert.equal(noConfirmation.at(-1).dateLabel, null);
  const confirmedAt = '2026-10-20T12:00:00.000Z';
  const known = trackingTimeline(order(A, { status: 'cancelled', confirmedAt, cancelledAt: '2026-10-20T14:00:00.000Z' }));
  assert.deepEqual(known.map((step) => step.id), ['pending_review', 'confirmed', 'cancelled']);
  assert.equal(known[1].dateLabel, formatTrackingDate(confirmedAt)); assert.equal(known[1].state, 'past');
});

test('current confirmed status can have an unknown date while pending ignores future event timestamps', () => {
  const confirmed = trackingTimeline(order(A, { status: 'confirmed' }));
  assert.equal(confirmed[1].state, 'current'); assert.equal(confirmed[1].dateLabel, null);
  const pending = trackingTimeline(order(A, { confirmedAt: '2026-10-20T12:00:00.000Z', completedAt: '2026-10-20T14:00:00.000Z' }));
  assert.equal(pending[1].state, 'upcoming'); assert.equal(pending[1].dateLabel, null);
  assert.equal(pending[2].dateLabel, null);
});

test('route projection hides the previous order and notice synchronously before focus selection catches up', () => {
  const previous = Object.freeze({ status: 'ready', selectedOrderId: A, order: order(A), error: 'Old order notice', refreshing: true });
  const next = trackingRouteState(previous, B);
  assert.equal(next.status, 'loading'); assert.equal(next.selectedOrderId, B);
  assert.equal(next.order, null); assert.equal(next.error, null); assert.equal(next.refreshing, false);
  assert.equal(previous.order.id, A); assert.equal(previous.error, 'Old order notice');
  assert.equal(trackingRouteState(previous, A), previous);
});

test('route projection immediately clears removed or malformed order selections without inheriting former notices', () => {
  const previous = { status: 'error', selectedOrderId: A, order: order(A), error: 'Old order notice', refreshing: false };
  const empty = trackingRouteState(previous, null);
  assert.equal(empty.status, 'idle'); assert.equal(empty.order, null); assert.equal(empty.error, null); assert.equal(empty.selectedOrderId, null);
  const invalid = trackingRouteState(previous, '../private');
  assert.equal(invalid.status, 'not-found'); assert.equal(invalid.order, null); assert.equal(invalid.selectedOrderId, null);
  assert.notEqual(invalid.error, previous.error);
});

test('route projection preserves authentication gates while removing any order data', () => {
  for (const status of ['checking', 'anonymous', 'recovery-error', 'session-expired']) {
    const gate = trackingRouteState({ status, selectedOrderId: A, order: order(A), error: 'Session warning', refreshing: true }, B);
    assert.equal(gate.status, status); assert.equal(gate.error, 'Session warning');
    assert.equal(gate.order, null); assert.equal(gate.selectedOrderId, B); assert.equal(gate.refreshing, false);
    assert.equal(trackingRouteState(gate, '../invalid').status, status);
  }
});

test('route projection normalizes route IDs and refuses an unrelated order in an otherwise matching selection', () => {
  const selected = '507f1f77bcf86cd799439011';
  const state = { status: 'ready', selectedOrderId: selected, order: order(selected), error: null, refreshing: false };
  assert.equal(trackingRouteState(state, selected.toUpperCase()), state);
  const guarded = trackingRouteState({ ...state, order: order(B) }, selected);
  assert.equal(guarded.status, 'loading'); assert.equal(guarded.order, null); assert.equal(guarded.error, null);
});
