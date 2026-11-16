const assert = require('node:assert/strict');
const { setImmediate: flush } = require('node:timers/promises');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { createAuthApiReadiness } = require('../src/features/auth/data/createAuthApiReadiness.ts');
const { ApiLoginRepository } = require('../src/features/auth/data/repositories/ApiLoginRepository.ts');
const { ApiRegistrationRepository } = require('../src/features/auth/data/repositories/ApiRegistrationRepository.ts');

const credentials = { email: 'ana@example.com', password: 'Example1!' };
const user = {
  _id: '507f1f77bcf86cd799439011', firstName: 'Ana', lastName: 'Pérez',
  email: credentials.email, phone: '5512345678',
};
const challenge = {
  challengeId: 'd7428ef9-7eb9-4df2-a07a-c9165e6ab613',
  expiresInSeconds: 600,
  resendAfterSeconds: 60,
};
const json = (payload, status = 200) => new Response(JSON.stringify(payload), {
  status, headers: { 'content-type': 'application/json' },
});

function repositories(fetch) {
  const calls = [];
  const client = new HttpClient({
    baseUrl: 'https://test.example/api',
    getAccessToken: () => { throw new Error('Auth readiness must not access session storage'); },
    fetch: (url, options) => {
      const path = new URL(url).pathname;
      calls.push(`${options.method} ${path}`);
      if (path === '/api/health') {
        assert.equal(options.body, undefined);
        assert.equal(options.headers.Authorization, undefined);
        assert.equal(options.credentials, 'omit');
      }
      return fetch(path, options);
    },
  });
  const wait = createAuthApiReadiness(client);
  return { calls, login: new ApiLoginRepository(client, wait), register: new ApiRegistrationRepository(client, wait) };
}

function clock(t) {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });
  t.mock.method(performance, 'now', () => Date.now());
}

test('a warm server needs one public read before login and the recent result can be reused', async () => {
  const { calls, login, register } = repositories(async (path, options) => {
    if (path === '/api/health') return json({ status: 'ok' });
    if (path === '/api/auth/login') {
      assert.deepEqual(JSON.parse(options.body), credentials);
      return json({ accessToken: 'test.payload.signature', user }, 201);
    }
    assert.equal(path, '/api/auth/register/verification');
    assert.deepEqual(JSON.parse(options.body), { email: credentials.email });
    return json(challenge, 202);
  });
  const states = [];
  assert.equal((await login.login(credentials, { onWaitingForApi: (waiting) => states.push(waiting) })).user.id, user._id);
  assert.deepEqual(await register.requestCode(credentials.email), challenge);
  assert.deepEqual(states, [true, false]);
  assert.deepEqual(calls, ['GET /api/health', 'POST /api/auth/login', 'POST /api/auth/register/verification']);
});

test('a Render startup response and degraded database trigger only GET retries before a single OTP POST', async (t) => {
  clock(t);
  let probes = 0;
  const { calls, register } = repositories(async (path) => {
    if (path !== '/api/health') return json(challenge, 202);
    probes++;
    if (probes === 1) return new Response('<html>Starting up</html>', {
      status: 200, headers: { 'content-type': 'text/html' },
    });
    if (probes === 2) return json({ status: 'degraded', database: { status: 'connecting' } });
    return json({ status: 'ok' });
  });

  const pending = register.requestCode(credentials.email);
  await flush();
  assert.deepEqual(calls, ['GET /api/health']);
  t.mock.timers.tick(3_000);
  await flush();
  assert.deepEqual(calls, ['GET /api/health', 'GET /api/health']);
  t.mock.timers.tick(3_000);
  assert.deepEqual(await pending, challenge);
  assert.deepEqual(calls, ['GET /api/health', 'GET /api/health', 'GET /api/health', 'POST /api/auth/register/verification']);
});

test('an unavailable API stops waiting at the deadline without sending a code', async (t) => {
  clock(t);
  const { calls, register } = repositories(async () => json({ status: 'degraded' }));
  const outcome = assert.rejects(register.requestCode(credentials.email), { kind: 'connection-unavailable' });

  await flush();
  t.mock.timers.tick(90_000);
  await outcome;
  assert.deepEqual(calls, ['GET /api/health']);
});

test('leaving the form cancels the wait and never sends credentials', async (t) => {
  clock(t);
  const { calls, login } = repositories(async () => new Response(null, { status: 503 }));
  const controller = new AbortController();
  const states = [];
  const outcome = assert.rejects(login.login(credentials, {
    signal: controller.signal,
    onWaitingForApi: (waiting) => states.push(waiting),
  }), { kind: 'cancelled' });

  await flush();
  controller.abort();
  await outcome;
  t.mock.timers.tick(90_000);
  assert.deepEqual(states, [true, false]);
  assert.deepEqual(calls, ['GET /api/health']);
});

test('a failed OTP POST is not replayed and verified registration keeps its direct POST', async () => {
  const { calls, register } = repositories(async (path) => {
    if (path === '/api/health') return json({ status: 'ok' });
    if (path === '/api/auth/register/verification') throw new Error('Response lost');
    return json({ user }, 201);
  });
  await assert.rejects(register.requestCode(credentials.email), { kind: 'network' });
  await register.register({ firstName: user.firstName, lastName: user.lastName, phone: user.phone, ...credentials }, {
    challengeId: challenge.challengeId, code: '024681',
  });
  assert.deepEqual(calls, ['GET /api/health', 'POST /api/auth/register/verification', 'POST /api/auth/register/verified']);
});
