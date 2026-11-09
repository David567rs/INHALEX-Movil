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
const verification = { challengeId: 'd7428ef9-7eb9-4df2-a07a-c9165e6ab613', code: '024681' };
const challenge = { challengeId: verification.challengeId, expiresInSeconds: 600, resendAfterSeconds: 60 };
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

test('requesting a code posts only the email and retains only the public challenge fields', async () => {
  let call;
  const repo = repository(async (url, options) => {
    call = { url, options };
    return jsonResponse({ ...challenge, code: 'ignored', accessToken: 'ignored' }, 202);
  }, { getAccessToken: () => { throw new Error('Code requests must not read the session'); } });
  assert.deepEqual(await repo.requestCode(input().email), challenge);
  assert.equal(call.url, 'https://api.example/api/auth/register/verification');
  assert.equal(call.options.method, 'POST');
  assert.equal(call.options.headers.Authorization, undefined);
  assert.equal(call.options.credentials, 'omit');
  assert.deepEqual(JSON.parse(call.options.body), { email: input().email });
});

test('malformed or empty challenge responses are not accepted as successful sends', async () => {
  for (const body of [null, [], {}, { ...challenge, challengeId: 'invalid' },
    { ...challenge, expiresInSeconds: 0 }, { ...challenge, expiresInSeconds: 1e12 },
    { ...challenge, resendAfterSeconds: '60' }, { ...challenge, resendAfterSeconds: 601 }]) {
    await assert.rejects(repository(async () => jsonResponse(body, 202)).requestCode(input().email),
      isRegistrationError('invalid-response'));
  }
  await assert.rejects(repository(async () => new Response(null, { status: 204 })).requestCode(input().email),
    isRegistrationError('invalid-response'));
});

test('code request maps an invalid email, rate limits and transport failures to safe messages', async () => {
  for (const [status, kind] of [[400, 'validation'], [429, 'rate-limit'], [503, 'server']]) {
    const repo = repository(async () => jsonResponse({ message: 'private server detail' }, status));
    await assert.rejects(repo.requestCode(input().email), (error) => {
      isRegistrationError(kind)(error);
      assert.ok(!error.message.includes('private'));
      assert.equal(error.cause, undefined);
      assert.equal(Boolean(error.fieldErrors?.email), kind === 'validation');
      return true;
    });
  }
  const repo = repository(async () => { throw new TypeError('private network diagnostic'); });
  await assert.rejects(repo.requestCode(input().email), (error) => {
    isRegistrationError('network')(error);
    assert.match(error.message, /solicitar el código/);
    assert.equal(error.cause, undefined);
    return true;
  });
});

test('a slow code request can return its challenge after the default HTTP timeout', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let respond;
  const repo = repository(() => new Promise((resolve) => { respond = resolve; }), { requestTimeoutMs: 15_000 });
  const result = repo.requestCode(input().email).then(
    (value) => ({ value }),
    (error) => ({ error }),
  );

  t.mock.timers.tick(20_000);
  respond(jsonResponse(challenge, 202));
  assert.deepEqual(await result, { value: challenge });
});

test('a code request still times out if the backend never responds', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let requestSignal;
  const repo = repository((_url, options) => {
    requestSignal = options.signal;
    return new Promise(() => {});
  });
  const rejected = assert.rejects(repo.requestCode(input().email), isRegistrationError('timeout'));

  t.mock.timers.tick(29_999);
  assert.equal(requestSignal.aborted, false);
  t.mock.timers.tick(1);
  await rejected;
  assert.equal(requestSignal.aborted, true);
});

test('verified registration posts only allowed fields, keeps leading zeros and drops tokens', async () => {
  let call;
  const repo = repository(async (url, options) => {
    call = { url, options };
    return jsonResponse({ ...payload(), internal: 'ignored', user: {
      ...userDto(), passwordHash: 'ignored-password-hash', extra: 'ignored',
    } });
  }, { getAccessToken: () => { throw new Error('Registration must not read the session'); } });
  const result = await repo.register(
    { ...input(), confirmPassword: 'do-not-send', role: 'admin' },
    { ...verification, email: 'ignore@example.com' },
  );
  assert.equal(call.url, 'https://api.example/api/auth/register/verified');
  assert.equal(call.options.method, 'POST');
  assert.equal(call.options.headers.Authorization, undefined);
  assert.equal(call.options.credentials, 'omit');
  assert.deepEqual(JSON.parse(call.options.body), { ...input(), ...verification });
  assert.deepEqual(result, {
    id: '507f1f77bcf86cd799439011', firstName: 'María', lastName: 'Pérez',
    email: 'maria@example.com', phone: '5512345678',
  });
  assert.ok(!JSON.stringify(result).includes('ignored'));
});

