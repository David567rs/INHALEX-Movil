const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { RegistrationError } = require('../src/features/auth/domain/errors/RegistrationError.ts');
const { ApiRegistrationRepository } = require('../src/features/auth/data/repositories/ApiRegistrationRepository.ts');

const input = () => ({
  firstName: 'María', lastName: 'Pérez', email: 'maria@example.com',
  phone: '5512345678', password: 'Inhalex1!',
});
const userDto = () => ({
  _id: '507f1f77bcf86cd799439011', firstName: 'María', lastName: 'Pérez',
  email: 'maria@example.com', phone: '5512345678', role: 'customer',
});
const payload = () => ({ accessToken: 'ignored-registration-token', user: userDto() });
const jsonResponse = (body, status = 201) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});
const repository = (fetch, options = {}) => new ApiRegistrationRepository(new HttpClient({
  baseUrl: 'https://api.example/api', fetch, ...options,
}));
const isRegistrationError = (kind) => (error) => {
  assert.ok(error instanceof RegistrationError);
  assert.equal(error.kind, kind);
  return true;
};

test('registration uses a public POST with only the five DTO fields and drops tokens and unknown response fields', async () => {
  let call;
  const repo = repository(async (url, options) => {
    call = { url, options };
    return jsonResponse({ ...payload(), internal: 'ignored', user: {
      ...userDto(), passwordHash: 'ignored-password-hash', extra: 'ignored',
    } });
  }, { getAccessToken: () => { throw new Error('Registration must not read the session'); } });
  const result = await repo.register({ ...input(), confirmPassword: 'do-not-send', role: 'admin' });
  assert.equal(call.url, 'https://api.example/api/auth/register');
  assert.equal(call.options.method, 'POST');
  assert.equal(call.options.headers.Authorization, undefined);
  assert.equal(call.options.credentials, 'omit');
  assert.deepEqual(JSON.parse(call.options.body), input());
  assert.deepEqual(result, {
    id: '507f1f77bcf86cd799439011', firstName: 'María', lastName: 'Pérez',
    email: 'maria@example.com', phone: '5512345678',
  });
  assert.ok(!JSON.stringify(result).includes('ignored'));
});

test('registration does not require or retain the server access token', async () => {
  const result = await repository(async () => jsonResponse({ user: userDto() })).register(input());
  assert.deepEqual(Object.keys(result).sort(), ['email', 'firstName', 'id', 'lastName', 'phone']);
});

test('malformed registration DTOs and 204 responses are rejected as domain errors', async () => {
  const { phone: _phone, ...missingPhone } = userDto();
  for (const body of [null, {}, { user: null }, { user: [] }, { user: missingPhone },
    { user: { ...userDto(), _id: 12 } }, { user: { ...userDto(), email: '' } },
    { user: { ...userDto(), firstName: '  ' } }]) {
    await assert.rejects(repository(async () => jsonResponse(body)).register(input()),
      isRegistrationError('invalid-response'));
  }
  await assert.rejects(repository(async () => new Response(null, { status: 204 })).register(input()),
    isRegistrationError('invalid-response'));
});

test('non-JSON and malformed JSON success responses do not become successful registrations', async () => {
  for (const [body, contentType] of [['<html/>', 'text/html'], ['{', 'application/json']]) {
    const repo = repository(async () => new Response(body, { headers: { 'content-type': contentType } }));
    await assert.rejects(repo.register(input()), isRegistrationError('invalid-response'));
  }
});

test('409 maps to a duplicate-email error and the email field without echoing server messages', async () => {
  const repo = repository(async () => jsonResponse({ message: 'private server diagnostic' }, 409));
  await assert.rejects(repo.register(input()), (error) => {
    isRegistrationError('duplicate-email')(error);
    assert.match(error.fieldErrors.email, /ya está registrado/);
    assert.ok(!error.message.includes('private'));
    return true;
  });
});

test('400 and 422 map to friendly validation errors', async () => {
  for (const status of [400, 422]) {
    const repo = repository(async () => jsonResponse({ message: ['private validation detail'] }, status));
    await assert.rejects(repo.register(input()), (error) => {
      isRegistrationError('validation')(error);
      assert.match(error.message, /Revisa el formulario/);
      assert.ok(!error.message.includes('private'));
      return true;
    });
  }
});

test('server errors keep internal diagnostics out of the domain message', async () => {
  for (const status of [500, 503]) {
    const repo = repository(async () => jsonResponse({ message: 'private stack trace with internal credentials' }, status));
    await assert.rejects(repo.register(input()), (error) => {
      isRegistrationError('server')(error);
      assert.match(error.message, /No pudimos confirmar el registro/);
      assert.ok(!error.message.includes('private'));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test('network failure is an uncertain registration outcome and is not retried automatically', async () => {
  let attempts = 0;
  const repo = repository(async () => { attempts++; throw new TypeError('Network unavailable'); });
  await assert.rejects(repo.register(input()), (error) => {
    isRegistrationError('network')(error);
    assert.match(error.message, /No pudimos confirmar el registro/);
    return true;
  });
  assert.equal(attempts, 1);
});

test('timeout is an uncertain registration outcome and is not retried automatically', async () => {
  let attempts = 0;
  let signal;
  const repo = repository((_url, options) => {
    attempts++;
    signal = options.signal;
    return new Promise(() => {});
  }, { requestTimeoutMs: 15 });
  await assert.rejects(repo.register(input()), (error) => {
    isRegistrationError('timeout')(error);
    assert.match(error.message, /No pudimos confirmar el registro/);
    return true;
  });
  assert.equal(attempts, 1);
  assert.equal(signal.aborted, true);
});

test('cancellation is forwarded through the real HttpClient and remains a domain error', async () => {
  const controller = new AbortController();
  let requestSignal;
  const repo = repository((_url, options) => {
    requestSignal = options.signal;
    return new Promise(() => {});
  });
  const pending = repo.register(input(), { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, isRegistrationError('cancelled'));
  assert.equal(requestSignal.aborted, true);
});

test('a pre-cancelled registration never reaches fetch and a public endpoint error does not imply a login session', async () => {
  const controller = new AbortController();
  controller.abort();
  let attempts = 0;
  const repo = repository(async () => { attempts++; return jsonResponse(payload()); });
  await assert.rejects(repo.register(input(), { signal: controller.signal }), isRegistrationError('cancelled'));
  assert.equal(attempts, 0);
  const denied = repository(async () => jsonResponse({ message: 'Unauthorized' }, 401));
  await assert.rejects(denied.register(input()), (error) => {
    isRegistrationError('unknown')(error);
    assert.ok(!error.message.includes('Inicia sesión'));
    return true;
  });
});
