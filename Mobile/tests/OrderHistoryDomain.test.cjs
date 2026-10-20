const assert = require('node:assert/strict');
const { test } = require('node:test');
const { OrderHistoryError } = require('../src/features/orderHistory/domain/errors/OrderHistoryError.ts');
const { createOrderHistoryActions, normalizeOrderHistoryCursor, normalizeOrderHistoryId } = require('../src/features/orderHistory/domain/useCases/orderHistoryActions.ts');

const id = '507f1f77bcf86cd799439011';
const errorKind = (kind) => (error) => {
  assert.ok(error instanceof OrderHistoryError);
  assert.equal(error.kind, kind);
  assert.equal(error.cause, undefined);
  assert.equal(error.message.includes('private'), false);
  return true;
};

test('history actions preserve opaque cursor and options while normalizing only the selected order ID', async () => {
  const calls = [];
  const page = Object.freeze({ orders: [], nextCursor: null });
  const detail = Object.freeze({ id });
  const actions = createOrderHistoryActions({
    list: async (...args) => { calls.push(['list', ...args]); return page; },
    get: async (...args) => { calls.push(['get', ...args]); return detail; },
  });
  const options = { signal: new AbortController().signal };
  assert.equal(await actions.list(undefined, options), page);
  assert.equal(await actions.list('aA_bB-09', options), page);
  assert.equal(await actions.get(id.toUpperCase(), options), detail);
  assert.deepEqual(calls, [['list', undefined, options], ['list', 'aA_bB-09', options], ['get', id, options]]);
});

test('history cursor bounds treat the cursor as opaque and reject query or path injection', () => {
  assert.equal(normalizeOrderHistoryCursor(undefined), undefined);
  assert.equal(normalizeOrderHistoryCursor('A'), 'A');
  assert.equal(normalizeOrderHistoryCursor('a'.repeat(256)), 'a'.repeat(256));
  for (const cursor of ['', null, [], {}, 42, 'a'.repeat(257), 'abc\n', ' abc', 'abc=', '../orders', 'abc?userId=private', 'abc&email=private']) {
    assert.throws(() => normalizeOrderHistoryCursor(cursor), errorKind('invalid-request'));
  }
});

test('history selection accepts only bounded Mongo identifiers without mutating the caller input', () => {
  assert.equal(normalizeOrderHistoryId(id.toUpperCase()), id);
  for (const value of ['', null, {}, [], 4, `${id}\n`, ` ${id}`, '../private', 'g'.repeat(24), 'a'.repeat(25)]) {
    assert.throws(() => normalizeOrderHistoryId(value), errorKind('invalid-request'));
  }
});

test('history actions reject invalid requests before any repository call', async () => {
  let calls = 0;
  const actions = createOrderHistoryActions({ list: async () => ++calls, get: async () => ++calls });
  await assert.rejects(actions.list('private&account=other'), errorKind('invalid-request'));
  await assert.rejects(actions.get('../private'), errorKind('invalid-request'));
  assert.equal(calls, 0);
});

test('history actions prevent already cancelled calls and discard late cancelled results', async () => {
  let calls = 0;
  const aborted = new AbortController(); aborted.abort();
  const actions = createOrderHistoryActions({ list: async () => ++calls, get: async () => ++calls });
  await assert.rejects(actions.list(undefined, { signal: aborted.signal }), errorKind('cancelled'));
  await assert.rejects(actions.get(id, { signal: aborted.signal }), errorKind('cancelled'));
  assert.equal(calls, 0);
  const late = new AbortController();
  await assert.rejects(createOrderHistoryActions({ list: async () => { late.abort(); return {}; } })
    .list(undefined, { signal: late.signal }), errorKind('cancelled'));
});

test('history actions retain safe domain errors and hide unexpected dependency details', async () => {
  const safe = new OrderHistoryError('Sesión vencida.', 'unauthorized');
  await assert.rejects(createOrderHistoryActions({ list: async () => { throw safe; } }).list(), (error) => error === safe);
  await assert.rejects(createOrderHistoryActions({ get: async () => { throw new Error('private access token'); } }).get(id), errorKind('unknown'));
  const late = new AbortController();
  await assert.rejects(createOrderHistoryActions({ list: async () => { late.abort(); throw new Error('private'); } })
    .list(undefined, { signal: late.signal }), errorKind('cancelled'));
});
