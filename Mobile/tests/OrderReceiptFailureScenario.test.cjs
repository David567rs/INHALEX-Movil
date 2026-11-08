const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createReceiptFailureScenario } = require('../src/features/orderReceipt/development/createReceiptFailureScenario.ts');
const tick = () => new Promise((resolve) => setImmediate(resolve));

async function start(t) {
  const scenario = createReceiptFailureScenario();
  t.after(() => scenario.dispose());
  scenario.controller.start(); await tick();
  const order = scenario.controller.getSnapshot().orders[0];
  scenario.controller.selectOrder(order.id);
  return { scenario, controller: scenario.controller, order };
}

test('receipt fixture starts only on demand with immutable diagnostics and its own credential-free session', async () => {
  const scenario = createReceiptFailureScenario();
  const initial = scenario.getSnapshot();
  assert.deepEqual(initial, { online: true, confirmAttempts: 0, confirmedReceipts: 0, reads: 0 });
  assert.equal(initial, scenario.getSnapshot()); assert.ok(Object.isFrozen(initial));
  await tick(); assert.equal(scenario.getSnapshot(), initial);
  const auth = scenario.authSession.getSnapshot();
  assert.equal(auth.status, 'authenticated'); assert.ok(Object.isFrozen(auth)); assert.ok(Object.isFrozen(auth.user));
  assert.equal(auth.accessToken, undefined);
  await scenario.authSession.signOut(); assert.equal(scenario.authSession.getSnapshot(), auth);
  scenario.dispose();
});

test('receipt fixture preserves the pending order through confirm/read failures and never writes when connection is restored', async (t) => {
  const { scenario, controller, order } = await start(t);
  assert.equal(order.reference, 'DEMO-RECEPCION-01'); assert.match(order.id, /^[a-f\d]{24}$/);
  assert.equal(order.receiptStatus, 'pending'); assert.equal(order.totalItems, 2); assert.equal(order.subtotal, 120);
  assert.equal(order.currency, 'MXN'); assert.equal(order.items[0].imageUrl, null); assert.ok(Object.isFrozen(order.items));
  await Promise.all([controller.confirmReceipt(), controller.confirmReceipt()]);
  assert.deepEqual(scenario.getSnapshot(), { online: false, confirmAttempts: 1, confirmedReceipts: 0, reads: 1 });
  assert.equal(controller.getSnapshot().requiresRefresh, true); assert.ok(controller.getSnapshot().confirmError);
  assert.equal(controller.getSnapshot().orders[0].receiptStatus, 'pending'); assert.equal(controller.getSnapshot().orders[0].subtotal, 120);
  await controller.refresh();
  assert.ok(controller.getSnapshot().error); assert.equal(controller.getSnapshot().selectedOrderId, order.id);
  assert.deepEqual(scenario.getSnapshot(), { online: false, confirmAttempts: 1, confirmedReceipts: 0, reads: 2 });
  const before = controller.getSnapshot(); scenario.restoreConnection(); await tick();
  assert.equal(controller.getSnapshot(), before);
  assert.deepEqual(scenario.getSnapshot(), { online: true, confirmAttempts: 1, confirmedReceipts: 0, reads: 2 });
  await controller.confirmReceipt(); assert.equal(scenario.getSnapshot().confirmAttempts, 1);
  await controller.refresh();
  assert.equal(controller.getSnapshot().requiresRefresh, false); assert.equal(controller.getSnapshot().confirmError, null);
  assert.equal(controller.getSnapshot().orders[0].receiptStatus, 'pending'); assert.equal(controller.getSnapshot().notice, null);
  assert.deepEqual(scenario.getSnapshot(), { online: true, confirmAttempts: 1, confirmedReceipts: 0, reads: 3 });
  await Promise.all([controller.confirmReceipt(), controller.confirmReceipt()]);
  assert.equal(controller.getSnapshot().orders[0].receiptStatus, 'confirmed'); assert.ok(controller.getSnapshot().notice);
  assert.deepEqual(scenario.getSnapshot(), { online: true, confirmAttempts: 2, confirmedReceipts: 1, reads: 3 });
  await controller.confirmReceipt(); await controller.refresh(); await controller.confirmReceipt();
  assert.deepEqual(scenario.getSnapshot(), { online: true, confirmAttempts: 2, confirmedReceipts: 1, reads: 4 });
});

test('disposing before a pending read or confirmation blocks effects and later restart', async (t) => {
  const unread = createReceiptFailureScenario(); const initial = unread.getSnapshot();
  unread.controller.start(); unread.dispose(); await tick();
  unread.controller.start(); await unread.controller.refresh(); unread.restoreConnection();
  assert.equal(unread.getSnapshot(), initial);
  const { scenario, controller } = await start(t);
  const before = scenario.getSnapshot(); const pending = controller.confirmReceipt();
  scenario.dispose(); await pending; controller.start(); await controller.refresh(); await controller.confirmReceipt();
  scenario.restoreConnection(); scenario.dispose();
  assert.equal(scenario.getSnapshot(), before);
});

test('stopping the real controller cancels an in-flight simulated write before any saved result', async (t) => {
  const { scenario, controller } = await start(t);
  const before = scenario.getSnapshot(); const pending = controller.confirmReceipt();
  controller.stop(); await pending;
  assert.equal(scenario.getSnapshot(), before);
  controller.start(); await tick();
  assert.equal(controller.getSnapshot().orders[0].receiptStatus, 'pending');
  assert.equal(scenario.getSnapshot().confirmAttempts, 0);
});

test('new fixtures reset independently; observers are removable and cannot break the controlled failure', async (t) => {
  const { scenario, controller } = await start(t);
  let notifications = 0;
  const remove = scenario.subscribe(() => { notifications++; });
  scenario.subscribe(() => { throw new Error('observer failed'); });
  await controller.confirmReceipt(); assert.equal(notifications, 1);
  remove(); scenario.restoreConnection(); assert.equal(notifications, 1);
  const snapshot = scenario.getSnapshot(); scenario.restoreConnection(); assert.equal(scenario.getSnapshot(), snapshot);
  const second = createReceiptFailureScenario(); t.after(() => second.dispose());
  assert.deepEqual(second.getSnapshot(), { online: true, confirmAttempts: 0, confirmedReceipts: 0, reads: 0 });
  second.controller.start(); await tick();
  assert.equal(second.controller.getSnapshot().orders[0].receiptStatus, 'pending');
  assert.equal(scenario.getSnapshot(), snapshot);
  scenario.dispose(); scenario.restoreConnection(); assert.equal(notifications, 1);
});
