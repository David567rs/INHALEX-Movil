const assert = require('node:assert/strict');
const { test } = require('node:test');
const { LoginError } = require('../src/features/auth/domain/errors/LoginError.ts');
const { SessionError } = require('../src/features/auth/domain/errors/SessionError.ts');
const { AUTH_INITIAL_STATE } = require('../src/features/auth/domain/session/AuthSession.ts');
const { createAuthSession } = require('../src/features/auth/domain/session/createAuthSession.ts');

const savedToken = 'test.saved.signature';
const newToken = 'test.new.signature';
const form = () => ({ email: 'ana@example.com', password: 'exact password' });
const user = (id = 'saved') => ({
  id, firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.com', phone: '5512345678',
});
const login = async () => ({ accessToken: newToken, user: user('new') });
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

test('the shared initial snapshot is stable, frozen and safe for server rendering without any I/O', () => {
  let calls = 0;
  const store = { get: async () => { calls++; return savedToken; }, set: async () => {}, clear: async () => {} };
  const first = createAuthSession(login, store, async () => { calls++; return user(); });
  const second = createAuthSession(login, store, async () => { calls++; return user(); });
  assert.equal(first.session.getSnapshot(), AUTH_INITIAL_STATE);
  assert.equal(second.session.getSnapshot(), AUTH_INITIAL_STATE);
  assert.equal(first.session.getSnapshot(), first.session.getSnapshot());
  assert.deepEqual(AUTH_INITIAL_STATE, { status: 'checking', user: null, message: null });
  assert.equal(Object.isFrozen(AUTH_INITIAL_STATE), true);
  assert.equal(first.getAccessToken(), undefined);
  assert.equal(calls, 0);
});

test('no saved token settles anonymous without an HTTP call or a write and is final for this runtime', async () => {
  let reads = 0;
  let otherOperations = 0;
  const runtime = createAuthSession(login, {
    get: async () => { reads++; return null; },
    set: async () => { otherOperations++; }, clear: async () => { otherOperations++; },
  }, async () => { otherOperations++; return user(); });
  await runtime.session.restore();
  const state = runtime.session.getSnapshot();
  assert.deepEqual(state, { status: 'anonymous', user: null, message: null });
  assert.equal(Object.isFrozen(state), true);
  await runtime.session.restore();
  assert.equal(runtime.session.getSnapshot(), state);
  assert.equal(reads, 1);
  assert.equal(otherOperations, 0);
});

test('the saved token remains private while reading and verifying, then publishes only the validated user', async () => {
  const reading = deferred();
  const finishRead = deferred();
  const verifying = deferred();
  const response = deferred();
  let mutations = 0;
  let receivedToken;
  const runtime = createAuthSession(login, {
    get: () => { reading.resolve(); return finishRead.promise; },
    set: async () => { mutations++; }, clear: async () => { mutations++; },
  }, (token) => { receivedToken = token; verifying.resolve(); return response.promise; });
  const restoring = runtime.session.restore();
  await reading.promise;
  assert.equal(runtime.session.getSnapshot(), AUTH_INITIAL_STATE);
  assert.equal(runtime.getAccessToken(), undefined);
  finishRead.resolve(savedToken);
  await verifying.promise;
  assert.equal(receivedToken, savedToken);
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.equal(runtime.getAccessToken(), undefined);
  const profile = { ...user(), accessToken: 'not-public', passwordHash: 'not-public' };
  response.resolve(profile);
  await restoring;
  const state = runtime.session.getSnapshot();
  assert.equal(state.status, 'authenticated');
  assert.deepEqual(state.user, user());
  assert.notEqual(state.user, profile);
  assert.equal(Object.isFrozen(state.user), true);
  assert.ok(!JSON.stringify(state).includes('not-public'));
  assert.ok(!JSON.stringify(state).includes(savedToken));
  assert.equal(runtime.getAccessToken(), savedToken);
  assert.equal(mutations, 0);
});

