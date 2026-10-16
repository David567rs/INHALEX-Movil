const assert = require('node:assert/strict');
const { test } = require('node:test');
const {
  createEmptyRegistrationForm,
  getPasswordChecks,
  validateRegistration,
} = require('../src/features/auth/domain/validation/registrationValidation.ts');

const validForm = (overrides = {}) => ({
  firstName: 'María',
  lastName: "O'Neill",
  email: 'maria+aromas@example.com',
  phone: '5512345678',
  password: 'Inhalex1!',
  confirmPassword: 'Inhalex1!',
  ...overrides,
});
const passwordForm = (password) => validForm({ password, confirmPassword: password });

test('empty or whitespace-only inputs produce Spanish required-field errors for all six fields', () => {
  const empty = createEmptyRegistrationForm();
  const whitespace = Object.fromEntries(Object.keys(empty).map((field) => [field, ' \t\n ']));
  for (const form of [empty, whitespace]) {
    const errors = validateRegistration(form);
    assert.deepEqual(Object.keys(errors).sort(), Object.keys(empty).sort());
    for (const field of ['firstName', 'lastName', 'email', 'phone', 'password']) {
      assert.match(errors[field], /obligatori[oa]/);
    }
    assert.match(errors.confirmPassword, /Confirma/);
  }
});

test('names, email and phone are trimmed for validation without mutating form values', () => {
  const form = Object.freeze(validForm({
    firstName: '  María-José  ', lastName: "  O'Neill  ",
    email: '  MARIA+aromas@sub.example.com  ', phone: '  5512345678  ',
  }));
  const before = { ...form };
  assert.deepEqual(validateRegistration(form), {});
  assert.deepEqual(form, before);
});

test('both names accept exact 2/50-character boundaries and reject 1/51 characters', () => {
  for (const field of ['firstName', 'lastName']) {
    for (const length of [2, 50]) {
      assert.equal(validateRegistration(validForm({ [field]: 'A'.repeat(length) }))[field], undefined);
    }
    for (const length of [1, 51]) {
      assert.match(validateRegistration(validForm({ [field]: 'A'.repeat(length) }))[field], /2 y 50/);
    }
  }
});

test('name characters follow the DTO: Spanish accents, apostrophe and hyphen, without sanitizing invalid input', () => {
  for (const name of ['ÁÉÍÓÚáéíóúÑñÜü', 'Ana María', "D'Ávila", 'María-José']) {
    assert.equal(validateRegistration(validForm({ firstName: name })).firstName, undefined);
  }
  for (const name of ['Ana3', 'Ana🙂', 'Ana\tMaría', 'Ana\nMaría', 'Łukasz', 'Jose\u0301']) {
    assert.match(validateRegistration(validForm({ firstName: name })).firstName, /letras/);
  }
});

test('phone accepts 10/15 ASCII digits and rejects length, formatting and non-ASCII digit violations', () => {
  for (const phone of ['1234567890', '123456789012345']) {
    assert.equal(validateRegistration(validForm({ phone })).phone, undefined);
  }
  for (const phone of ['123456789', '1234567890123456', '+525512345678', '55 12345678',
    '55-12345678', '٥٥١٢٣٤٥٦٧٨', '551234567a']) {
    assert.match(validateRegistration(validForm({ phone })).phone, /10 y 15 dígitos/);
  }
});

test('email uses the server validator defaults, including plus aliases, subdomains, uppercase and UTF-8 local parts', () => {
  for (const email of ['ana@example.com', 'ANA+aromas@correo.example.com.mx',
    'ana.silva@sub-dominio.example', 'josé+aromas@example.com',
    'ana@müller.de', '"ana maria"@example.com', '"ana..maria"@example.com']) {
    assert.equal(validateRegistration(validForm({ email })).email, undefined, email);
  }
});

test('email rejects missing TLD, unquoted spaces, repeated dots and labels with edge hyphens', () => {
  for (const email of ['ana', 'ana@example', 'ana@.com', 'ana@@example.com',
    'ana maria@example.com', '.ana@example.com', 'ana.@example.com', 'ana..maria@example.com',
    'ana@example..com', 'ana@-example.com', 'ana@example-.com', 'ana@example.com.',
    'ana@example.c', 'ana@example.123']) {
    assert.match(validateRegistration(validForm({ email })).email, /correo electrónico válido/, email);
  }
});

test('email size boundaries follow validator byte limits and domain label lengths', () => {
  for (const email of [`${'a'.repeat(64)}@example.com`, `${'é'.repeat(32)}@example.com`,
    `ana@${'a'.repeat(63)}.com`]) {
    assert.equal(validateRegistration(validForm({ email })).email, undefined, email);
  }
  for (const email of [`${'a'.repeat(65)}@example.com`, `${'é'.repeat(33)}@example.com`,
    `ana@${'a'.repeat(64)}.com`, `${'a'.repeat(64)}@${'a'.repeat(63)}.${'b'.repeat(63)}.${'c'.repeat(63)}.com`]) {
    assert.match(validateRegistration(validForm({ email })).email, /correo electrónico válido/, email);
  }
});

test('password checks identify each missing rule independently and do not require a lowercase character', () => {
  const allValid = { length: true, uppercase: true, number: true, symbol: true };
  assert.deepEqual(getPasswordChecks('AAAAAA1!'), allValid);
  for (const [password, missing] of [
    ['Aa1!abc', 'length'], ['aaaaaa1!', 'uppercase'], ['Aaaaaaa!', 'number'], ['Aaaaaaa1', 'symbol'],
  ]) {
    assert.deepEqual(getPasswordChecks(password), { ...allValid, [missing]: false });
    assert.match(validateRegistration(passwordForm(password)).password, /al menos 8 caracteres/);
  }
  assert.deepEqual(validateRegistration(passwordForm('AAAAAA1!')), {});
});

test('password checks match the DTO symbol set, ASCII uppercase/digits and UTF-16 length semantics', () => {
  for (const password of ['Aa12345 ', 'Aa12345£', 'A1!😀😀😀', `A1!${'a'.repeat(129)}`]) {
    assert.deepEqual(validateRegistration(passwordForm(password)), {}, password);
  }
  for (const password of ['Aa12345€', 'Aa12345ñ', 'Aa12345😀', 'Ábcdef1!', 'Abcdef١!']) {
    assert.ok(validateRegistration(passwordForm(password)).password, password);
  }
});

test('password leading/trailing spaces remain part of length and confirmation comparisons', () => {
  for (const password of [' Aa1!abc', 'Aa1!abc ']) {
    assert.equal(password.length, 8);
    assert.deepEqual(validateRegistration(passwordForm(password)), {});
    const errors = validateRegistration(validForm({ password, confirmPassword: password.trim() }));
    assert.equal(errors.password, undefined);
    assert.match(errors.confirmPassword, /no coinciden/);
  }
});

test('confirmation is required and compares exact characters, including case', () => {
  for (const confirmPassword of ['', ' \t ']) {
    assert.match(validateRegistration(validForm({ confirmPassword })).confirmPassword, /Confirma/);
  }
  for (const confirmPassword of ['inhalex1!', 'Inhalex1! ', ' Inhalex1!']) {
    assert.match(validateRegistration(validForm({ confirmPassword })).confirmPassword, /no coinciden/);
  }
});

test('the TypeScript test loader still rejects modules outside its allowed source subtrees', () => {
  assert.throws(() => require('../src/env.d.ts'), /only compiles allowed/);
});
