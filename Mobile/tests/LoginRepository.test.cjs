const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiError } = require('../src/core/network/ApiError.ts');
const { LoginError } = require('../src/features/auth/domain/errors/LoginError.ts');
const { ApiLoginRepository } = require('../src/features/auth/data/repositories/ApiLoginRepository.ts');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIn0.dGVzdC1zaWduYXR1cmU';
const input = () => ({ email: 'ana@example.com', password: ' abcdefg' });
const userDto = () => ({
  _id: '507f1f77bcf86cd799439011', firstName: 'Ana', lastName: 'Pérez',
  email: 'ana@example.com', phone: '5512345678', role: 'user', status: 'active',
});
const payload = () => ({ accessToken: token, user: userDto() });
const jsonResponse = (body, status = 201) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});
const repository = (fetch, options = {}) => new ApiLoginRepository(new HttpClient({
  baseUrl: 'https://api.example/api', fetch, ...options,
}));
const isLoginError = (kind) => (error) => {
  assert.ok(error instanceof LoginError);
  assert.equal(error.kind, kind);
  return true;
};

test('login sends a public POST with only email/password and maps the public session without unknown fields', async () => {
  let call;
  const repo = repository(async (url, options) => {
    call = { url, options };
    return jsonResponse({ ...payload(), refreshToken: 'ignored', user: {
      ...userDto(), passwordHash: 'ignored-private-hash', internal: 'ignored',
    } });
  }, { getAccessToken: () => { throw new Error('Login must not read an existing session'); } });
  const session = await repo.login({ ...input(), role: 'admin', confirmPassword: 'do-not-send' });
  assert.equal(call.url, 'https://api.example/api/auth/login');
  assert.equal(call.options.method, 'POST');
  assert.equal(call.options.headers.Authorization, undefined);
  assert.equal(call.options.credentials, 'omit');
  assert.deepEqual(JSON.parse(call.options.body), input());
  assert.deepEqual(session, {
    accessToken: token,
    user: {
      id: '507f1f77bcf86cd799439011', firstName: 'Ana', lastName: 'Pérez',
      email: 'ana@example.com', phone: '5512345678',
    },
  });
  assert.ok(!JSON.stringify(session).includes('ignored'));
});

test('login requires a nonempty compact JWT and rejects whitespace or header injection without retaining token contents', async () => {
  for (const accessToken of [undefined, null, 123, '', ' ', 'not-a-jwt', 'a.b', 'a.b.',
    '.b.c', 'a..c', 'a.b.c.d', ` ${token}`, `${token}\n`, `${token}\r\nInjected: value`, 'a.b.c\u0000']) {
    await assert.rejects(repository(async () => jsonResponse({ ...payload(), accessToken })).login(input()), (error) => {
      isLoginError('invalid-response')(error);
      assert.equal(error.cause, undefined);
      assert.ok(!error.message.includes('Injected'));
      assert.ok(!error.message.includes(token));
      return true;
    });
  }
});

test('login rejects incomplete or malformed public users and empty successful responses', async () => {
  const { phone: _phone, ...missingPhone } = userDto();
  for (const body of [null, [], {}, { ...payload(), user: null }, { ...payload(), user: [] },
    { ...payload(), user: missingPhone }, { ...payload(), user: { ...userDto(), _id: 12 } },
    { ...payload(), user: { ...userDto(), email: '' } },
    { ...payload(), user: { ...userDto(), firstName: ' \t ' } }]) {
    await assert.rejects(repository(async () => jsonResponse(body)).login(input()), isLoginError('invalid-response'));
  }
  await assert.rejects(repository(async () => new Response(null, { status: 204 })).login(input()),
    isLoginError('invalid-response'));
});

test('login rejects non-JSON or malformed JSON without declaring a session', async () => {
  for (const [body, contentType] of [['<html/>', 'text/html'], ['{', 'application/json']]) {
    const repo = repository(async () => new Response(body, { headers: { 'content-type': contentType } }));
    await assert.rejects(repo.login(input()), isLoginError('invalid-response'));
  }
});

