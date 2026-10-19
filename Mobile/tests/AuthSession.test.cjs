const assert = require('node:assert/strict');
const { test } = require('node:test');
const { LoginError } = require('../src/features/auth/domain/errors/LoginError.ts');
const { createAuthSession: createCoordinator } = require('../src/features/auth/domain/session/createAuthSession.ts');
const { AUTH_INITIAL_STATE } = require('../src/features/auth/domain/session/AuthSession.ts');

const form = () => ({ email: 'ana@example.com', password: 'exact password' });
const loginResult = (id = 'first') => ({
  accessToken: `test.${id}.signature`,
  user: { id, firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.com', phone: '5512345678' },
});
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const isLoginError = (kind) => (error) => {
  assert.ok(error instanceof LoginError);
  assert.equal(error.kind, kind);
  return true;
};

// These tests exercise login/logout only; restoration has its own suite.
const createAuthSession = (login, store) => createCoordinator(login, {
  get: async () => null,
  ...store,
}, async () => loginResult().user);

test('confirmed public profile updates preserve credentials, project fields and reject obsolete sessions', async () => {
  const writes = [];
  const runtime = createAuthSession(async () => loginResult(), {
    set: async (token) => writes.push(token), clear: async () => {},
  });
  await runtime.session.signIn(form());
  const expected = runtime.session.getSnapshot();
  const token = runtime.getAccessToken();
  const updated = { ...expected.user, firstName: 'Elena', passwordHash: 'never-public', accessToken: 'never-public' };
  assert.equal(runtime.updatePublicUser(updated, expected), true);
  assert.equal(runtime.session.getSnapshot().user.firstName, 'Elena');
  assert.deepEqual(Object.keys(runtime.session.getSnapshot().user).sort(), ['email', 'firstName', 'id', 'lastName', 'phone']);
  assert.equal(runtime.getAccessToken(), token);
  assert.deepEqual(writes, [token]);
  assert.equal(runtime.updatePublicUser(updated, expected), false);
  const current = runtime.session.getSnapshot();
  assert.equal(runtime.updatePublicUser({ ...updated, id: 'another-account' }, current), false);
  assert.equal(runtime.updatePublicUser(updated, current), true);
  assert.equal(runtime.session.getSnapshot(), current, 'identical data does not notify personal collections');
  await runtime.session.signOut();
  assert.equal(runtime.updatePublicUser(updated, current), false);
  assert.equal(runtime.session.getSnapshot().user, null);
});

test('profile publication cannot override a logout performed by a session observer', async () => {
  const runtime = createAuthSession(async () => loginResult(), { set: async () => {}, clear: async () => {} });
  await runtime.session.signIn(form());
  const expected = runtime.session.getSnapshot();
  const unsubscribe = runtime.session.subscribe(() => { if (runtime.session.getSnapshot().user?.firstName === 'Elena') void runtime.session.signOut(); });
  assert.equal(runtime.updatePublicUser({ ...expected.user, firstName: 'Elena' }, expected), false);
  assert.equal(runtime.session.getSnapshot().status, 'anonymous');
  assert.equal(runtime.getAccessToken(), undefined);
  unsubscribe();
});

test('session construction starts in stable checking state without reading or writing any credential', () => {
  let operations = 0;
  const runtime = createAuthSession(async () => { operations++; return loginResult(); }, {
    get: () => { throw new Error('No restoration is allowed'); },
    set: async () => { operations++; },
    clear: async () => { operations++; },
  });
  assert.equal(runtime.session.getSnapshot(), AUTH_INITIAL_STATE);
  assert.equal(Object.isFrozen(AUTH_INITIAL_STATE), true);
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.equal(runtime.getAccessToken(), undefined);
  assert.equal(operations, 0);
});

test('successful login stores only the token and publishes one stable immutable public user', async () => {
  const result = loginResult();
  result.user.accessToken = 'never-public';
  result.user.passwordHash = 'never-public';
  const writes = [];
  let changes = 0;
  const runtime = createAuthSession(async () => result, {
    set: async (...args) => { writes.push(args); },
    clear: async () => { throw new Error('Unexpected clear'); },
  });
  const unsubscribe = runtime.session.subscribe(() => { changes++; });
  const user = await runtime.session.signIn(form());
  assert.deepEqual(writes, [[result.accessToken]]);
  assert.deepEqual(Object.keys(user).sort(), ['email', 'firstName', 'id', 'lastName', 'phone']);
  assert.equal(user, runtime.session.getSnapshot().user);
  assert.equal(user, runtime.session.getSnapshot().user);
  assert.equal(Object.isFrozen(runtime.session.getSnapshot()), true);
  assert.equal(runtime.session.getSnapshot().status, 'authenticated');
  assert.notEqual(user, result.user);
  assert.ok(Object.isFrozen(user));
  assert.ok(!JSON.stringify(user).includes('never-public'));
  assert.equal(runtime.getAccessToken(), result.accessToken);
  assert.equal(changes, 2);
  unsubscribe();
});

test('pending secure storage never publishes a user or makes the token available to HTTP', async () => {
  const writing = deferred();
  const finish = deferred();
  let changes = 0;
  const runtime = createAuthSession(async () => loginResult(), {
    set: () => { writing.resolve(); return finish.promise; },
    clear: async () => {},
  });
  runtime.session.subscribe(() => { changes++; });
  const pending = runtime.session.signIn(form());
  await writing.promise;
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.equal(runtime.getAccessToken(), undefined);
  assert.equal(changes, 1);
  finish.resolve();
  await pending;
  assert.equal(changes, 2);
});

test('the global guard rejects a second login before the first request has completed', async () => {
  const response = deferred();
  let calls = 0;
  let writes = 0;
  const runtime = createAuthSession(() => { calls++; return response.promise; }, {
    set: async () => { writes++; }, clear: async () => {},
  });
  const first = runtime.session.signIn(form());
  await assert.rejects(runtime.session.signIn(form()), isLoginError('configuration'));
  assert.equal(calls, 1);
  assert.equal(writes, 0);
  response.resolve(loginResult());
  await first;
  assert.equal(writes, 1);
});

test('the global guard also covers the secure write', async () => {
  const writing = deferred();
  const finish = deferred();
  let calls = 0;
  const runtime = createAuthSession(async () => { calls++; return loginResult(); }, {
    set: () => { writing.resolve(); return finish.promise; }, clear: async () => {},
  });
  const first = runtime.session.signIn(form());
  await writing.promise;
  await assert.rejects(runtime.session.signIn(form()), isLoginError('configuration'));
  assert.equal(calls, 1);
  finish.resolve();
  await first;
});

test('known action failures are preserved without touching secure storage', async () => {
  const failure = new LoginError('Credenciales incorrectas.', 'credentials');
  let writes = 0;
  const runtime = createAuthSession(async () => { throw failure; }, {
    set: async () => { writes++; }, clear: async () => { writes++; },
  });
  await assert.rejects(runtime.session.signIn(form()), (error) => error === failure);
  assert.equal(writes, 0);
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.equal(runtime.getAccessToken(), undefined);
});

test('unexpected action diagnostics are not exposed or retained as a cause', async () => {
  const runtime = createAuthSession(async () => { throw new Error('private infrastructure or token'); }, {
    set: async () => {}, clear: async () => {},
  });
  await assert.rejects(runtime.session.signIn(form()), (error) => {
    isLoginError('unknown')(error);
    assert.ok(!error.message.includes('private'));
    assert.equal(error.cause, undefined);
    return true;
  });
});

test('a pre-cancelled login never invokes the action or storage', async () => {
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  const runtime = createAuthSession(async () => { calls++; return loginResult(); }, {
    set: async () => { calls++; }, clear: async () => { calls++; },
  });
  await assert.rejects(runtime.session.signIn(form(), { signal: controller.signal }), isLoginError('cancelled'));
  assert.equal(calls, 0);
});

test('cancellation during HTTP discards a late result even when the action ignores its signal', async () => {
  const controller = new AbortController();
  const response = deferred();
  let requestSignal;
  let writes = 0;
  const runtime = createAuthSession((_form, options) => {
    requestSignal = options.signal;
    return response.promise;
  }, { set: async () => { writes++; }, clear: async () => { writes++; } });
  const pending = runtime.session.signIn(form(), { signal: controller.signal });
  controller.abort();
  assert.equal(requestSignal.aborted, true);
  response.resolve(loginResult());
  await assert.rejects(pending, isLoginError('cancelled'));
  assert.equal(writes, 0);
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.equal(runtime.getAccessToken(), undefined);
});

test('cancellation during a secure write waits for rollback and keeps the global guard active', async () => {
  const controller = new AbortController();
  const writing = deferred();
  const finishWrite = deferred();
  const clearing = deferred();
  const finishClear = deferred();
  let storedToken;
  let changes = 0;
  let settled = false;
  const runtime = createAuthSession(async () => loginResult(), {
    set: async (token) => {
      writing.resolve();
      await finishWrite.promise;
      storedToken = token;
    },
    clear: async () => {
      clearing.resolve();
      await finishClear.promise;
      storedToken = undefined;
    },
  });
  runtime.session.subscribe(() => { changes++; });
  const pending = runtime.session.signIn(form(), { signal: controller.signal });
  const rejected = assert.rejects(pending, isLoginError('cancelled'));
  pending.then(() => { settled = true; }, () => { settled = true; });
  await writing.promise;
  controller.abort();
  finishWrite.resolve();
  await clearing.promise;
  assert.equal(storedToken, loginResult().accessToken);
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.equal(runtime.getAccessToken(), undefined);
  assert.equal(settled, false);
  await assert.rejects(runtime.session.signIn(form()), isLoginError('configuration'));
  finishClear.resolve();
  await rejected;
  assert.equal(storedToken, undefined);
  assert.equal(changes, 1);
});

test('an abort after publication does not undo the committed session or clear its token', async () => {
  const controller = new AbortController();
  let clears = 0;
  const runtime = createAuthSession(async () => loginResult(), {
    set: async () => {}, clear: async () => { clears++; },
  });
  const user = await runtime.session.signIn(form(), { signal: controller.signal });
  controller.abort();
  assert.equal(runtime.session.getSnapshot().user, user);
  assert.equal(runtime.getAccessToken(), loginResult().accessToken);
  assert.equal(clears, 0);
});

test('a failed write attempts cleanup and never publishes either user or private token', async () => {
  let storedToken;
  let clears = 0;
  const runtime = createAuthSession(async () => loginResult(), {
    set: async (token) => { storedToken = token; throw new Error('private native storage detail'); },
    clear: async () => { clears++; storedToken = undefined; },
  });
  await assert.rejects(runtime.session.signIn(form()), (error) => {
    isLoginError('storage')(error);
    assert.ok(!error.message.includes('private'));
    assert.equal(error.cause, undefined);
    return true;
  });
  assert.equal(clears, 1);
  assert.equal(storedToken, undefined);
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.equal(runtime.getAccessToken(), undefined);
});

test('failure of write cleanup still leaves the running app anonymous', async () => {
  let clears = 0;
  const runtime = createAuthSession(async () => loginResult(), {
    set: async () => { throw new Error('Write failed'); },
    clear: async () => { clears++; throw new Error('Clear also failed'); },
  });
  await assert.rejects(runtime.session.signIn(form()), isLoginError('storage'));
  assert.equal(clears, 1);
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.equal(runtime.getAccessToken(), undefined);
});

test('failed cancellation cleanup is reported safely instead of claiming a completed rollback', async () => {
  const controller = new AbortController();
  const writing = deferred();
  const finish = deferred();
  const runtime = createAuthSession(async () => loginResult(), {
    set: () => { writing.resolve(); return finish.promise; },
    clear: async () => { throw new Error('private native detail'); },
  });
  const pending = runtime.session.signIn(form(), { signal: controller.signal });
  await writing.promise;
  controller.abort();
  finish.resolve();
  await assert.rejects(pending, (error) => {
    isLoginError('storage')(error);
    assert.match(error.message, /eliminación segura/);
    assert.ok(!error.message.includes('private'));
    return true;
  });
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.equal(runtime.getAccessToken(), undefined);
});

test('logout clears public and private state immediately before the asynchronous storage clear', async () => {
  const clearing = deferred();
  const finish = deferred();
  let changes = 0;
  const runtime = createAuthSession(async () => loginResult(), {
    set: async () => {},
    clear: () => { clearing.resolve(); return finish.promise; },
  });
  runtime.session.subscribe(() => { changes++; });
  await runtime.session.signIn(form());
  const pending = runtime.session.signOut();
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.equal(runtime.getAccessToken(), undefined);
  assert.equal(changes, 3);
  await clearing.promise;
  finish.resolve();
  await pending;
});

test('logout storage failure keeps the app anonymous and reports incomplete secure deletion', async () => {
  const runtime = createAuthSession(async () => loginResult(), {
    set: async () => {}, clear: async () => { throw new Error('private native clear detail'); },
  });
  await runtime.session.signIn(form());
  const pending = runtime.session.signOut();
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.equal(runtime.getAccessToken(), undefined);
  await assert.rejects(pending, (error) => {
    isLoginError('storage')(error);
    assert.match(error.message, /sesión está cerrada/);
    assert.ok(!error.message.includes('private'));
    assert.equal(error.cause, undefined);
    return true;
  });
});

test('logout cancels a pending HTTP login and cannot be undone by its late result', async () => {
  const response = deferred();
  let requestSignal;
  let writes = 0;
  let clears = 0;
  const runtime = createAuthSession((_form, options) => {
    requestSignal = options.signal;
    return response.promise;
  }, { set: async () => { writes++; }, clear: async () => { clears++; } });
  const pending = runtime.session.signIn(form());
  await runtime.session.signOut();
  assert.equal(requestSignal.aborted, true);
  response.resolve(loginResult());
  await assert.rejects(pending, isLoginError('cancelled'));
  assert.equal(writes, 0);
  assert.equal(clears, 1);
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.equal(runtime.getAccessToken(), undefined);
});

test('logout, a cancelled write rollback and a new login are serialized without deleting the new token', async () => {
  const firstWriting = deferred();
  const finishFirstWrite = deferred();
  const logoutClearing = deferred();
  const finishLogoutClear = deferred();
  const newRequest = deferred();
  const events = [];
  let loginCalls = 0;
  let clearCalls = 0;
  let storedToken;
  const runtime = createAuthSession(async () => {
    loginCalls++;
    if (loginCalls === 2) newRequest.resolve();
    return loginResult(loginCalls === 1 ? 'first' : 'second');
  }, {
    set: async (token) => {
      events.push(`set:${token}`);
      if (token === loginResult('first').accessToken) {
        firstWriting.resolve();
        await finishFirstWrite.promise;
      }
      storedToken = token;
    },
    clear: async () => {
      clearCalls++;
      events.push(`clear:${clearCalls}`);
      if (clearCalls === 2) {
        logoutClearing.resolve();
        await finishLogoutClear.promise;
      }
      storedToken = undefined;
    },
  });
  const first = runtime.session.signIn(form());
  const firstRejected = assert.rejects(first, isLoginError('cancelled'));
  await firstWriting.promise;
  const logout = runtime.session.signOut();
  finishFirstWrite.resolve();
  await firstRejected;
  await logoutClearing.promise;
  const second = runtime.session.signIn(form());
  await newRequest.promise;
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.equal(runtime.getAccessToken(), undefined);
  assert.equal(events.filter((entry) => entry.startsWith('set:')).length, 1);
  finishLogoutClear.resolve();
  await logout;
  const user = await second;
  assert.equal(user.id, 'second');
  assert.equal(runtime.getAccessToken(), loginResult('second').accessToken);
  assert.equal(storedToken, loginResult('second').accessToken);
  assert.deepEqual(events, [
    'set:test.first.signature', 'clear:1', 'clear:2', 'set:test.second.signature',
  ]);
});

test('a failed storage mutation does not poison the queue or block a later successful login', async () => {
  let writes = 0;
  const runtime = createAuthSession(async () => loginResult(), {
    set: async () => { writes++; if (writes === 1) throw new Error('First write failed'); },
    clear: async () => {},
  });
  await assert.rejects(runtime.session.signIn(form()), isLoginError('storage'));
  const user = await runtime.session.signIn(form());
  assert.equal(user, runtime.session.getSnapshot().user);
  assert.equal(writes, 2);
});

test('unsubscribed and failing observers cannot corrupt session commits or stop other observers', async () => {
  let unsubscribedCalls = 0;
  let changes = 0;
  const runtime = createAuthSession(async () => loginResult(), { set: async () => {}, clear: async () => {} });
  const unsubscribe = runtime.session.subscribe(() => { unsubscribedCalls++; });
  unsubscribe();
  runtime.session.subscribe(() => { throw new Error('Observer failure'); });
  runtime.session.subscribe(() => { changes++; });
  const user = await runtime.session.signIn(form());
  assert.equal(runtime.session.getSnapshot().user, user);
  await runtime.session.signOut();
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.equal(unsubscribedCalls, 0);
  assert.equal(changes, 3);
});