test('StrictMode-style repeated startup shares one restoration even after consumers unsubscribe and resubscribe', async () => {
  const response = deferred();
  let reads = 0;
  let checks = 0;
  const runtime = createAuthSession(login, {
    get: async () => { reads++; return savedToken; }, set: async () => {}, clear: async () => {},
  }, () => { checks++; return response.promise; });
  const unsubscribe = runtime.session.subscribe(() => {});
  const first = runtime.session.restore();
  unsubscribe();
  runtime.session.subscribe(() => {});
  const replay = runtime.session.restore();
  assert.equal(first, replay);
  response.resolve(user());
  await first;
  const state = runtime.session.getSnapshot();
  await runtime.session.restore();
  assert.equal(runtime.session.getSnapshot(), state);
  assert.equal(reads, 1);
  assert.equal(checks, 1);
});

test('empty or malformed saved tokens are removed without sending them to the server', async () => {
  for (const token of ['', '  ', 'not-a-jwt', 'test.saved.signature\n', 'test.unsafe/token.signature']) {
    let checks = 0;
    let clears = 0;
    const runtime = createAuthSession(login, {
      get: async () => token, set: async () => {}, clear: async () => { clears++; },
    }, async () => { checks++; return user(); });
    await assert.doesNotReject(runtime.session.restore());
    assert.equal(runtime.session.getSnapshot().status, 'anonymous');
    assert.equal(runtime.session.getSnapshot().user, null);
    assert.match(runtime.session.getSnapshot().message, /Inicia sesión de nuevo/);
    assert.equal(runtime.getAccessToken(), undefined);
    assert.equal(checks, 0);
    assert.equal(clears, 1);
  }
});

test('a rejected or expired server session is deleted and becomes anonymous with a safe message', async () => {
  let stored = savedToken;
  let checks = 0;
  let clears = 0;
  const runtime = createAuthSession(login, {
    get: async () => stored,
    set: async () => { throw new Error('Restoration must not rewrite credentials'); },
    clear: async () => { clears++; stored = null; },
  }, async () => { checks++; throw new SessionError('Sesión rechazada.', 'unauthorized'); });
  await runtime.session.restore();
  assert.equal(runtime.session.getSnapshot().status, 'anonymous');
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.match(runtime.session.getSnapshot().message, /Inicia sesión de nuevo/);
  assert.equal(stored, null);
  assert.equal(runtime.getAccessToken(), undefined);
  await runtime.session.restore();
  assert.equal(checks, 1);
  assert.equal(clears, 1);
});

test('recoverable verification errors keep the saved token and retry only when explicitly requested', async () => {
  for (const kind of ['network', 'timeout', 'server', 'configuration', 'invalid-response', 'storage', 'unknown', 'cancelled']) {
    let checks = 0;
    let reads = 0;
    let mutations = 0;
    const runtime = createAuthSession(login, {
      get: async () => { reads++; return savedToken; },
      set: async () => { mutations++; }, clear: async () => { mutations++; },
    }, async () => {
      checks++;
      if (checks === 1) throw new SessionError('No pudimos comprobar tu sesión. Inténtalo de nuevo.', kind);
      return user();
    });
    await assert.doesNotReject(runtime.session.restore());
    assert.equal(runtime.session.getSnapshot().status, 'recovery-error', kind);
    assert.equal(runtime.session.getSnapshot().user, null);
    assert.equal(runtime.getAccessToken(), undefined);
    assert.equal(checks, 1);
    assert.equal(mutations, 0);
    await runtime.session.restore();
    assert.equal(runtime.session.getSnapshot().status, 'authenticated', kind);
    assert.equal(runtime.getAccessToken(), savedToken);
    assert.equal(checks, 2);
    assert.equal(reads, 2);
    assert.equal(mutations, 0);
  }
});