test('registration does not require or retain the server access token', async () => {
  const result = await repository(async () => jsonResponse({ user: userDto() })).register(input(), verification);
  assert.deepEqual(Object.keys(result).sort(), ['email', 'firstName', 'id', 'lastName', 'phone']);
});

test('malformed registration DTOs and 204 responses are rejected as domain errors', async () => {
  const { phone: _phone, ...missingPhone } = userDto();
  for (const body of [null, {}, { user: null }, { user: [] }, { user: missingPhone },
    { user: { ...userDto(), _id: 12 } }, { user: { ...userDto(), email: '' } },
    { user: { ...userDto(), firstName: '  ' } }]) {
    await assert.rejects(repository(async () => jsonResponse(body)).register(input(), verification),
      isRegistrationError('invalid-response'));
  }
  await assert.rejects(repository(async () => new Response(null, { status: 204 })).register(input(), verification),
    isRegistrationError('invalid-response'));
});

test('non-JSON and malformed JSON success responses do not become successful registrations', async () => {
  for (const [body, contentType] of [['<html/>', 'text/html'], ['{', 'application/json']]) {
    const repo = repository(async () => new Response(body, { headers: { 'content-type': contentType } }));
    await assert.rejects(repo.register(input(), verification), isRegistrationError('invalid-response'));
  }
});

test('409 maps to a duplicate-email error and the email field without echoing server messages', async () => {
  const repo = repository(async () => jsonResponse({ message: 'private server diagnostic' }, 409));
  await assert.rejects(repo.register(input(), verification), (error) => {
    isRegistrationError('duplicate-email')(error);
    assert.match(error.fieldErrors.email, /ya está registrado/);
    assert.ok(!error.message.includes('private'));
    return true;
  });
});

test('a rejected code has a distinct error from a rejected registration form', async () => {
  const repo = repository(async () => jsonResponse({
    statusCode: 400,
    message: 'El código es incorrecto, venció o ya se usó. Solicita otro si lo necesitas.',
    internal: 'private-code-digest',
  }, 400));
  await assert.rejects(repo.register(input(), verification), (error) => {
    isRegistrationError('invalid-code')(error);
    assert.match(error.message, /El código no es válido/);
    assert.equal(error.cause, undefined);
    return true;
  });
});

test('400 and 422 map to friendly validation errors', async () => {
  for (const status of [400, 422]) {
    const repo = repository(async () => jsonResponse({ message: ['private validation detail'] }, status));
    await assert.rejects(repo.register(input(), verification), (error) => {
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
    await assert.rejects(repo.register(input(), verification), (error) => {
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
  await assert.rejects(repo.register(input(), verification), (error) => {
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
  await assert.rejects(repo.register(input(), verification), (error) => {
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
  const pending = repo.register(input(), verification, { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, isRegistrationError('cancelled'));
  assert.equal(requestSignal.aborted, true);
});

test('a pre-cancelled registration never reaches fetch and a public endpoint error does not imply a login session', async () => {
  const controller = new AbortController();
  controller.abort();
  let attempts = 0;
  const repo = repository(async () => { attempts++; return jsonResponse(payload()); });
  await assert.rejects(repo.register(input(), verification, { signal: controller.signal }), isRegistrationError('cancelled'));
  assert.equal(attempts, 0);
  const denied = repository(async () => jsonResponse({ message: 'Unauthorized' }, 401));
  await assert.rejects(denied.register(input(), verification), (error) => {
    isRegistrationError('unknown')(error);
    assert.ok(!error.message.includes('Inicia sesión'));
    return true;
  });
});
