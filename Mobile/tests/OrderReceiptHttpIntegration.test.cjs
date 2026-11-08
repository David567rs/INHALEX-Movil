const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiOrderReceiptRepository } = require('../src/features/orderReceipt/data/repositories/ApiOrderReceiptRepository.ts');
const { buildOrderReceiptActions } = require('../src/features/orderReceipt/domain/useCases/orderReceiptActions.ts');
const { createOrderReceiptController } = require('../src/features/orderReceipt/presentation/state/createOrderReceiptController.ts');

const ORDER = '507f1f77bcf86cd799439012', PRODUCT = '507f1f77bcf86cd799439011';
const DATE = '2026-11-08T12:00:00.000Z';
const tick = () => new Promise((resolve) => setImmediate(resolve));
const response = (value) => new Response(JSON.stringify(value), { headers: { 'content-type': 'application/json' } });
const order = (confirmed = false) => ({
  id: ORDER, reference: 'INX-DEMO-001', status: 'completed', customerReceiptStatus: confirmed ? 'confirmed' : 'pending',
  completedAt: DATE, ...(confirmed ? { customerReceiptConfirmedAt: DATE } : {}),
  totalItems: 2, subtotal: 120, currency: 'MXN',
  items: [{ productId: PRODUCT, productName: 'Lavanda', image: '/images/lavanda.jpg', presentation: '10 ml', currency: 'MXN', quantity: 2, unitPrice: 60, subtotal: 120 }],
});
function setup(t, fetch) {
  const snapshot = { status: 'authenticated', user: { id: '507f1f77bcf86cd799439099', firstName: 'Demo', lastName: 'Prueba', email: 'demo@example.test', phone: '5512345678' }, message: null };
  const session = { getSnapshot: () => snapshot, subscribe: () => () => {}, async restore() {}, async signIn() { return snapshot.user; }, async signOut() {} };
  const requests = [];
  const http = new HttpClient({ baseUrl: 'https://fixture.example/api', getAccessToken: () => 'fixture.receipt.signature', requestTimeoutMs: 1000,
    fetch: async (url, init) => { requests.push({ url, method: init.method, headers: init.headers, body: init.body, credentials: init.credentials }); return fetch(url, init); } });
  const controller = createOrderReceiptController(session, buildOrderReceiptActions(new ApiOrderReceiptRepository(http)));
  t.after(() => controller.stop());
  return { controller, requests };
}
function assertPrivateTransport(requests) {
  for (const request of requests) {
    assert.equal(request.headers.Authorization, 'Bearer fixture.receipt.signature');
    assert.equal(request.headers.Cookie, undefined);
    assert.equal(request.credentials, 'omit');
    assert.equal(request.body, undefined);
    assert.equal(request.url.includes('userId'), false);
  }
}

test('real HttpClient pipeline reconciles a stored PATCH with lost response through explicit GET only', async (t) => {
  let stored = false, offline = false;
  const { controller, requests } = setup(t, async (url, init) => {
    if (offline) throw new TypeError('fixture network disconnected');
    if (init.method === 'PATCH') {
      assert.equal(url, `https://fixture.example/api/orders/${ORDER}/receipt/confirm`);
      stored = true;
      throw new TypeError('fixture response lost after commit');
    }
    assert.equal(url, 'https://fixture.example/api/orders/me/receipt-confirmations');
    return response([order(stored)]);
  });
  controller.start(); await tick(); controller.selectOrder(ORDER);
  await Promise.all([controller.confirmReceipt(), controller.confirmReceipt()]);
  assert.equal(stored, true);
  assert.deepEqual(requests.map((request) => request.method), ['GET', 'PATCH']);
  assert.equal(controller.getSnapshot().requiresRefresh, true);
  assert.equal(controller.getSnapshot().orders[0].receiptStatus, 'pending');
  assert.equal(controller.getSnapshot().selectedOrderId, ORDER);
  assert.ok(controller.getSnapshot().confirmError);
  await controller.confirmReceipt();
  assert.equal(requests.length, 2);

  offline = true; await controller.refresh();
  assert.equal(controller.getSnapshot().orders[0].subtotal, 120);
  assert.equal(controller.getSnapshot().orders[0].receiptStatus, 'pending');
  assert.equal(controller.getSnapshot().requiresRefresh, true);
  offline = false; await controller.refresh();
  assert.equal(controller.getSnapshot().orders[0].receiptStatus, 'confirmed');
  assert.equal(controller.getSnapshot().orders[0].confirmedAt, DATE);
  assert.equal(controller.getSnapshot().requiresRefresh, false);
  assert.equal(controller.getSnapshot().confirmError, null);
  assert.match(controller.getSnapshot().notice, /ya está confirmada/);
  await controller.confirmReceipt();
  assert.deepEqual(requests.map((request) => request.method), ['GET', 'PATCH', 'GET', 'GET']);
  assertPrivateTransport(requests);
});

test('a failed PATCH before storage requires GET reconciliation and another explicit confirmation', async (t) => {
  let failWrite = true, stored = false;
  const { controller, requests } = setup(t, async (url, init) => {
    if (init.method === 'PATCH') {
      if (failWrite) throw new TypeError('fixture request failed before commit');
      stored = true; return response(order(true));
    }
    return response([order(stored)]);
  });
  controller.start(); await tick(); controller.selectOrder(ORDER); await controller.confirmReceipt();
  assert.equal(stored, false); assert.equal(controller.getSnapshot().requiresRefresh, true);
  failWrite = false; await controller.refresh();
  assert.equal(controller.getSnapshot().requiresRefresh, false);
  assert.equal(controller.getSnapshot().orders[0].receiptStatus, 'pending');
  assert.equal(controller.getSnapshot().notice, null);
  assert.equal(stored, false);
  assert.deepEqual(requests.map((request) => request.method), ['GET', 'PATCH', 'GET']);
  await controller.confirmReceipt();
  assert.equal(stored, true);
  assert.equal(controller.getSnapshot().orders[0].receiptStatus, 'confirmed');
  assert.match(controller.getSnapshot().notice, /Confirmaste/);
  assert.deepEqual(requests.map((request) => request.method), ['GET', 'PATCH', 'GET', 'PATCH']);
  assertPrivateTransport(requests);
});
