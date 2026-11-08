const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiAccountDeletionRepository } = require('../src/features/accountDeletion/data/ApiAccountDeletionRepository.ts');
const { AccountDeletionError, validateDeletion } = require('../src/features/accountDeletion/domain/AccountDeletion.ts');
const { createAccountDeletionController } = require('../src/features/accountDeletion/presentation/state/createAccountDeletionController.ts');

const receipt = Object.freeze({ id: '123456789012345678901234', status: 'pending', createdAt: '2026-11-08T12:00:00.000Z' });
const input = { password: 'current password', confirmation: 'ELIMINAR' };
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
function api(fetch) {
  return new ApiAccountDeletionRepository(new HttpClient({ baseUrl: 'https://api.example/api', requestTimeoutMs: 1000, fetch, getAccessToken: () => 'test-token' }));
}
function deferred() { let resolve; let reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function setup(repository) {
  let auth = { status: 'authenticated', user: { id: 'owner' } };
  const listeners = new Set();
  const session = { getSnapshot: () => auth, subscribe: (listener) => { listeners.add(listener); return () => listeners.delete(listener); } };
  const controller = createAccountDeletionController(session, repository);
  controller.start();
  return { controller, change(next) { auth = next; for (const listener of listeners) listener(); }, silentlyChange(next) { auth = next; } };
}

test('deletion validates explicit confirmation before contacting the API', async () => {
  let calls = 0;
  const repo = api(async () => { calls++; return json({ request: receipt }); });
  for (const invalid of [{ password: '', confirmation: 'ELIMINAR' }, { password: 'a'.repeat(129), confirmation: 'ELIMINAR' }, { ...input, confirmation: 'eliminar' }]) {
    assert.ok(validateDeletion(invalid));
    await assert.rejects(repo.request(invalid), (error) => error.kind === 'validation');
  }
  assert.equal(calls, 0);
  assert.equal(validateDeletion({ ...input, confirmation: ' ELIMINAR ' }), null);
});

test('deletion uses authenticated endpoints, exact body and a minimal frozen response', async () => {
  const calls = [];
  const repo = api(async (url, options) => { calls.push({ url, options }); return json({ request: { ...receipt, email: 'private@example.com', password: 'never copy' } }); });
  const result = await repo.request(input);
  assert.deepEqual(result, receipt);
  assert.ok(Object.isFrozen(result));
  assert.equal(calls[0].url, 'https://api.example/api/account-deletion/me');
  assert.equal(calls[0].options.method, 'POST');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer test-token');
  assert.deepEqual(JSON.parse(calls[0].options.body), input);
  assert.equal(calls[0].options.credentials, 'omit');
  await repo.get();
  assert.equal(calls[1].options.method, 'GET');
  assert.equal(calls[1].options.body, undefined);
});

test('deletion accepts an empty GET but rejects malformed or empty write receipts', async () => {
  assert.equal(await api(async () => json({ request: null })).get(), null);
  for (const body of [null, {}, { request: null }, { request: { ...receipt, id: 'foreign' } }, { request: { ...receipt, status: 'deleted' } }, { request: { ...receipt, createdAt: 'tomorrow' } }]) {
    await assert.rejects(api(async () => json(body)).request(input), (error) => error.kind === 'unavailable');
  }
});

test('a rejected password is distinct from an expired read session and raw errors stay private', async () => {
  const repo = api(async () => json({ message: 'sensitive raw response' }, 401));
  await assert.rejects(repo.request(input), (error) => error.kind === 'reauthentication' && !error.message.includes('sensitive'));
  await assert.rejects(repo.get(), (error) => error.kind === 'unauthorized');
  await assert.rejects(api(async () => { throw new Error('private server failure'); }).request(input), (error) => error.kind === 'unavailable' && !error.message.includes('private'));
});

test('double taps send only one request and snapshots never retain credentials', async () => {
  const pending = deferred(); let writes = 0;
  const { controller } = setup({ get: async () => null, request: async () => { writes++; return pending.promise; } });
  await controller.submit(input);
  assert.equal(writes, 0, 'must first query for an existing request');
  await controller.refresh();
  const first = controller.submit(input);
  await controller.submit(input);
  assert.equal(writes, 1);
  assert.equal(controller.getSnapshot().busy, true);
  assert.equal(JSON.stringify(controller.getSnapshot()).includes(input.password), false);
  pending.resolve(receipt); await first;
  await controller.submit(input);
  assert.equal(writes, 1, 'acknowledged requests cannot be sent again');
  assert.deepEqual(controller.getSnapshot().request, receipt);
});

test('uncertain writes require verification and verification never publishes automatically', async () => {
  let writes = 0; let reads = 0; let registered = null;
  const { controller } = setup({ get: async () => { reads++; return registered; }, request: async () => { writes++; registered = receipt; throw new Error('response lost'); } });
  await controller.refresh(); await controller.submit(input);
  assert.equal(controller.getSnapshot().requiresVerification, true);
  await controller.submit(input); assert.equal(writes, 1);
  await controller.refresh();
  assert.deepEqual(controller.getSnapshot().request, receipt);
  assert.equal(controller.getSnapshot().requiresVerification, false);
  assert.equal(reads, 2); assert.equal(writes, 1);
});

test('verification with no request re-enables only a new explicit submission', async () => {
  let writes = 0;
  const { controller } = setup({ get: async () => null, request: async () => { writes++; throw new AccountDeletionError('connection', 'unavailable'); } });
  await controller.refresh(); await controller.submit(input); await controller.refresh();
  assert.equal(writes, 1); assert.equal(controller.getSnapshot().requiresVerification, false);
  await controller.submit(input); assert.equal(writes, 2);
});

test('failed reads and stale empty reads preserve an acknowledged receipt', async () => {
  let failure = false;
  const { controller } = setup({ get: async () => { if (failure) throw new Error('offline'); return null; }, request: async () => receipt });
  await controller.refresh(); await controller.submit(input); failure = true; await controller.refresh();
  assert.deepEqual(controller.getSnapshot().request, receipt);
  assert.ok(controller.getSnapshot().message);
  failure = false; await controller.refresh();
  assert.deepEqual(controller.getSnapshot().request, receipt);
  assert.equal(controller.getSnapshot().message, null);
});

test('reauthentication rejection verifies the session before accepting a corrected password', async () => {
  let writes = 0;
  const { controller } = setup({ get: async () => null, request: async () => { if (++writes === 1) throw new AccountDeletionError('password', 'reauthentication'); return receipt; } });
  await controller.refresh(); await controller.submit(input);
  assert.equal(controller.getSnapshot().expired, false);
  assert.equal(controller.getSnapshot().requiresVerification, true);
  await controller.submit(input); assert.equal(writes, 1);
  await controller.refresh();
  assert.equal(controller.getSnapshot().requiresVerification, false);
  await controller.submit(input); assert.deepEqual(controller.getSnapshot().request, receipt);
});

test('a session change while notifying busy prevents the private request from starting', async () => {
  for (const write of [false, true]) {
    let reads = 0; let writes = 0;
    const { controller, change } = setup({ get: async () => { reads++; return null; }, request: async () => { writes++; return receipt; } });
    if (write) await controller.refresh();
    controller.subscribe(() => { if (controller.getSnapshot().busy) change({ status: 'anonymous', user: null }); });
    if (write) await controller.submit(input); else await controller.refresh();
    assert.equal(reads, write ? 1 : 0); assert.equal(writes, 0);
    assert.equal(controller.getSnapshot().request, null);
  }
});

test('stopping a pending write requires verification and ignores its late response', async () => {
  const pending = deferred(); let registered = null; let writes = 0; let signal;
  const { controller } = setup({ get: async () => registered, request: async (_, value) => { writes++; signal = value; return pending.promise; } });
  await controller.refresh(); const first = controller.submit(input);
  controller.stop(); controller.start();
  assert.equal(signal.aborted, true); assert.equal(controller.getSnapshot().loaded, false);
  assert.equal(controller.getSnapshot().requiresVerification, true);
  await controller.submit(input); assert.equal(writes, 1);
  registered = receipt; pending.resolve(receipt); await first;
  assert.equal(controller.getSnapshot().request, null);
  await controller.refresh(); assert.deepEqual(controller.getSnapshot().request, receipt);
  await controller.submit(input); assert.equal(writes, 1);
});

test('a changed session hides private receipts before subscription callbacks arrive', async () => {
  const { controller, silentlyChange } = setup({ get: async () => receipt, request: async () => receipt });
  await controller.refresh(); assert.deepEqual(controller.getSnapshot().request, receipt);
  silentlyChange({ status: 'authenticated', user: { id: 'other' } });
  assert.equal(controller.getSnapshot().request, null); assert.equal(controller.getSnapshot().loaded, false);
});

test('focus before provider mount queues one read and never sends a write', async () => {
  let reads = 0; let writes = 0;
  const auth = { status: 'authenticated', user: { id: 'owner' } };
  const controller = createAccountDeletionController({ getSnapshot: () => auth, subscribe: () => () => {} }, {
    get: async () => { reads++; return receipt; }, request: async () => { writes++; return receipt; },
  });
  await controller.refresh(); await controller.refresh(); assert.equal(reads, 0);
  controller.start(); await new Promise(setImmediate);
  assert.equal(reads, 1); assert.equal(writes, 0); assert.deepEqual(controller.getSnapshot().request, receipt);
});

test('logout immediately clears data, aborts reads and ignores late completion after signing back in', async () => {
  const pending = deferred(); let signal;
  const { controller, change } = setup({ get: async (value) => { signal = value; return pending.promise; }, request: async () => receipt });
  const read = controller.refresh();
  change({ status: 'anonymous', user: null });
  assert.equal(signal.aborted, true); assert.equal(controller.getSnapshot().request, null);
  change({ status: 'authenticated', user: { id: 'owner' } });
  pending.resolve(receipt); await read;
  assert.equal(controller.getSnapshot().request, null); assert.equal(controller.getSnapshot().loaded, false);
});

test('late POST after changing accounts cannot expose the previous receipt', async () => {
  const pending = deferred(); let signal;
  const { controller, change } = setup({ get: async () => null, request: async (_, value) => { signal = value; return pending.promise; } });
  await controller.refresh(); const write = controller.submit(input);
  change({ status: 'authenticated', user: { id: 'other' } });
  assert.equal(signal.aborted, true); pending.resolve(receipt); await write;
  assert.equal(controller.getSnapshot().request, null); assert.equal(controller.getSnapshot().loaded, false);
});

test('expired sessions clear acknowledged receipts and stop new requests', async () => {
  let expired = false; let writes = 0; let reads = 0;
  const { controller } = setup({ get: async () => { reads++; if (expired) throw new AccountDeletionError('expired', 'unauthorized'); return null; }, request: async () => { writes++; return receipt; } });
  await controller.refresh(); await controller.submit(input); expired = true; await controller.refresh();
  assert.equal(controller.getSnapshot().request, null); assert.equal(controller.getSnapshot().expired, true);
  await controller.refresh(); await controller.submit(input); assert.equal(reads, 2); assert.equal(writes, 1);
});

test('anonymous and stopped controllers do not contact private endpoints', async () => {
  let calls = 0;
  const { controller, change } = setup({ get: async () => { calls++; return null; }, request: async () => { calls++; return receipt; } });
  change({ status: 'anonymous', user: null }); await controller.refresh(); await controller.submit(input);
  change({ status: 'authenticated', user: { id: 'owner' } }); controller.stop(); await controller.refresh(); await controller.submit(input);
  assert.equal(calls, 0);
});
