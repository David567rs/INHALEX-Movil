const assert = require('node:assert/strict');
const { test } = require('node:test');
const { buildOrderReceiptActions, canConfirmReceipt, normalizeReceiptOrderId } = require('../src/features/orderReceipt/domain/useCases/orderReceiptActions.ts');
const { OrderReceiptError } = require('../src/features/orderReceipt/domain/errors/OrderReceiptError.ts');
const ORDER = '507f1f77bcf86cd799439012';
const kind = (expected) => (error) => error instanceof OrderReceiptError && error.kind === expected;

test('receipt confirmation is offered only for pending completed orders', () => {
  assert.equal(canConfirmReceipt({ status: 'completed', receiptStatus: 'pending' }), true);
  for (const status of ['draft', 'pending_review', 'confirmed', 'cancelled', undefined]) {
    assert.equal(canConfirmReceipt({ status, receiptStatus: 'pending' }), false);
  }
  for (const receiptStatus of ['confirmed', 'issue_reported', 'not_required', 'unexpected', undefined]) {
    assert.equal(canConfirmReceipt({ status: 'completed', receiptStatus }), false);
  }
  assert.equal(canConfirmReceipt(null), false); assert.equal(canConfirmReceipt(undefined), false);
});

test('confirm normalizes the selected id and shares cancellation without adding account identity', async () => {
  let received; const abort = new AbortController();
  const actions = buildOrderReceiptActions({ list: async (options) => { assert.equal(options.signal, abort.signal); return []; },
    confirm: async (...args) => { received = args; return 'confirmed'; } });
  assert.deepEqual(await actions.list({ signal: abort.signal }), []);
  assert.equal(await actions.confirm(ORDER.toUpperCase(), { signal: abort.signal }), 'confirmed');
  assert.deepEqual(received, [ORDER, { signal: abort.signal }]);
  assert.equal(normalizeReceiptOrderId(ORDER), ORDER);
});

test('invalid receipt targets never reach the repository', async () => {
  let calls = 0;
  const actions = buildOrderReceiptActions({ list: async () => [], confirm: async () => { calls++; } });
  for (const value of [null, undefined, [], {}, '', ' '+ORDER, ORDER+' ', '../other', ORDER+'a', 'z'.repeat(24)]) {
    await assert.rejects(actions.confirm(value), kind('invalid-request'));
  }
  assert.equal(calls, 0);
});

test('writes are never retried automatically and cancelled operations cannot publish a late result', async () => {
  let calls = 0; const abort = new AbortController();
  const actions = buildOrderReceiptActions({ list: async () => { abort.abort(); return []; },
    confirm: async () => { calls++; throw new OrderReceiptError('Sin conexión.', 'network'); } });
  await assert.rejects(actions.confirm(ORDER), kind('network')); assert.equal(calls, 1);
  await assert.rejects(actions.list({ signal: abort.signal }), kind('cancelled'));
  await assert.rejects(actions.confirm(ORDER, { signal: abort.signal }), kind('cancelled')); assert.equal(calls, 1);
});

test('unexpected repository errors do not expose private diagnostics', async () => {
  const actions = buildOrderReceiptActions({ list: async () => { throw new Error('private token database'); }, confirm: async () => { throw new Error('private token'); } });
  for (const call of [() => actions.list(), () => actions.confirm(ORDER)]) {
    await assert.rejects(call(), (error) => { assert.equal(error.kind, 'unknown'); assert.doesNotMatch(error.message, /private|token|database/); assert.equal(error.cause, undefined); return true; });
  }
});
