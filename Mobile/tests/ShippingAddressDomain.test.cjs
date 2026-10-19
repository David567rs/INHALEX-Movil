const assert = require('node:assert/strict');
const { test } = require('node:test');
const { ShippingAddressError } = require('../src/features/shippingAddresses/domain/errors/ShippingAddressError.ts');
const { validateShippingAddressDraft, MAX_SHIPPING_ADDRESSES } = require('../src/features/shippingAddresses/domain/validation/shippingAddressValidation.ts');
const { createShippingAddressActions } = require('../src/features/shippingAddresses/domain/useCases/shippingAddressActions.ts');

const id = '507f1f77bcf86cd799439011';
const draft = { label: 'Casa', recipientName: 'María López', phone: '7712345678', street: 'Calle Principal',
  exteriorNumber: '10', interiorNumber: '', neighborhood: 'Centro', municipality: 'Pachuca',
  state: 'Hidalgo', postalCode: '06000', references: '', isDefault: false };
const addresses = Object.freeze([Object.freeze({ id, ...draft, isDefault: true })]);
const methods = ['list', 'create', 'update', 'select', 'remove'];
const isAddressError = (kind) => (error) => {
  assert.ok(error instanceof ShippingAddressError);
  assert.equal(error.kind, kind);
  return true;
};
function call(actions, method, options) {
  if (method === 'list') return actions.list(options);
  if (method === 'create') return actions.create(draft, options);
  if (method === 'update') return actions.update(id, draft, options);
  return actions[method](id, options);
}
const repository = (operation) => Object.fromEntries(methods.map((method) => [method, operation]));

test('shipping validation trims fields without changing internal spaces, punctuation, leading postal zeroes or the input', () => {
  const source = Object.freeze({ ...draft, label: ' Casa ', recipientName: ' María  López ', street: ' Calle  #1 ',
    phone: ' 7712345678 ', postalCode: ' 06000 ', interiorNumber: ' 2-B ', references: ' Entrada  azul ',
    userId: 'private account', accessToken: 'private', id: 'another-address' });
  assert.deepEqual(validateShippingAddressDraft(source), { valid: true, values: {
    ...draft, recipientName: 'María  López', street: 'Calle  #1', interiorNumber: '2-B', references: 'Entrada  azul',
  } });
  assert.equal(source.street, ' Calle  #1 ');
  assert.equal(source.postalCode, ' 06000 ');
});

test('shipping optional text defaults to empty strings and omitted default flag becomes false', () => {
  const { interiorNumber, references, isDefault, ...required } = draft;
  void interiorNumber; void references; void isDefault;
  assert.deepEqual(validateShippingAddressDraft(required), { valid: true, values: draft });
  assert.equal(MAX_SHIPPING_ADDRESSES, 5);
});

test('shipping validation rejects malformed drafts and missing required fields without coercion', () => {
  for (const candidate of [null, undefined, [], 1, 'private', {}]) {
    const result = validateShippingAddressDraft(candidate);
    assert.equal(result.valid, false);
    assert.ok(Object.keys(result.errors).includes('label'));
    assert.ok(Object.keys(result.errors).includes('recipientName'));
    assert.ok(Object.keys(result.errors).includes('postalCode'));
    assert.equal('values' in result, false);
  }
  for (const field of Object.keys(draft).filter((field) => field !== 'isDefault')) {
    for (const candidate of [null, 1, [], {}, true]) {
      const result = validateShippingAddressDraft({ ...draft, [field]: candidate });
      assert.equal(result.valid, false, field);
      assert.equal(typeof result.errors[field], 'string');
    }
  }
});

test('shipping text length limits match persisted address fields and never silently truncate', () => {
  for (const [field, min, max] of [['label', 2, 40], ['recipientName', 2, 120], ['street', 2, 120],
    ['exteriorNumber', 1, 20], ['interiorNumber', 0, 20], ['neighborhood', 2, 100],
    ['municipality', 2, 100], ['state', 2, 100], ['references', 0, 300]]) {
    assert.equal(validateShippingAddressDraft({ ...draft, [field]: 'A'.repeat(min) }).valid, true, `${field}: minimum`);
    assert.equal(validateShippingAddressDraft({ ...draft, [field]: 'A'.repeat(max) }).valid, true, `${field}: maximum`);
    const oversized = validateShippingAddressDraft({ ...draft, [field]: 'A'.repeat(max + 1) });
    assert.equal(oversized.valid, false);
    assert.equal(typeof oversized.errors[field], 'string');
    if (min > 0) {
      const missing = validateShippingAddressDraft({ ...draft, [field]: ' '.repeat(min) });
      assert.equal(missing.valid, false);
      assert.equal(typeof missing.errors[field], 'string');
    }
  }
});

test('shipping phone and postal code accept only exact ASCII digit lengths and retain leading zeroes', () => {
  for (const phone of ['0'.repeat(10), '1'.repeat(15)]) {
    assert.equal(validateShippingAddressDraft({ ...draft, phone }).valid, true);
  }
  for (const phone of ['1'.repeat(9), '1'.repeat(16), '+527712345678', '771 2345678', '771-2345678',
    '771\n2345678', '１２３４５６７８９０', 'abcdefghij']) {
    const invalid = validateShippingAddressDraft({ ...draft, phone });
    assert.equal(invalid.valid, false);
    assert.equal(typeof invalid.errors.phone, 'string');
  }
  for (const postalCode of ['1234', '123456', '01-23', '01 23', '１２３４５', 'abcde', '01\n23']) {
    const invalid = validateShippingAddressDraft({ ...draft, postalCode });
    assert.equal(invalid.valid, false);
    assert.equal(typeof invalid.errors.postalCode, 'string');
  }
  assert.equal(validateShippingAddressDraft({ ...draft, postalCode: '00000' }).valid, true);
});

