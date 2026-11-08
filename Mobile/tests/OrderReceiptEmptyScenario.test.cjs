const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createReceiptEmptyScenario } = require('../src/features/orderReceipt/development/createReceiptEmptyScenario.ts');

const tick = () => new Promise((resolve) => setImmediate(resolve));

test('isolated receipt scenario loads a successful empty collection and refreshes without writes', async (t) => {
  const scenario = createReceiptEmptyScenario();
  t.after(() => scenario.dispose());
  const { controller, authSession } = scenario;
  const auth = authSession.getSnapshot();
  assert.equal(auth.status, 'authenticated');
  assert.equal(auth.user.email, 'demo@example.test');
  await authSession.restore();
  assert.equal(authSession.getSnapshot(), auth);
  assert.equal(controller.getSnapshot().orders, null);

  controller.start();
  await tick();
  const loaded = controller.getSnapshot();
  assert.equal(loaded.status, 'ready');
  assert.deepEqual(loaded.orders, []);
  assert.equal(loaded.selectedOrderId, null);
  assert.equal(loaded.error, null);
  assert.equal(loaded.requiresRefresh, false);

  for (let iteration = 0; iteration < 2; iteration++) {
    const refresh = controller.refresh();
    assert.equal(controller.getSnapshot().refreshing, true);
    await refresh;
    assert.deepEqual(controller.getSnapshot().orders, []);
    assert.equal(controller.getSnapshot().status, 'ready');
    assert.equal(controller.getSnapshot().refreshing, false);
    assert.equal(controller.getSnapshot().error, null);
  }
  assert.deepEqual(scenario.getDiagnostics(), { reads: 3, confirmAttempts: 0 });
});

test('empty receipt scenario cannot select or confirm a nonexistent order', async (t) => {
  const scenario = createReceiptEmptyScenario();
  t.after(() => scenario.dispose());
  const { controller } = scenario;
  controller.start();
  await tick();
  controller.selectOrder('000000000000000000000092');
  await controller.confirmReceipt();
  await controller.confirmReceipt();
  assert.equal(controller.getSnapshot().selectedOrderId, null);
  assert.deepEqual(controller.getSnapshot().orders, []);
  assert.equal(controller.getSnapshot().confirming, false);
  assert.equal(controller.getSnapshot().confirmError, null);
  assert.equal(controller.getSnapshot().notice, null);
  assert.deepEqual(scenario.getDiagnostics(), { reads: 1, confirmAttempts: 0 });
});

test('disposing during a read prevents late publication and a late controller restart', async () => {
  const scenario = createReceiptEmptyScenario();
  const { controller } = scenario;
  let notifications = 0;
  const unsubscribe = controller.subscribe(() => { notifications++; });
  controller.start();
  assert.equal(scenario.getDiagnostics().reads, 1);
  assert.equal(controller.getSnapshot().status, 'loading');
  scenario.dispose();
  const disposedState = controller.getSnapshot();
  const notificationsAtExit = notifications;
  await tick();
  assert.equal(controller.getSnapshot(), disposedState);
  assert.equal(controller.getSnapshot().orders, null);
  assert.equal(notifications, notificationsAtExit);

  controller.start();
  await controller.refresh();
  controller.selectOrder('000000000000000000000092');
  await controller.confirmReceipt();
  scenario.dispose();
  await tick();
  assert.equal(controller.getSnapshot(), disposedState);
  assert.equal(notifications, notificationsAtExit);
  assert.deepEqual(scenario.getDiagnostics(), { reads: 1, confirmAttempts: 0 });
  unsubscribe();
});
