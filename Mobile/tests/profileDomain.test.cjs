const assert = require('node:assert/strict');
const { test } = require('node:test');
const { ProfileError } = require('../src/features/profile/domain/errors/ProfileError.ts');
const { validateProfileDraft } = require('../src/features/profile/domain/validation/profileValidation.ts');
const { createProfileActions } = require('../src/features/profile/domain/useCases/profileActions.ts');

const draft = { firstName: 'María José', lastName: "D'Ávila", phone: '7712345678' };
const profile = Object.freeze({ id: '507f1f77bcf86cd799439011', ...draft, email: 'maria@example.test' });
const isProfileError = (kind) => (error) => {
  assert.ok(error instanceof ProfileError);
  assert.equal(error.kind, kind);
  return true;
};
const call = (actions, method, options) => method === 'get' ? actions.get(options) : actions.update(draft, options);

test('profile validation normalizes editable fields without mutating the draft or forwarding restricted fields', () => {
  const original = Object.freeze({ firstName: '  María\t\n José  ', lastName: "  D'Ávila  ", phone: ' 7712345678\n',
    email: 'private@example.test', role: 'admin', id: 'another-user', accessToken: 'private' });
  const result = validateProfileDraft(original);
  assert.deepEqual(result, { values: draft, errors: {}, valid: true });
  assert.equal(original.firstName, '  María\t\n José  ');
  assert.equal(original.phone, ' 7712345678\n');
  assert.deepEqual(Object.keys(result.values), ['firstName', 'lastName', 'phone']);
});

test('profile validation requires strings for every editable field without coercing malformed values', () => {
  for (const input of [undefined, null, 1, 'private', [], {}, { firstName: null, lastName: ['López'], phone: 7712345678 },
    { firstName: ' ', lastName: '\n', phone: '\t' }]) {
    const result = validateProfileDraft(input);
    assert.equal(result.valid, false);
    assert.deepEqual(result.values, { firstName: '', lastName: '', phone: '' });
    assert.deepEqual(Object.keys(result.errors), ['firstName', 'lastName', 'phone']);
  }
});

test('profile names accept Spanish letters, spaces, apostrophes and hyphens with at least one letter', () => {
  for (const name of ['María José', "D'Ávila", 'Muñoz-Güell', 'ÁéÍóÚüÑñ', 'A-', "'A"]) {
    const result = validateProfileDraft({ ...draft, firstName: name, lastName: name });
    assert.equal(result.valid, true, name);
    assert.deepEqual(result.errors, {});
  }
});

test('profile names reject missing letters, forbidden characters and invalid lengths on both fields', () => {
  for (const value of ['A', 'A'.repeat(51), '--', "''", '- -', 'María123', 'María🙂', 'Lopez_', 'Zoë', 'López.', 'e\u0301']) {
    for (const field of ['firstName', 'lastName']) {
      const result = validateProfileDraft({ ...draft, [field]: value });
      assert.equal(result.valid, false, `${field}: ${value}`);
      assert.equal(typeof result.errors[field], 'string');
      assert.equal(Object.keys(result.errors).length, 1);
    }
  }
});

test('profile validation enforces the backend full name maximum including its joining space', () => {
  assert.equal(validateProfileDraft({ ...draft, firstName: 'A'.repeat(50), lastName: 'B'.repeat(49) }).valid, true);
  assert.equal(validateProfileDraft({ ...draft, firstName: 'A'.repeat(49), lastName: 'B'.repeat(50) }).valid, true);
  const invalid = validateProfileDraft({ ...draft, firstName: 'A'.repeat(50), lastName: 'B'.repeat(50) });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.lastName.includes('100'));
  assert.equal(invalid.values.firstName.length, 50);
  assert.equal(invalid.values.lastName.length, 50);
  assert.equal(validateProfileDraft({ ...draft, firstName: 'AB', lastName: 'CD' }).valid, true);
});

test('profile phone accepts 10 to 15 ASCII digits and trims only outside whitespace', () => {
  for (const value of ['1'.repeat(10), '1'.repeat(15), ' 7712345678 ']) {
    const result = validateProfileDraft({ ...draft, phone: value });
    assert.equal(result.valid, true);
    assert.equal(result.values.phone, value.trim());
  }
  for (const value of ['1'.repeat(9), '1'.repeat(16), '+527712345678', '771 2345678', '771-2345678',
    '771\n2345678', 'abcdefghij', '１２３４５６７８９０', 7712345678]) {
    const result = validateProfileDraft({ ...draft, phone: value });
    assert.equal(result.valid, false);
    assert.equal(typeof result.errors.phone, 'string');
  }
});

