const assert = require('node:assert/strict');
const { test } = require('node:test');
const { LoginError } = require('../src/features/auth/domain/errors/LoginError.ts');
const { createLoginUser } = require('../src/features/auth/domain/useCases/loginUser.ts');

const validForm = (overrides = {}) => ({ email: 'ana@example.com', password: 'abcdefgh', ...overrides });
const session = {
  accessToken: 'test.jwt.signature',
  user: { id: 'user-id', firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.com', phone: '5512345678' },
};

test('login use case rejects invalid forms before calling the repository', async () => {
  let calls = 0;
  const login = createLoginUser({ login: async () => { calls++; return session; } });
  for (const form of [validForm({ email: 'invalid' }), validForm({ email: ' ' }),
    validForm({ password: ' '.repeat(8) }), validForm({ password: 'a'.repeat(7) }),
    validForm({ password: 'a'.repeat(129) })]) {
    await assert.rejects(login(form), (error) => {
      assert.ok(error instanceof LoginError);
      assert.equal(error.kind, 'validation');
      assert.ok(Object.keys(error.fieldErrors).length > 0);
      return true;
    });
  }
  assert.equal(calls, 0);
});

test('login use case normalizes email, preserves exact password and sends only the two input fields', async () => {
  let sentInput;
  let sentOptions;
  const login = createLoginUser({ login: async (input, options) => {
    sentInput = input;
    sentOptions = options;
    return session;
  } });
  const form = Object.freeze(validForm({ email: '  ANA+aromas@EXAMPLE.COM \t', password: ' abcdefg ', ignored: 'private' }));
  const before = { ...form };
  const options = { signal: new AbortController().signal };
  assert.equal(await login(form, options), session);
  assert.deepEqual(sentInput, { email: 'ana+aromas@example.com', password: ' abcdefg ' });
  assert.equal(sentOptions, options);
  assert.deepEqual(form, before);
});

test('login use case revalidates outgoing email when lowercasing expands Unicode beyond the byte limit', async () => {
  let calls = 0;
  const login = createLoginUser({ login: async () => { calls++; return session; } });
  await assert.rejects(login(validForm({ email: `${'İ'.repeat(32)}@example.com` })), (error) => {
    assert.ok(error instanceof LoginError);
    assert.equal(error.kind, 'validation');
    assert.ok(error.fieldErrors.email);
    return true;
  });
  assert.equal(calls, 0);
});

test('login use case accepts simple passwords and valid Unicode lengths without registration strength rules', async () => {
  const passwords = [];
  const login = createLoginUser({ login: async (input) => { passwords.push(input.password); return session; } });
  for (const password of ['abcdefgh', '12345678', '😀'.repeat(128), '✈\uFE0F'.repeat(8)]) {
    assert.equal(await login(validForm({ password })), session);
    assert.equal(passwords.at(-1), password);
  }
  assert.equal(passwords.length, 4);
});

test('login use case never invokes its repository when the caller already cancelled', async () => {
  let calls = 0;
  const controller = new AbortController();
  controller.abort();
  const login = createLoginUser({ login: async () => { calls++; return session; } });
  await assert.rejects(login(validForm(), { signal: controller.signal }), (error) => {
    assert.ok(error instanceof LoginError);
    assert.equal(error.kind, 'cancelled');
    return true;
  });
  assert.equal(calls, 0);
});

test('login use case discards a late session when its repository ignores caller cancellation', async () => {
  const controller = new AbortController();
  let finish;
  let calls = 0;
  const login = createLoginUser({ login: () => { calls++; return new Promise((resolve) => { finish = resolve; }); } });
  const pending = login(validForm(), { signal: controller.signal });
  controller.abort();
  finish(session);
  await assert.rejects(pending, (error) => {
    assert.ok(error instanceof LoginError);
    assert.equal(error.kind, 'cancelled');
    return true;
  });
  assert.equal(calls, 1);
});

test('login use case preserves known domain errors and never retries failed credentials', async () => {
  let calls = 0;
  const denied = new LoginError('El correo electrónico o la contraseña son incorrectos.', 'credentials');
  const login = createLoginUser({ login: async () => { calls++; throw denied; } });
  await assert.rejects(login(validForm()), (error) => error === denied);
  assert.equal(calls, 1);
});

test('login use case hides unexpected repository diagnostics and does not retain their cause', async () => {
  let calls = 0;
  const login = createLoginUser({ login: async () => { calls++; throw new Error('private token or infrastructure details'); } });
  await assert.rejects(login(validForm()), (error) => {
    assert.ok(error instanceof LoginError);
    assert.equal(error.kind, 'unknown');
    assert.ok(!error.message.includes('private'));
    assert.equal(error.cause, undefined);
    return true;
  });
  assert.equal(calls, 1);
});