test('a failed native read is observed as recovery state, hides diagnostics and can be retried', async () => {
  let reads = 0;
  let checks = 0;
  let clears = 0;
  const runtime = createAuthSession(login, {
    get: async () => {
      reads++;
      if (reads === 1) throw new Error(`private native error: ${savedToken}`);
      return savedToken;
    },
    set: async () => {}, clear: async () => { clears++; },
  }, async () => { checks++; return user(); });
  await assert.doesNotReject(runtime.session.restore());
  assert.equal(runtime.session.getSnapshot().status, 'recovery-error');
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.ok(!runtime.session.getSnapshot().message.includes('private'));
  assert.ok(!runtime.session.getSnapshot().message.includes(savedToken));
  assert.equal(runtime.getAccessToken(), undefined);
  assert.equal(checks, 0);
  assert.equal(clears, 0);
  await runtime.session.restore();
  assert.equal(runtime.session.getSnapshot().status, 'authenticated');
  assert.equal(reads, 2);
  assert.equal(checks, 1);
});

test('unexpected verification errors cannot expose token or native details and never erase the saved token', async () => {
  let clears = 0;
  const runtime = createAuthSession(login, {
    get: async () => savedToken, set: async () => {}, clear: async () => { clears++; },
  }, async () => { throw new Error(`private diagnostic: ${savedToken}`); });
  await assert.doesNotReject(runtime.session.restore());
  assert.equal(runtime.session.getSnapshot().status, 'recovery-error');
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.ok(!runtime.session.getSnapshot().message.includes('private'));
  assert.ok(!runtime.session.getSnapshot().message.includes(savedToken));
  assert.equal(runtime.getAccessToken(), undefined);
  assert.equal(clears, 0);
});

test('failure to delete an unauthorized saved token stays unauthenticated and supports an explicit retry', async () => {
  let clears = 0;
  let stored = savedToken;
  const runtime = createAuthSession(login, {
    get: async () => stored, set: async () => {},
    clear: async () => {
      clears++;
      if (clears === 1) throw new Error('Native deletion failed');
      stored = null;
    },
  }, async () => { throw new SessionError('Sesión rechazada.', 'unauthorized'); });
  await assert.doesNotReject(runtime.session.restore());
  assert.equal(runtime.session.getSnapshot().status, 'recovery-error');
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.match(runtime.session.getSnapshot().message, /eliminar/);
  assert.equal(runtime.getAccessToken(), undefined);
  assert.equal(stored, savedToken);
  await runtime.session.restore();
  assert.equal(runtime.session.getSnapshot().status, 'anonymous');
  assert.equal(stored, null);
  assert.equal(clears, 2);
});

test('a corrupt token with failed cleanup is retried without any HTTP verification', async () => {
  let clears = 0;
  let checks = 0;
  const runtime = createAuthSession(login, {
    get: async () => '', set: async () => {},
    clear: async () => { clears++; if (clears === 1) throw new Error('Deletion failed'); },
  }, async () => { checks++; return user(); });
  await runtime.session.restore();
  assert.equal(runtime.session.getSnapshot().status, 'recovery-error');
  await runtime.session.restore();
  assert.equal(runtime.session.getSnapshot().status, 'anonymous');
  assert.equal(clears, 2);
  assert.equal(checks, 0);
});

test('logout deletion failure remains anonymous with a message and a successful logout retry clears it', async () => {
  let reads = 0;
  let clears = 0;
  const runtime = createAuthSession(login, {
    get: async () => { reads++; return savedToken; }, set: async () => {},
    clear: async () => { clears++; if (clears === 1) throw new Error('Deletion failed'); },
  }, async () => user());
  await runtime.session.restore();
  await assert.rejects(runtime.session.signOut(), (error) => error instanceof LoginError && error.kind === 'storage');
  assert.equal(runtime.session.getSnapshot().status, 'anonymous');
  assert.match(runtime.session.getSnapshot().message, /sesión está cerrada/);
  assert.equal(runtime.getAccessToken(), undefined);
  await runtime.session.restore();
  assert.equal(reads, 1);
  await runtime.session.signOut();
  assert.deepEqual(runtime.session.getSnapshot(), { status: 'anonymous', user: null, message: null });
  assert.equal(clears, 2);
});

