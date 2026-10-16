const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  createEmptyLoginForm,
  validateLogin,
} = require('../src/features/auth/domain/validation/loginValidation.ts');

const validForm = (overrides = {}) => ({
  email: 'ana+aromas@example.com',
  password: 'abcdefgh',
  ...overrides,
});

test('login requires email and password for empty and whitespace-only inputs', () => {
  assert.deepEqual(createEmptyLoginForm(), { email: '', password: '' });
  for (const form of [createEmptyLoginForm(), { email: ' \t\n ', password: ' '.repeat(8) }]) {
    assert.deepEqual(validateLogin(form), {
      email: 'El correo electrónico es obligatorio.',
      password: 'La contraseña es obligatoria.',
    });
  }
});

test('login trims email only for validation and leaves all entered values unchanged', () => {
  const form = Object.freeze(validForm({
    email: ' \tANA+aromas@sub.example.com  ',
    password: ' abcdefg',
  }));
  const before = { ...form };
  assert.deepEqual(validateLogin(form), {});
  assert.deepEqual(form, before);
});

test('login email accepts usual aliases, uppercase, subdomains, quoted and UTF-8 local parts', () => {
  for (const email of ['ana@example.com', 'ANA+aromas@correo.example.com.mx',
    'ana.silva@sub-dominio.example', 'josé+aromas@example.com', 'ana@müller.de',
    '"ana maria"@example.com', '"ana..maria"@example.com']) {
    assert.equal(validateLogin(validForm({ email })).email, undefined, email);
  }
});

test('login email rejects malformed addresses using the same validator defaults as the DTO', () => {
  for (const email of ['ana', 'ana@example', 'ana@.com', 'ana@@example.com',
    'ana maria@example.com', '.ana@example.com', 'ana.@example.com', 'ana..maria@example.com',
    'ana@example..com', 'ana@-example.com', 'ana@example-.com', 'ana@example.com.',
    'ana@example.c', 'ana@example.123']) {
    assert.match(validateLogin(validForm({ email })).email, /correo electrónico válido/, email);
  }
});

test('login email respects local-part byte limits and domain label size boundaries', () => {
  for (const email of [`${'a'.repeat(64)}@example.com`, `${'é'.repeat(32)}@example.com`,
    `ana@${'a'.repeat(63)}.com`]) {
    assert.equal(validateLogin(validForm({ email })).email, undefined, email);
  }
  for (const email of [`${'a'.repeat(65)}@example.com`, `${'é'.repeat(33)}@example.com`,
    `ana@${'a'.repeat(64)}.com`, `${'a'.repeat(64)}@${'a'.repeat(63)}.${'b'.repeat(63)}.${'c'.repeat(63)}.com`]) {
    assert.match(validateLogin(validForm({ email })).email, /correo electrónico válido/, email);
  }
});

test('login password accepts the exact 8/128 length boundaries and rejects 7/129', () => {
  for (const length of [8, 128]) {
    assert.equal(validateLogin(validForm({ password: 'a'.repeat(length) })).password, undefined);
  }
  for (const length of [7, 129]) {
    assert.match(validateLogin(validForm({ password: 'a'.repeat(length) })).password, /8 y 128/);
  }
});

test('login password does not require the uppercase, number or symbol rules of registration', () => {
  for (const password of ['abcdefgh', 'ABCDEFGH', '12345678', '!!!!!!!!']) {
    assert.deepEqual(validateLogin(validForm({ password })), {}, password);
  }
});

test('login password leading and trailing spaces remain part of the original length', () => {
  for (const password of [' abcdefg', 'abcdefg ']) {
    const form = Object.freeze(validForm({ password }));
    assert.deepEqual(validateLogin(form), {});
    assert.equal(form.password, password);
    assert.match(validateLogin(validForm({ password: password.trim() })).password, /8 y 128/);
  }
});

test('login password counts surrogate pairs like LoginDto instead of UTF-16 code units', () => {
  for (const length of [8, 128]) {
    assert.equal(validateLogin(validForm({ password: '😀'.repeat(length) })).password, undefined);
  }
  for (const length of [7, 129]) {
    assert.match(validateLogin(validForm({ password: '😀'.repeat(length) })).password, /8 y 128/);
  }
});

test('login password counts FE0F/FE0E presentation sequences like the installed server validator', () => {
  for (const sequence of ['✈\uFE0F', '✈\uFE0E']) {
    for (const length of [8, 128]) {
      assert.equal(validateLogin(validForm({ password: sequence.repeat(length) })).password, undefined);
    }
    for (const length of [7, 129]) {
      assert.match(validateLogin(validForm({ password: sequence.repeat(length) })).password, /8 y 128/);
    }
  }
});

test('login password does not normalize combining characters or count whole emoji graphemes', () => {
  assert.equal(validateLogin(validForm({ password: 'e\u0301'.repeat(4) })).password, undefined);
  assert.match(validateLogin(validForm({ password: 'é'.repeat(4) })).password, /8 y 128/);
  assert.match(validateLogin(validForm({ password: '👩‍💻'.repeat(2) })).password, /8 y 128/);
  assert.equal(validateLogin(validForm({ password: '👩‍💻'.repeat(3) })).password, undefined);
});
