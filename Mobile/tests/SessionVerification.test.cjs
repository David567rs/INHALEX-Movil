const assert = require('node:assert/strict');
const { test } = require('node:test');
const { SessionError } = require('../src/features/auth/domain/errors/SessionError.ts');
const { createVerifySession, isSessionToken } = require('../src/features/auth/domain/useCases/verifySession.ts');

const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLWlkIn0.dGVzdC1zaWduYXR1cmU';
const user = { id: 'user-id', firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.com', phone: '5512345678' };

test('session use case rejects corrupt or unsafe compact tokens before invoking its repository', async () => {
  let calls = 0;
  const verify = createVerifySession({ verify: async () => { calls++; return user; } });
  for (const candidate of [undefined, null, 123, [], {}, '', ' ', 'not-a-jwt', 'a.b', 'a.b.',
    '.b.c', 'a..c', 'a.b.c.d', ` ${token}`, `${token}\n`, `${token}\r\nInjected: value`, 'a.b.c\u0000']) {
    assert.equal(isSessionToken(candidate), false);
    await assert.rejects(verify(candidate), (error) => {
      assert.ok(error instanceof SessionError);
      assert.equal(error.kind, 'unauthorized');
      assert.ok(!error.message.includes('Injected'));
      assert.ok(!error.message.includes(token));
      return true;
    });
  }
  assert.equal(calls, 0);
});

test('session use case delegates authority to the server without decoding claims or locally judging expiration', async () => {
  const seen = [];
  const verify = createVerifySession({ verify: async (candidate, options) => {
    seen.push({ candidate, options });
    return user;
  } });
  const options = { signal: new AbortController().signal };
  for (const candidate of [token, 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjF9.dGVzdA', 'YQ.Yg.Yw']) {
    assert.equal(isSessionToken(candidate), true);
    assert.equal(await verify(candidate, options), user);
    assert.equal(seen.at(-1).candidate, candidate);
    assert.equal(seen.at(-1).options, options);
  }
});

test('session use case does not invoke its repository after caller cancellation', async () => {
  let calls = 0;
  const verify = createVerifySession({ verify: async () => { calls++; return user; } });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(verify(token, { signal: controller.signal }), (error) => {
    assert.ok(error instanceof SessionError);
    assert.equal(error.kind, 'cancelled');
    return true;
  });
  assert.equal(calls, 0);
});

test('session use case discards a late user if the repository ignores cancellation', async () => {
  const controller = new AbortController();
  let finish;
  const verify = createVerifySession({ verify: () => new Promise((resolve) => { finish = resolve; }) });
  const pending = verify(token, { signal: controller.signal });
  controller.abort();
  finish(user);
  await assert.rejects(pending, (error) => {
    assert.ok(error instanceof SessionError);
    assert.equal(error.kind, 'cancelled');
    return true;
  });
});

test('session use case does not turn a late unauthorized error into token invalidation after cancellation', async () => {
  const controller = new AbortController();
  let fail;
  const verify = createVerifySession({ verify: () => new Promise((_resolve, reject) => { fail = reject; }) });
  const pending = verify(token, { signal: controller.signal });
  controller.abort();
  fail(new SessionError('Expired', 'unauthorized'));
  await assert.rejects(pending, (error) => {
    assert.ok(error instanceof SessionError);
    assert.equal(error.kind, 'cancelled');
    return true;
  });
});

test('session use case preserves domain error classification and never retries automatically', async () => {
  for (const kind of ['unauthorized', 'network', 'timeout', 'cancelled', 'configuration',
    'invalid-response', 'server', 'storage']) {
    let calls = 0;
    const failure = new SessionError('Safe domain message', kind);
    const verify = createVerifySession({ verify: async () => { calls++; throw failure; } });
    await assert.rejects(verify(token), (error) => error === failure);
    assert.equal(calls, 1);
  }
});

test('session use case converts unexpected diagnostics into a safe error without retaining secrets', async () => {
  const verify = createVerifySession({ verify: async () => { throw new Error(`private candidate ${token}`); } });
  await assert.rejects(verify(token), (error) => {
    assert.ok(error instanceof SessionError);
    assert.equal(error.kind, 'unknown');
    assert.ok(!error.message.includes('private'));
    assert.ok(!error.message.includes(token));
    assert.equal(error.cause, undefined);
    return true;
  });
});