test('shipping validation never coerces default selection from strings, numbers or null', () => {
  for (const isDefault of [true, false]) {
    const result = validateShippingAddressDraft({ ...draft, isDefault });
    assert.equal(result.valid, true);
    assert.equal(result.values.isDefault, isDefault);
  }
  for (const isDefault of ['true', 'false', 0, 1, null, [], {}]) {
    assert.equal(validateShippingAddressDraft({ ...draft, isDefault }).valid, false);
  }
});

test('shipping actions return server collections for all methods and forward normalized fields, IDs and options', async () => {
  const calls = [];
  const options = { signal: new AbortController().signal };
  const actions = createShippingAddressActions(Object.fromEntries(methods.map((method) => [method, async (...args) => {
    calls.push([method, ...args]); return addresses;
  }])));
  const source = { ...draft, label: ' Casa ', userId: 'private', role: 'admin' };
  assert.equal(await actions.list(options), addresses);
  assert.equal(await actions.create(source, options), addresses);
  assert.equal(await actions.update(id.toUpperCase(), source, options), addresses);
  assert.equal(await actions.select(id.toUpperCase(), options), addresses);
  assert.equal(await actions.remove(id.toUpperCase(), options), addresses);
  assert.deepEqual(calls, [['list', options], ['create', draft, options], ['update', id, draft, options],
    ['select', id, options], ['remove', id, options]]);
});

test('shipping actions reject invalid ObjectIds before repository calls', async () => {
  let calls = 0;
  const actions = createShippingAddressActions(repository(async () => { calls++; return addresses; }));
  for (const value of [null, undefined, 1, [], {}, '', 'Casa', 'preview-home', ` ${id}`, `${id}\n`,
    id.slice(1), `${id}0`, 'z'.repeat(24), `${id}/other`, `${id}?userId=other`]) {
    await assert.rejects(actions.update(value, draft), isAddressError('validation'));
    await assert.rejects(actions.select(value), isAddressError('validation'));
    await assert.rejects(actions.remove(value), isAddressError('validation'));
  }
  assert.equal(calls, 0);
});

test('shipping actions validate creates and updates without leaking entered private data in errors', async () => {
  let calls = 0;
  const actions = createShippingAddressActions(repository(async () => { calls++; return addresses; }));
  for (const method of ['create', 'update']) {
    const invalid = { ...draft, phone: 'private phone', postalCode: 'private code' };
    await assert.rejects(method === 'create' ? actions.create(invalid) : actions.update(id, invalid), (error) => {
      isAddressError('validation')(error);
      assert.deepEqual(Object.keys(error.fieldErrors), ['phone', 'postalCode']);
      assert.equal(JSON.stringify(error).includes('private'), false);
      assert.equal(error.message.includes('private'), false);
      return true;
    });
  }
  assert.equal(calls, 0);
});

test('shipping actions never start pre-cancelled requests, including malformed edits', async () => {
  let calls = 0;
  const actions = createShippingAddressActions(repository(async () => { calls++; return addresses; }));
  const controller = new AbortController();
  controller.abort();
  for (const method of methods) {
    await assert.rejects(call(actions, method, { signal: controller.signal }), isAddressError('cancelled'));
  }
  await assert.rejects(actions.update('invalid', null, { signal: controller.signal }), isAddressError('cancelled'));
  assert.equal(calls, 0);
});

test('shipping actions discard late success and failure after cancellation for every operation', async () => {
  for (const method of methods) {
    for (const shouldFail of [false, true]) {
      let finish, fail;
      const operation = () => new Promise((resolve, reject) => { finish = resolve; fail = reject; });
      const actions = createShippingAddressActions(repository(operation));
      const controller = new AbortController();
      const pending = call(actions, method, { signal: controller.signal });
      controller.abort();
      if (shouldFail) fail(new Error('private late diagnostic'));
      else finish(addresses);
      await assert.rejects(pending, isAddressError('cancelled'));
    }
  }
});

test('shipping actions preserve domain failures and never retry uncertain writes automatically', async () => {
  for (const kind of ['validation', 'unauthorized', 'network', 'timeout', 'server', 'invalid-response',
    'configuration', 'not-found', 'limit', 'cancelled', 'unknown']) {
    for (const method of methods) {
      let attempts = 0;
      const failure = new ShippingAddressError('Aviso seguro.', kind);
      const actions = createShippingAddressActions(repository(async () => { attempts++; throw failure; }));
      await assert.rejects(call(actions, method), (error) => error === failure);
      assert.equal(attempts, 1);
    }
  }
});

test('shipping actions hide unexpected repository diagnostics without retaining their cause', async () => {
  for (const failure of [new Error('private postal address'), 'private bearer', null]) {
    const actions = createShippingAddressActions(repository(async () => { throw failure; }));
    for (const method of methods) {
      await assert.rejects(call(actions, method), (error) => {
        isAddressError('unknown')(error);
        assert.equal(error.cause, undefined);
        assert.equal(error.message.includes('private'), false);
        return true;
      });
    }
  }
});

test('shipping field errors are copied and frozen independently of later form mutations', () => {
  const fields = { street: 'Revisa la calle.' };
  const error = new ShippingAddressError('Revisa los datos.', 'validation', fields);
  fields.street = 'Changed';
  assert.deepEqual(error.fieldErrors, { street: 'Revisa la calle.' });
  assert.equal(Object.isFrozen(error.fieldErrors), true);
});