test('logout during an uncancellable native read discards its result before HTTP and serializes deletion', async () => {
  const reading = deferred();
  const result = deferred();
  let checks = 0;
  let clears = 0;
  const runtime = createAuthSession(login, {
    get: () => { reading.resolve(); return result.promise; },
    set: async () => {}, clear: async () => { clears++; },
  }, async () => { checks++; return user(); });
  const restoring = runtime.session.restore();
  await reading.promise;
  const logout = runtime.session.signOut();
  assert.equal(runtime.session.getSnapshot().status, 'anonymous');
  assert.equal(runtime.getAccessToken(), undefined);
  result.resolve(savedToken);
  await Promise.all([restoring, logout]);
  assert.equal(checks, 0);
  assert.equal(clears, 1);
  assert.equal(runtime.session.getSnapshot().status, 'anonymous');
});

test('logout before the startup read begins prevents that obsolete storage operation', async () => {
  let reads = 0;
  let clears = 0;
  const runtime = createAuthSession(login, {
    get: async () => { reads++; return savedToken; },
    set: async () => {}, clear: async () => { clears++; },
  }, async () => user());
  const restoring = runtime.session.restore();
  const logout = runtime.session.signOut();
  await Promise.all([restoring, logout]);
  assert.equal(reads, 0);
  assert.equal(clears, 1);
  assert.equal(runtime.session.getSnapshot().status, 'anonymous');
});

test('logout during verification aborts HTTP and cannot be undone by a late successful profile', async () => {
  const verifying = deferred();
  const response = deferred();
  let signal;
  const runtime = createAuthSession(login, {
    get: async () => savedToken, set: async () => {}, clear: async () => {},
  }, (_token, options) => { signal = options.signal; verifying.resolve(); return response.promise; });
  const restoring = runtime.session.restore();
  await verifying.promise;
  await runtime.session.signOut();
  assert.equal(signal.aborted, true);
  response.resolve(user());
  await restoring;
  assert.equal(runtime.session.getSnapshot().status, 'anonymous');
  assert.equal(runtime.session.getSnapshot().user, null);
  assert.equal(runtime.getAccessToken(), undefined);
});

test('a new login supersedes restoration and late 401 or network errors cannot erase its token or state', async () => {
  for (const kind of ['unauthorized', 'network']) {
    const verifying = deferred();
    const response = deferred();
    let signal;
    let stored = savedToken;
    let clears = 0;
    const runtime = createAuthSession(login, {
      get: async () => stored,
      set: async (token) => { stored = token; }, clear: async () => { clears++; stored = null; },
    }, (_token, options) => { signal = options.signal; verifying.resolve(); return response.promise; });
    const restoring = runtime.session.restore();
    await verifying.promise;
    const signedIn = await runtime.session.signIn(form());
    assert.equal(signal.aborted, true);
    response.reject(new SessionError('Respuesta tardía.', kind));
    await restoring;
    assert.equal(runtime.session.getSnapshot().status, 'authenticated');
    assert.equal(runtime.session.getSnapshot().user, signedIn);
    assert.equal(runtime.getAccessToken(), newToken);
    assert.equal(stored, newToken);
    assert.equal(clears, 0);
  }
});

test('a login started during a native read waits to write and never publishes the obsolete saved user', async () => {
  const reading = deferred();
  const response = deferred();
  let writes = 0;
  let checks = 0;
  let stored = savedToken;
  const runtime = createAuthSession(login, {
    get: () => { reading.resolve(); return response.promise; },
    set: async (token) => { writes++; stored = token; }, clear: async () => {},
  }, async () => { checks++; return user(); });
  const restoring = runtime.session.restore();
  await reading.promise;
  const signingIn = runtime.session.signIn(form());
  assert.equal(runtime.session.getSnapshot().status, 'anonymous');
  assert.equal(runtime.getAccessToken(), undefined);
  response.resolve(savedToken);
  await Promise.all([restoring, signingIn]);
  assert.equal(runtime.session.getSnapshot().user.id, 'new');
  assert.equal(runtime.getAccessToken(), newToken);
  assert.equal(stored, newToken);
  assert.equal(writes, 1);
  assert.equal(checks, 0);
});

