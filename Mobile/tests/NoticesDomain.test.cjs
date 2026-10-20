const assert = require('node:assert/strict');
const { test } = require('node:test');
const { NoticesError } = require('../src/features/notices/domain/errors/NoticesError.ts');
const { createNoticesActions, normalizeNoticeId } = require('../src/features/notices/domain/useCases/noticesActions.ts');

const ID = '507f1f77bcf86cd799439011';
const errorKind = (kind) => (error) => {
  assert.ok(error instanceof NoticesError); assert.equal(error.kind, kind);
  assert.equal(error.cause, undefined); assert.doesNotMatch(error.message, /private|token|stack/); return true;
};

test('notice list action preserves the authoritative global counter instead of deriving it from returned rows', async () => {
  const inbox = Object.freeze({ items: Object.freeze([]), unread: 17 }); let received;
  const actions = createNoticesActions({ list: async (options) => { received = options; return inbox; } });
  const options = { signal: new AbortController().signal };
  assert.equal(await actions.list(options), inbox); assert.equal(received, options); assert.equal(inbox.unread, 17);
});

test('mark-read action normalizes the selected ID, forwards cancellation and returns only the server confirmation', async () => {
  const notice = Object.freeze({ id: ID, readAt: '2026-10-20T16:00:00.000Z' }); let received;
  const actions = createNoticesActions({ markRead: async (...args) => { received = args; return notice; } });
  const options = { signal: new AbortController().signal };
  assert.equal(await actions.markRead(ID.toUpperCase(), options), notice); assert.deepEqual(received, [ID, options]);
});

test('notice ID validation blocks malformed identifiers and query injection before the repository', async () => {
  assert.equal(normalizeNoticeId(ID.toUpperCase()), ID); let calls = 0;
  const actions = createNoticesActions({ markRead: async () => ++calls });
  for (const id of [undefined, null, [], {}, 42, '', `${ID}\n`, ` ${ID}`, 'g'.repeat(24), 'a'.repeat(25), '../notices', `${ID}?userId=other`]) {
    await assert.rejects(actions.markRead(id), errorKind('invalid-request'));
  }
  assert.equal(calls, 0);
});

test('already cancelled notice actions never start reads or mutations', async () => {
  const abort = new AbortController(); abort.abort(); let calls = 0;
  const actions = createNoticesActions({ list: async () => ++calls, markRead: async () => ++calls });
  await assert.rejects(actions.list({ signal: abort.signal }), errorKind('cancelled'));
  await assert.rejects(actions.markRead(ID, { signal: abort.signal }), errorKind('cancelled')); assert.equal(calls, 0);
});

test('late cancellation suppresses both a list response and a mark-read response', async () => {
  for (const operation of ['list', 'markRead']) {
    const abort = new AbortController();
    const actions = createNoticesActions({ [operation]: async () => { abort.abort(); return {}; } });
    await assert.rejects(operation === 'list' ? actions.list({ signal: abort.signal }) : actions.markRead(ID, { signal: abort.signal }), errorKind('cancelled'));
  }
});

test('notice actions preserve safe domain failures and hide unexpected dependency diagnostics', async () => {
  const known = new NoticesError('Ese aviso ya no está disponible.', 'not-found');
  await assert.rejects(createNoticesActions({ markRead: async () => { throw known; } }).markRead(ID), (error) => error === known);
  await assert.rejects(createNoticesActions({ list: async () => { throw new Error('private token stack'); } }).list(), errorKind('unknown'));
});

test('cancellation takes precedence over an obsolete authorization error from a mutation', async () => {
  const abort = new AbortController();
  const actions = createNoticesActions({ markRead: async () => { abort.abort(); throw new NoticesError('Sesión vencida.', 'unauthorized'); } });
  await assert.rejects(actions.markRead(ID, { signal: abort.signal }), errorKind('cancelled'));
});