test('all 401 login responses produce the same generic credentials error without disclosing account status', async () => {
  let message;
  for (const serverMessage of ['Credenciales inválidas', 'La cuenta de usuario está inactiva', 'Usuario no encontrado']) {
    const repo = repository(async () => jsonResponse({ message: serverMessage }, 401));
    await assert.rejects(repo.login(input()), (error) => {
      isLoginError('credentials')(error);
      assert.equal(error.message, 'El correo electrónico o la contraseña son incorrectos.');
      assert.equal(error.fieldErrors, undefined);
      assert.equal(error.cause, undefined);
      if (message !== undefined) assert.equal(error.message, message);
      message = error.message;
      return true;
    });
  }
});

test('429 login responses expose a safe attempts error without invented retry timing or automatic retry', async () => {
  let attempts = 0;
  const repo = repository(async () => { attempts++; return jsonResponse({ message: 'private lockout details' }, 429); });
  await assert.rejects(repo.login(input()), (error) => {
    isLoginError('too-many-attempts')(error);
    assert.match(error.message, /demasiados intentos/);
    assert.ok(!error.message.includes('private'));
    assert.ok(!/\d/.test(error.message));
    return true;
  });
  assert.equal(attempts, 1);
});

test('400/422 login validation and 5xx service errors do not expose backend diagnostics', async () => {
  for (const [status, kind] of [[400, 'validation'], [422, 'validation'], [500, 'server'], [503, 'server']]) {
    const repo = repository(async () => jsonResponse({ message: ['private diagnostic with account information'] }, status));
    await assert.rejects(repo.login(input()), (error) => {
      isLoginError(kind)(error);
      assert.ok(!error.message.includes('private'));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test('login network errors remain domain errors and are never retried automatically', async () => {
  let attempts = 0;
  const repo = repository(async () => { attempts++; throw new TypeError('private transport details'); });
  await assert.rejects(repo.login(input()), (error) => {
    isLoginError('network')(error);
    assert.match(error.message, /conexión/);
    assert.ok(!error.message.includes('private'));
    return true;
  });
  assert.equal(attempts, 1);
});

test('login timeout aborts the transport, returns no session and never retries', async () => {
  let attempts = 0;
  let signal;
  const repo = repository((_url, options) => {
    attempts++;
    signal = options.signal;
    return new Promise(() => {});
  }, { requestTimeoutMs: 15 });
  await assert.rejects(repo.login(input()), isLoginError('timeout'));
  assert.equal(signal.aborted, true);
  assert.equal(attempts, 1);
});

test('login caller cancellation reaches the real HttpClient and cancelled requests do not return a session', async () => {
  const controller = new AbortController();
  let requestSignal;
  const repo = repository((_url, options) => {
    requestSignal = options.signal;
    return new Promise(() => {});
  });
  const pending = repo.login(input(), { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, isLoginError('cancelled'));
  assert.equal(requestSignal.aborted, true);
});

test('a pre-cancelled login never calls fetch or reads an existing bearer token', async () => {
  const controller = new AbortController();
  controller.abort();
  let attempts = 0;
  const repo = repository(async () => { attempts++; return jsonResponse(payload()); }, {
    getAccessToken: () => { throw new Error('Must not read token'); },
  });
  await assert.rejects(repo.login(input(), { signal: controller.signal }), isLoginError('cancelled'));
  assert.equal(attempts, 0);
});

test('login request-configuration and unexpected transport errors become safe domain errors', async () => {
  for (const [failure, kind] of [
    [new ApiError('private configuration detail', 'invalid-request'), 'configuration'],
    [new Error('private infrastructure detail'), 'unknown'],
  ]) {
    const repo = new ApiLoginRepository({ request: async () => { throw failure; } });
    await assert.rejects(repo.login(input()), (error) => {
      isLoginError(kind)(error);
      assert.ok(!error.message.includes('private'));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});