test('profile actions return confirmed profiles and forward normalized allowlisted data and cancellation options', async () => {
  const calls = [];
  const options = { signal: new AbortController().signal };
  const actions = createProfileActions({
    get: async (receivedOptions) => { calls.push(['get', receivedOptions]); return profile; },
    update: async (values, receivedOptions) => { calls.push(['update', values, receivedOptions]); return profile; },
  });
  assert.equal(await actions.get(options), profile);
  assert.equal(await actions.update({ ...draft, firstName: ' María   José ', email: 'private', role: 'admin' }, options), profile);
  assert.deepEqual(calls, [['get', options], ['update', draft, options]]);
});

test('profile actions reject invalid updates with field messages before invoking their repository', async () => {
  let calls = 0;
  const actions = createProfileActions({ get: async () => profile, update: async () => { calls++; return profile; } });
  await assert.rejects(actions.update({ ...draft, firstName: 'A', phone: '+52 123' }), (error) => {
    isProfileError('validation')(error);
    assert.deepEqual(Object.keys(error.fieldErrors), ['firstName', 'phone']);
    assert.equal(error.cause, undefined);
    return true;
  });
  assert.equal(calls, 0);
});

test('profile actions never invoke repositories for pre-cancelled operations', async () => {
  let calls = 0;
  const operation = async () => { calls++; return profile; };
  const actions = createProfileActions({ get: operation, update: operation });
  const controller = new AbortController();
  controller.abort();
  for (const method of ['get', 'update']) {
    await assert.rejects(call(actions, method, { signal: controller.signal }), isProfileError('cancelled'));
  }
  await assert.rejects(actions.update(null, { signal: controller.signal }), isProfileError('cancelled'));
  assert.equal(calls, 0);
});

test('profile actions discard late repository success and failure after cancellation', async () => {
  for (const method of ['get', 'update']) {
    for (const shouldFail of [false, true]) {
      let finish, fail;
      const operation = () => new Promise((resolve, reject) => { finish = resolve; fail = reject; });
      const actions = createProfileActions({ get: operation, update: operation });
      const controller = new AbortController();
      const pending = call(actions, method, { signal: controller.signal });
      controller.abort();
      if (shouldFail) fail(new Error('private late diagnostic'));
      else finish(profile);
      await assert.rejects(pending, isProfileError('cancelled'));
    }
  }
});

test('profile actions preserve domain failures and do not retry uncertain writes automatically', async () => {
  for (const kind of ['validation', 'unauthorized', 'network', 'timeout', 'cancelled', 'configuration', 'server', 'invalid-response', 'unknown']) {
    for (const method of ['get', 'update']) {
      let calls = 0;
      const failure = new ProfileError('Aviso seguro.', kind);
      const operation = async () => { calls++; throw failure; };
      const actions = createProfileActions({ get: operation, update: operation });
      await assert.rejects(call(actions, method), (error) => error === failure);
      assert.equal(calls, 1);
    }
  }
});

test('profile actions hide unexpected repository diagnostics without retaining causes', async () => {
  for (const failure of [new Error('Authorization: Bearer private'), 'private value', null]) {
    const operation = async () => { throw failure; };
    const actions = createProfileActions({ get: operation, update: operation });
    for (const method of ['get', 'update']) {
      await assert.rejects(call(actions, method), (error) => {
        isProfileError('unknown')(error);
        assert.equal(error.cause, undefined);
        assert.ok(!error.message.includes('private'));
        return true;
      });
    }
  }
});

test('profile errors keep independent field messages for the form without mutable shared errors', () => {
  const fields = { firstName: 'Revisa el nombre.' };
  const error = new ProfileError('Revisa los datos.', 'validation', fields);
  fields.firstName = 'Changed after construction';
  assert.deepEqual(error.fieldErrors, { firstName: 'Revisa el nombre.' });
  assert.equal(Object.isFrozen(error.fieldErrors), true);
  assert.equal(new ProfileError('Aviso.', 'unknown').fieldErrors, undefined);
});
