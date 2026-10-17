const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiError } = require('../src/core/network/ApiError.ts');
const { SessionError } = require('../src/features/auth/domain/errors/SessionError.ts');
const { ApiSessionRepository } = require('../src/features/auth/data/repositories/ApiSessionRepository.ts');

const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLWlkIn0.dGVzdC1zaWduYXR1cmU';
const profile = () => ({
  _id: '507f1f77bcf86cd799439011', firstName: 'Ana', lastName: 'Pérez',
  email: 'ana@example.com', phone: '5512345678', role: 'user', status: 'active',
});
const publicUser = () => ({
  id: '507f1f77bcf86cd799439011', firstName: 'Ana', lastName: 'Pérez',
  email: 'ana@example.com', phone: '5512345678',
});
const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});
const repository = (fetch, options = {}) => new ApiSessionRepository((candidate) => new HttpClient({
  baseUrl: 'https://api.example/api', fetch, ...options, getAccessToken: () => candidate,
}));
const isSessionError = (kind) => (error) => {
  assert.ok(error instanceof SessionError);
  assert.equal(error.kind, kind);
  return true;
};

test('session verification uses a dedicated candidate bearer and GET /auth/me without publishing a token or extra profile fields', async () => {
  const clients = [];
  const calls = [];
  const repo = new ApiSessionRepository((candidate) => {
    clients.push(candidate);
    return new HttpClient({
      baseUrl: 'https://api.example/api', getAccessToken: () => candidate,
      fetch: async (url, options) => {
        calls.push({ url, options });
        return jsonResponse({ ...profile(), passwordHash: 'ignored-private-field', accessToken: 'ignored-token', internal: 'ignored' });
      },
    });
  });
  for (const candidate of [token, 'another.candidate.signature']) {
    const user = await repo.verify(candidate);
    const call = calls.at(-1);
    assert.equal(call.url, 'https://api.example/api/auth/me');
    assert.equal(call.options.method, 'GET');
    assert.equal(call.options.headers.Authorization, `Bearer ${candidate}`);
    assert.equal(call.options.body, undefined);
    assert.equal(call.options.credentials, 'omit');
    assert.equal(call.options.redirect, 'error');
    assert.deepEqual(user, publicUser());
    assert.ok(!JSON.stringify(user).includes('ignored'));
    assert.equal(Object.hasOwn(user, 'accessToken'), false);
  }
  assert.deepEqual(clients, [token, 'another.candidate.signature']);
});

test('session verification maps only a complete flat profile and rejects nested login responses or empty responses', async () => {
  const { phone: _phone, ...missingPhone } = profile();
  for (const body of [null, [], {}, { user: profile(), accessToken: token }, missingPhone,
    { ...profile(), _id: 12 }, { ...profile(), firstName: ' \t ' }, { ...profile(), email: '' }]) {
    await assert.rejects(repository(async () => jsonResponse(body)).verify(token), isSessionError('invalid-response'));
  }
  await assert.rejects(repository(async () => new Response(null, { status: 204 })).verify(token),
    isSessionError('invalid-response'));
});

test('session verification rejects malformed JSON and non-JSON instead of restoring a user', async () => {
  for (const [body, contentType] of [['<html/>', 'text/html'], ['{', 'application/json']]) {
    const repo = repository(async () => new Response(body, { headers: { 'content-type': contentType } }));
    await assert.rejects(repo.verify(token), isSessionError('invalid-response'));
  }
});

test('only HTTP 401 classifies the session as unauthorized, without exposing account details', async () => {
  for (const serverMessage of ['Token expired', 'La cuenta no está disponible', 'private identity details']) {
    await assert.rejects(repository(async () => jsonResponse({ message: serverMessage }, 401)).verify(token), (error) => {
      isSessionError('unauthorized')(error);
      assert.equal(error.message, 'Tu sesión ya no es válida. Inicia sesión de nuevo.');
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test('403, 429 and 5xx session failures stay recoverable and do not invalidate the stored credential', async () => {
  for (const status of [403, 429, 500, 503]) {
    await assert.rejects(repository(async () => jsonResponse({ message: 'private server details' }, status)).verify(token), (error) => {
      isSessionError('server')(error);
      assert.ok(!error.message.includes('private'));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
  await assert.rejects(repository(async () => jsonResponse({ message: 'private validation detail' }, 400)).verify(token),
    isSessionError('unknown'));
});

test('session network failures do not retry or classify the stored credential as unauthorized', async () => {
  let attempts = 0;
  const repo = repository(async () => { attempts++; throw new TypeError('private transport details'); });
  await assert.rejects(repo.verify(token), (error) => {
    isSessionError('network')(error);
    assert.match(error.message, /conexión/);
    assert.ok(!error.message.includes('private'));
    return true;
  });
  assert.equal(attempts, 1);
});

test('session verification timeout aborts its transport and never retries', async () => {
  let attempts = 0;
  let signal;
  const repo = repository((_url, options) => {
    attempts++;
    signal = options.signal;
    return new Promise(() => {});
  }, { requestTimeoutMs: 15 });
  await assert.rejects(repo.verify(token), isSessionError('timeout'));
  assert.equal(signal.aborted, true);
  assert.equal(attempts, 1);
});

test('session verification forwards caller cancellation and avoids fetch when already cancelled', async () => {
  const controller = new AbortController();
  let requestSignal;
  let attempts = 0;
  let notifyStarted;
  const requestStarted = new Promise((resolve) => { notifyStarted = resolve; });
  const repo = repository((_url, options) => {
    attempts++;
    requestSignal = options.signal;
    notifyStarted();
    return new Promise(() => {});
  });
  const pending = repo.verify(token, { signal: controller.signal });
  await requestStarted;
  controller.abort();
  await assert.rejects(pending, isSessionError('cancelled'));
  assert.equal(requestSignal.aborted, true);
  await assert.rejects(repo.verify(token, { signal: controller.signal }), isSessionError('cancelled'));
  assert.equal(attempts, 1);
});

test('session verification rejects a cross-origin response after transport, without treating it as expired credentials', async () => {
  let attempts = 0;
  const repo = repository(async (_url, options) => {
    attempts++;
    assert.equal(options.redirect, 'error');
    const response = jsonResponse(profile());
    Object.defineProperty(response, 'url', { value: 'https://unexpected.example/api/auth/me' });
    return response;
  });
  await assert.rejects(repo.verify(token), isSessionError('invalid-response'));
  assert.equal(attempts, 1);
});

test('session repository preserves bootstrap configuration errors and hides unexpected client diagnostics', async () => {
  const configuration = new SessionError('La comprobación no está disponible.', 'configuration');
  const configured = new ApiSessionRepository(() => { throw configuration; });
  await assert.rejects(configured.verify(token), (error) => error === configuration);
  for (const [failure, kind] of [
    [new ApiError('private invalid request', 'invalid-request'), 'configuration'],
    [new Error('private credential or configuration detail'), 'unknown'],
  ]) {
    const repo = new ApiSessionRepository(() => { throw failure; });
    await assert.rejects(repo.verify(token), (error) => {
      isSessionError(kind)(error);
      assert.ok(!error.message.includes('private'));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});