test('a 401 cleanup queued just before a new login rechecks its generation inside the storage queue', async () => {
  const verifying = deferred();
  const response = deferred();
  let clears = 0;
  let stored = savedToken;
  const runtime = createAuthSession(login, {
    get: async () => stored,
    set: async (token) => { stored = token; }, clear: async () => { clears++; stored = null; },
  }, () => { verifying.resolve(); return response.promise; });
  const restoring = runtime.session.restore();
  await verifying.promise;
  response.reject(new SessionError('Sesión rechazada.', 'unauthorized'));
  // Allow the 401 handler to enqueue deletion, then invalidate before the queue executes it.
  await Promise.resolve();
  const signingIn = runtime.session.signIn(form());
  await Promise.all([restoring, signingIn]);
  assert.equal(runtime.session.getSnapshot().user.id, 'new');
  assert.equal(stored, newToken);
  assert.equal(clears, 0);
});

test('a native deletion already in progress cannot overwrite a newer login after it finishes', async () => {
  const clearing = deferred();
  const finishClear = deferred();
  let stored = savedToken;
  let writes = 0;
  const runtime = createAuthSession(login, {
    get: async () => stored,
    set: async (token) => { writes++; stored = token; },
    clear: async () => { clearing.resolve(); await finishClear.promise; stored = null; },
  }, async () => { throw new SessionError('Sesión rechazada.', 'unauthorized'); });
  const restoring = runtime.session.restore();
  await clearing.promise;
  const signingIn = runtime.session.signIn(form());
  assert.equal(runtime.session.getSnapshot().status, 'anonymous');
  finishClear.resolve();
  await Promise.all([restoring, signingIn]);
  assert.equal(writes, 1);
  assert.equal(stored, newToken);
  assert.equal(runtime.getAccessToken(), newToken);
  assert.equal(runtime.session.getSnapshot().status, 'authenticated');
  assert.equal(runtime.session.getSnapshot().message, null);
});

test('explicit recovery retries share one operation while in flight and never retry themselves', async () => {
  const retrying = deferred();
  const response = deferred();
  let checks = 0;
  const runtime = createAuthSession(login, {
    get: async () => savedToken, set: async () => {}, clear: async () => {},
  }, () => {
    checks++;
    if (checks === 1) return Promise.reject(new SessionError('Sin conexión.', 'network'));
    retrying.resolve();
    return response.promise;
  });
  await runtime.session.restore();
  assert.equal(checks, 1);
  const retry = runtime.session.restore();
  const replay = runtime.session.restore();
  assert.equal(retry, replay);
  await retrying.promise;
  assert.equal(runtime.session.getSnapshot(), AUTH_INITIAL_STATE);
  assert.equal(checks, 2);
  response.resolve(user());
  await retry;
  assert.equal(runtime.session.getSnapshot().status, 'authenticated');
});

test('a login from recovery state clears the recovery UI without entering global checking', async () => {
  const response = deferred();
  const runtime = createAuthSession(() => response.promise, {
    get: async () => savedToken, set: async () => {}, clear: async () => {},
  }, async () => { throw new SessionError('Sin conexión.', 'network'); });
  await runtime.session.restore();
  assert.equal(runtime.session.getSnapshot().status, 'recovery-error');
  const signingIn = runtime.session.signIn(form());
  assert.deepEqual(runtime.session.getSnapshot(), { status: 'anonymous', user: null, message: null });
  await runtime.session.restore();
  assert.equal(runtime.session.getSnapshot().status, 'anonymous');
  response.resolve({ accessToken: newToken, user: user('new') });
  await signingIn;
  assert.equal(runtime.session.getSnapshot().status, 'authenticated');
});

test('a completed login or logout prevents startup replay from reading an old saved credential', async () => {
  let reads = 0;
  const runtime = createAuthSession(login, {
    get: async () => { reads++; return savedToken; }, set: async () => {}, clear: async () => {},
  }, async () => user());
  await runtime.session.signIn(form());
  await runtime.session.restore();
  assert.equal(runtime.session.getSnapshot().status, 'authenticated');
  assert.equal(runtime.session.getSnapshot().user.id, 'new');
  await runtime.session.signOut();
  await runtime.session.restore();
  assert.equal(runtime.session.getSnapshot().status, 'anonymous');
  assert.equal(reads, 0);
});
