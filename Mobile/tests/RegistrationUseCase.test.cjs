const assert = require('node:assert/strict');
const { test } = require('node:test');
const { RegistrationError } = require('../src/features/auth/domain/errors/RegistrationError.ts');
const { createRegisterUser } = require('../src/features/auth/domain/useCases/registerUser.ts');

const validForm = (overrides = {}) => ({
  firstName: 'María', lastName: 'Pérez', email: 'maria@example.com', phone: '5512345678',
  password: 'Inhalex1!', confirmPassword: 'Inhalex1!', ...overrides,
});
const registered = {
  id: 'user-id', firstName: 'María', lastName: 'Pérez', email: 'maria@example.com', phone: '5512345678',
};

test('the use case revalidates invalid forms and never invokes the repository', async () => {
  let calls = 0;
  const register = createRegisterUser({ register: async () => { calls++; return registered; } });
  for (const form of [validForm({ email: 'invalid' }), validForm({ confirmPassword: 'different' }),
    validForm({ firstName: '', phone: '123' }), validForm({ password: 'weak', confirmPassword: 'weak' })]) {
    await assert.rejects(register(form), (error) => {
      assert.ok(error instanceof RegistrationError);
      assert.equal(error.kind, 'validation');
      assert.ok(Object.keys(error.fieldErrors).length > 0);
      return true;
    });
  }
  assert.equal(calls, 0);
});

test('the use case normalizes only five request fields and preserves the exact password and original form', async () => {
  let request;
  let passedOptions;
  const register = createRegisterUser({ register: async (input, options) => {
    request = input;
    passedOptions = options;
    return registered;
  } });
  const form = Object.freeze(validForm({
    firstName: '  María  ', lastName: '  Pérez  ', email: '  MARIA+aromas@EXAMPLE.COM  ',
    phone: '  5512345678  ', password: ' Aa1!abc', confirmPassword: ' Aa1!abc',
  }));
  const before = { ...form };
  const options = { signal: new AbortController().signal };
  assert.equal(await register(form, options), registered);
  assert.deepEqual(request, {
    firstName: 'María', lastName: 'Pérez', email: 'maria+aromas@example.com', phone: '5512345678',
    password: ' Aa1!abc',
  });
  assert.equal(passedOptions, options);
  assert.deepEqual(form, before);
  assert.equal(Object.hasOwn(request, 'confirmPassword'), false);
});

test('normalization cannot bypass validation when lowercasing expands a UTF-8 email beyond its byte limit', async () => {
  let calls = 0;
  const register = createRegisterUser({ register: async () => { calls++; return registered; } });
  await assert.rejects(register(validForm({ email: `${'İ'.repeat(32)}@example.com` })), (error) => {
    assert.ok(error instanceof RegistrationError);
    assert.equal(error.kind, 'validation');
    assert.ok(error.fieldErrors.email);
    return true;
  });
  assert.equal(calls, 0);
});

test('the use case does not invoke the repository when cancellation happened before submission', async () => {
  let calls = 0;
  const register = createRegisterUser({ register: async () => { calls++; return registered; } });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(register(validForm(), { signal: controller.signal }), (error) => {
    assert.ok(error instanceof RegistrationError);
    assert.equal(error.kind, 'cancelled');
    return true;
  });
  assert.equal(calls, 0);
});

test('known repository domain errors are preserved without retrying', async () => {
  let calls = 0;
  const duplicate = new RegistrationError('Este correo ya está registrado.', 'duplicate-email', { email: 'Correo registrado.' });
  const register = createRegisterUser({ register: async () => { calls++; throw duplicate; } });
  await assert.rejects(register(validForm()), (error) => error === duplicate);
  assert.equal(calls, 1);
});

test('unexpected repository errors are converted to safe domain errors without retaining internals', async () => {
  const register = createRegisterUser({ register: async () => { throw new Error('private infrastructure detail'); } });
  await assert.rejects(register(validForm()), (error) => {
    assert.ok(error instanceof RegistrationError);
    assert.equal(error.kind, 'unknown');
    assert.ok(!error.message.includes('private'));
    assert.equal(error.cause, undefined);
    return true;
  });
});
