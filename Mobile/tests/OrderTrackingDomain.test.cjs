const assert = require('node:assert/strict');
const { test } = require('node:test');
const { OrderTrackingError } = require('../src/features/orderTracking/domain/errors/OrderTrackingError.ts');
const { createOrderTrackingActions, normalizeOrderTrackingId } = require('../src/features/orderTracking/domain/useCases/orderTrackingActions.ts');

const ID = '507f1f77bcf86cd799439011';
const errorKind = (kind) => (error) => {
  assert.ok(error instanceof OrderTrackingError); assert.equal(error.kind, kind);
  assert.equal(error.cause, undefined); assert.doesNotMatch(error.message, /private|token|stack/); return true;
};

test('tracking action normalizes the selected ID and forwards cancellation without synthesizing event dates', async () => {
  let request;
  const result = Object.freeze({ id: ID, status: 'completed', confirmedAt: null, cancelledAt: null, completedAt: null });
  const actions = createOrderTrackingActions({ get: async (...args) => { request = args; return result; } });
  const options = { signal: new AbortController().signal };
  assert.equal(await actions.get(ID.toUpperCase(), options), result);
  assert.deepEqual(request, [ID, options]); assert.equal(result.completedAt, null);
});

test('tracking ID validation rejects malformed identifiers and query or path injection before any repository call', async () => {
  assert.equal(normalizeOrderTrackingId(ID.toUpperCase()), ID); let calls = 0;
  const actions = createOrderTrackingActions({ get: async () => ++calls });
  for (const id of [undefined, null, [], {}, 42, '', `${ID}\n`, ` ${ID}`, 'g'.repeat(24), 'a'.repeat(25), '../orders', `${ID}?account=other`]) {
    await assert.rejects(actions.get(id), errorKind('invalid-request'));
  }
  assert.equal(calls, 0);
});

test('tracking action never starts an already cancelled read', async () => {
  const abort = new AbortController(); abort.abort(); let calls = 0;
  const actions = createOrderTrackingActions({ get: async () => { calls++; return {}; } });
  await assert.rejects(actions.get(ID, { signal: abort.signal }), errorKind('cancelled')); assert.equal(calls, 0);
});

test('tracking action discards a late success when its caller cancelled', async () => {
  const abort = new AbortController();
  const actions = createOrderTrackingActions({ get: async () => { abort.abort(); return { id: ID }; } });
  await assert.rejects(actions.get(ID, { signal: abort.signal }), errorKind('cancelled'));
});

test('tracking action retains known domain errors without exposing unexpected dependency text', async () => {
  const known = new OrderTrackingError('No encontramos ese pedido.', 'not-found');
  await assert.rejects(createOrderTrackingActions({ get: async () => { throw known; } }).get(ID), (error) => error === known);
  await assert.rejects(createOrderTrackingActions({ get: async () => { throw new Error('private token stack'); } }).get(ID), errorKind('unknown'));
});

test('caller cancellation takes precedence over an obsolete dependency rejection', async () => {
  const abort = new AbortController();
  const actions = createOrderTrackingActions({ get: async () => { abort.abort(); throw new OrderTrackingError('Sesión vencida.', 'unauthorized'); } });
  await assert.rejects(actions.get(ID, { signal: abort.signal }), errorKind('cancelled'));
});
