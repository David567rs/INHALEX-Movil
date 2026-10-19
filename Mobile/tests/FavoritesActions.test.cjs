const assert = require('node:assert/strict');
const { test } = require('node:test');
const { FavoritesError } = require('../src/features/favorites/domain/errors/FavoritesError.ts');
const { createFavoritesActions } = require('../src/features/favorites/domain/useCases/createFavoritesActions.ts');

const id = '507f1f77bcf86cd799439011';
const items = Object.freeze([{ id, name: 'Lavanda' }]);
const isFavoritesError = (kind) => (error) => {
  assert.ok(error instanceof FavoritesError);
  assert.equal(error.kind, kind);
  return true;
};

function operation(actions, method, options) {
  return method === 'list' ? actions.list(options) : actions[method](id, options);
}

test('favorites actions forward list, add and remove to their repository with the same cancellation options', async () => {
  const calls = [];
  const options = { signal: new AbortController().signal };
  const actions = createFavoritesActions({
    list: async (receivedOptions) => { calls.push(['list', receivedOptions]); return items; },
    add: async (receivedId, receivedOptions) => { calls.push(['add', receivedId, receivedOptions]); },
    remove: async (receivedId, receivedOptions) => { calls.push(['remove', receivedId, receivedOptions]); },
  });
  assert.equal(await actions.list(options), items);
  assert.equal(await actions.add(id, options), undefined);
  assert.equal(await actions.remove(id, options), undefined);
  assert.deepEqual(calls, [['list', options], ['add', id, options], ['remove', id, options]]);
});

test('favorites actions accept only complete hexadecimal ObjectIds before invoking mutations', async () => {
  let calls = 0;
  const actions = createFavoritesActions({
    list: async () => [], add: async () => { calls++; }, remove: async () => { calls++; },
  });
  for (const candidate of [null, undefined, 1, {}, [], '', ' ', 'lavanda', ` ${id}`, `${id} `,
    id.slice(1), `${id}0`, 'z'.repeat(24), `${id}/other`, `${id}?x=1`, `${id}\n`]) {
    await assert.rejects(actions.add(candidate), isFavoritesError('invalid-request'));
    await assert.rejects(actions.remove(candidate), isFavoritesError('invalid-request'));
  }
  assert.equal(calls, 0);
});

test('favorites actions canonicalize hexadecimal case without accepting padded or coerced IDs', async () => {
  const calls = [];
  const actions = createFavoritesActions({
    list: async () => [], add: async (value) => { calls.push(value); }, remove: async (value) => { calls.push(value); },
  });
  await actions.add(id.toUpperCase());
  await actions.remove(id.toUpperCase());
  assert.deepEqual(calls, [id, id]);
});

test('favorites actions never invoke a repository after cancellation, including an invalid mutation', async () => {
  let calls = 0;
  const actions = createFavoritesActions({
    list: async () => { calls++; return []; }, add: async () => { calls++; }, remove: async () => { calls++; },
  });
  const controller = new AbortController();
  controller.abort();
  for (const method of ['list', 'add', 'remove']) {
    await assert.rejects(operation(actions, method, { signal: controller.signal }), isFavoritesError('cancelled'));
  }
  await assert.rejects(actions.add('invalid', { signal: controller.signal }), isFavoritesError('cancelled'));
  assert.equal(calls, 0);
});

test('favorites actions discard late successes from repositories that ignore cancellation', async () => {
  for (const method of ['list', 'add', 'remove']) {
    let finish;
    const pendingResult = () => new Promise((resolve) => { finish = resolve; });
    const actions = createFavoritesActions({ list: pendingResult, add: pendingResult, remove: pendingResult });
    const controller = new AbortController();
    const pending = operation(actions, method, { signal: controller.signal });
    controller.abort();
    finish(method === 'list' ? items : undefined);
    await assert.rejects(pending, isFavoritesError('cancelled'));
  }
});

test('favorites actions turn late repository failures into cancellation after abort', async () => {
  for (const method of ['list', 'add', 'remove']) {
    let fail;
    const pendingResult = () => new Promise((_resolve, reject) => { fail = reject; });
    const actions = createFavoritesActions({ list: pendingResult, add: pendingResult, remove: pendingResult });
    const controller = new AbortController();
    const pending = operation(actions, method, { signal: controller.signal });
    controller.abort();
    fail(new Error('private late repository diagnostic'));
    await assert.rejects(pending, isFavoritesError('cancelled'));
  }
});

test('favorites actions preserve domain failures and never retry an ambiguous mutation automatically', async () => {
  for (const kind of ['unauthorized', 'network', 'timeout', 'cancelled', 'invalid-response',
    'invalid-request', 'not-found', 'configuration', 'server']) {
    for (const method of ['list', 'add', 'remove']) {
      let calls = 0;
      const failure = new FavoritesError('Aviso seguro de favoritos.', kind);
      const fail = async () => { calls++; throw failure; };
      const actions = createFavoritesActions({ list: fail, add: fail, remove: fail });
      await assert.rejects(operation(actions, method), (error) => error === failure);
      assert.equal(calls, 1);
    }
  }
});

test('favorites actions hide unexpected repository diagnostics without retaining their cause', async () => {
  for (const failure of [new Error('private diagnostic'), 'private value', null]) {
    for (const method of ['list', 'add', 'remove']) {
      const fail = async () => { throw failure; };
      const actions = createFavoritesActions({ list: fail, add: fail, remove: fail });
      await assert.rejects(operation(actions, method), (error) => {
        isFavoritesError('server')(error);
        assert.ok(!error.message.includes('private'));
        assert.equal(error.cause, undefined);
        return true;
      });
    }
  }
});
