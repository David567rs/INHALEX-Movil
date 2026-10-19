const assert = require('node:assert/strict');
const { test } = require('node:test');
const { CartError } = require('../src/features/cart/domain/errors/CartError.ts');
const { createCartActions } = require('../src/features/cart/domain/useCases/cartActions.ts');

const id = '507f1f77bcf86cd799439011';
const cart = Object.freeze({ items: Object.freeze([]), totalItems: 0, subtotal: 0, currency: 'MXN' });
const methods = ['list', 'add', 'updateQuantity', 'remove'];
const isCartError = (kind) => (error) => {
  assert.ok(error instanceof CartError);
  assert.equal(error.kind, kind);
  return true;
};

function call(actions, method, options) {
  if (method === 'list') return actions.list(options);
  if (method === 'remove') return actions.remove(id, options);
  return actions[method](id, 2, options);
}

function repository(operation) {
  return { list: operation, add: operation, updateQuantity: operation, remove: operation };
}

test('cart actions forward all four operations and return the confirmed cart without deriving local totals', async () => {
  const calls = [];
  const options = { signal: new AbortController().signal };
  const actions = createCartActions(Object.fromEntries(methods.map((method) => [method, async (...args) => {
    calls.push([method, ...args]);
    return cart;
  }])));
  for (const method of methods) assert.equal(await call(actions, method, options), cart);
  assert.deepEqual(calls, [
    ['list', options], ['add', id, 2, options], ['updateQuantity', id, 2, options], ['remove', id, options],
  ]);
});

test('cart actions reject malformed IDs before any repository mutation', async () => {
  let calls = 0;
  const actions = createCartActions(repository(async () => { calls++; return cart; }));
  for (const value of [null, undefined, 1, {}, [], '', ' ', 'lavanda', 'preview-bag-lavanda',
    ` ${id}`, `${id} `, id.slice(1), `${id}0`, 'z'.repeat(24), `${id}/other`, `${id}?x=1`, `${id}\n`]) {
    await assert.rejects(actions.add(value, 1), isCartError('invalid-request'));
    await assert.rejects(actions.updateQuantity(value, 1), isCartError('invalid-request'));
    await assert.rejects(actions.remove(value), isCartError('invalid-request'));
  }
  assert.equal(calls, 0);
});

test('cart actions reject non-integer and out-of-range quantities without coercion', async () => {
  let calls = 0;
  const actions = createCartActions(repository(async () => { calls++; return cart; }));
  for (const value of [null, undefined, '1', true, {}, [], NaN, Infinity, -Infinity,
    -1, 0, 1.1, 24.9, 26, Number.MAX_SAFE_INTEGER]) {
    await assert.rejects(actions.add(id, value), isCartError('invalid-request'));
    await assert.rejects(actions.updateQuantity(id, value), isCartError('invalid-request'));
  }
  assert.equal(calls, 0);
});

test('cart actions accept both quantity bounds and canonicalize IDs without padding or clamping', async () => {
  const calls = [];
  const actions = createCartActions(repository(async (...args) => { calls.push(args); return cart; }));
  for (const quantity of [1, 25]) {
    await actions.add(id.toUpperCase(), quantity);
    await actions.updateQuantity(id.toUpperCase(), quantity);
  }
  await actions.remove(id.toUpperCase());
  assert.deepEqual(calls, [[id, 1, undefined], [id, 1, undefined],
    [id, 25, undefined], [id, 25, undefined], [id, undefined]]);
});

test('cart actions never call the repository after abort, including invalid mutation inputs', async () => {
  let calls = 0;
  const actions = createCartActions(repository(async () => { calls++; return cart; }));
  const controller = new AbortController();
  controller.abort();
  const options = { signal: controller.signal };
  for (const method of methods) await assert.rejects(call(actions, method, options), isCartError('cancelled'));
  await assert.rejects(actions.add('bad', 0, options), isCartError('cancelled'));
  await assert.rejects(actions.updateQuantity('bad', 26, options), isCartError('cancelled'));
  assert.equal(calls, 0);
});

test('cart actions discard late successes from repositories that ignore abort', async () => {
  for (const method of methods) {
    let finish;
    const actions = createCartActions(repository(() => new Promise((resolve) => { finish = resolve; })));
    const controller = new AbortController();
    const pending = call(actions, method, { signal: controller.signal });
    controller.abort();
    finish(cart);
    await assert.rejects(pending, isCartError('cancelled'));
  }
});

test('cart actions replace late repository failures with cancellation after abort', async () => {
  for (const method of methods) {
    let fail;
    const actions = createCartActions(repository(() => new Promise((_resolve, reject) => { fail = reject; })));
    const controller = new AbortController();
    const pending = call(actions, method, { signal: controller.signal });
    controller.abort();
    fail(new Error('private late database diagnostic'));
    await assert.rejects(pending, isCartError('cancelled'));
  }
});

test('cart actions preserve domain errors and never retry an ambiguous write', async () => {
  for (const kind of ['unauthorized', 'network', 'timeout', 'cancelled', 'invalid-response',
    'invalid-request', 'not-found', 'configuration', 'server']) {
    for (const method of methods) {
      let calls = 0;
      const failure = new CartError('Aviso seguro de la bolsa.', kind);
      const actions = createCartActions(repository(async () => { calls++; throw failure; }));
      await assert.rejects(call(actions, method), (error) => error === failure);
      assert.equal(calls, 1);
    }
  }
});

test('cart actions hide unexpected diagnostics without exposing a transport cause', async () => {
  for (const failure of [new Error('private connection details'), 'private value', null]) {
    for (const method of methods) {
      const actions = createCartActions(repository(async () => { throw failure; }));
      await assert.rejects(call(actions, method), (error) => {
        isCartError('server')(error);
        assert.equal(error.cause, undefined);
        assert.ok(!error.message.includes('private'));
        return true;
      });
    }
  }
});
