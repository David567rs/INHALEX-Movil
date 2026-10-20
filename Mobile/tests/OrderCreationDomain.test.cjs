const assert = require('node:assert/strict');
const { test } = require('node:test');
const { OrderCreationError } = require('../src/features/orderCreation/domain/errors/OrderCreationError.ts');
const { createOrderCreationActions } = require('../src/features/orderCreation/domain/useCases/orderCreationActions.ts');
const { normalizeOrderItems, normalizeOrderConfirmInput, validateOrderContactDraft } = require('../src/features/orderCreation/domain/validation/orderCreationValidation.ts');

const id = '507f1f77bcf86cd799439011';
const addressId = '507f1f77bcf86cd799439012';
const contact = { customerName: 'Valeria Flores', customerEmail: 'valeria@example.test', customerPhone: '5500000000', notes: '' };
const input = { ...contact, items: [{ productId: id, quantity: 2 }], shippingAddressId: addressId, previewSignature: 'a'.repeat(64) };
const key = 'mobile-order-test-key-123';
const errorKind = (kind) => (error) => {
  assert.ok(error instanceof OrderCreationError); assert.equal(error.kind, kind); assert.equal(error.cause, undefined); return true;
};
const repository = (overrides = {}) => ({ load: async () => 'context', preview: async () => 'quote', confirm: async () => 'receipt',
  readCart: async () => 'cart', clearCart: async () => 'empty', ...overrides });

test('order contact matches DTO bounds, trims ends and projects only permitted contact fields', () => {
  const raw = Object.freeze({ ...contact, customerName: ' Valeria  Flores ', customerEmail: ' VALERIA@EXAMPLE.TEST ',
    customerPhone: ' 5500000000 ', notes: ' Entregar por la tarde\nGracias ', accessToken: 'private', role: 'admin' });
  const result = validateOrderContactDraft(raw);
  assert.equal(result.valid, true);
  assert.deepEqual(result.values, { ...contact, customerName: 'Valeria  Flores', notes: 'Entregar por la tarde\nGracias' });
  assert.equal(raw.customerName, ' Valeria  Flores ');
  assert.equal(Object.isFrozen(result.values), true);
});

test('order contact rejects missing or malformed fields without echoing their contents', () => {
  for (const invalid of [null, {}, [], { ...contact, customerName: 'A' }, { ...contact, customerName: 'A'.repeat(121) },
    { ...contact, customerName: 'Bad\0Name' }, { ...contact, customerEmail: 'secretbad' },
    { ...contact, customerEmail: `${'a'.repeat(110)}@example.test` }, { ...contact, customerPhone: '550000000' },
    { ...contact, customerPhone: '5'.repeat(16) }, { ...contact, notes: 'n'.repeat(601) }, { ...contact, notes: '\0secret' },
    { ...contact, notes: 1234 }]) {
    const result = validateOrderContactDraft(invalid);
    assert.equal(result.valid, false);
    assert.equal(JSON.stringify(result.errors).includes('secret'), false);
  }
  assert.equal(validateOrderContactDraft({ ...contact, customerName: 'AB', customerPhone: '5'.repeat(15), notes: 'x'.repeat(600) }).valid, true);
});

test('order item normalization freezes and whitelists valid IDs and quantities', () => {
  const source = [{ productId: id.toUpperCase(), quantity: 25, unitPrice: 0.01, accessToken: 'private' }];
  const result = normalizeOrderItems(source);
  assert.deepEqual(result, [{ productId: id, quantity: 25 }]);
  assert.ok(Object.isFrozen(result)); assert.ok(Object.isFrozen(result[0]));
  assert.equal(source[0].productId, id.toUpperCase());
});

test('order items reject empty, oversized, duplicate, malformed and invalid quantity collections', () => {
  const one = { productId: id, quantity: 1 };
  for (const entries of [null, {}, [], Array(21).fill(one), [null], [{ ...one, productId: 'bad' }],
    [{ ...one, productId: `${id}\n` }], [one, { ...one, productId: id.toUpperCase() }],
    ...[0, -1, 26, 1.5, NaN, Infinity, '1'].map((quantity) => [{ ...one, quantity }])]) {
    assert.throws(() => normalizeOrderItems(entries), errorKind('invalid-request'));
  }
  assert.equal(normalizeOrderItems(Array.from({ length: 20 }, (_, index) => ({ productId: index.toString(16).padStart(24, '0'), quantity: 1 }))).length, 20);
});

test('order confirmation validates address, opaque preview signature and normalized contact whitelist', () => {
  const result = normalizeOrderConfirmInput({ ...input, shippingAddressId: addressId.toUpperCase(), customerEmail: ' VALERIA@EXAMPLE.TEST ',
    customerName: ' Valeria Flores ', total: 0.01, token: 'private' });
  assert.deepEqual(result, input); assert.ok(Object.isFrozen(result));
  for (const invalid of [{ ...input, shippingAddressId: '' }, { ...input, shippingAddressId: `${addressId}\n` },
    { ...input, previewSignature: '' }, { ...input, previewSignature: 'g'.repeat(64) }, { ...input, previewSignature: 'a'.repeat(65) }]) {
    assert.throws(() => normalizeOrderConfirmInput(invalid), errorKind('invalid-request'));
  }
});

test('order actions forward options and safe normalized inputs for every operation', async () => {
  const calls = []; const options = { signal: new AbortController().signal };
  const actions = createOrderCreationActions(repository(Object.fromEntries(['load', 'preview', 'confirm', 'readCart', 'clearCart'].map((name) => [name, async (...args) => {
    calls.push({ name, args }); return name;
  }]))));
  await actions.load(options); await actions.preview(input.items, options); await actions.confirm(input, key, options);
  await actions.readCart(options); await actions.clearCart(options);
  assert.deepEqual(calls.map((call) => call.name), ['load', 'preview', 'confirm', 'readCart', 'clearCart']);
  assert.deepEqual(calls[2].args, [input, key, options]);
  assert.equal(calls[0].args[0], options);
});

test('order actions block invalid input and key before touching repositories', async () => {
  let writes = 0;
  const actions = createOrderCreationActions(repository({ confirm: async () => ++writes, preview: async () => ++writes }));
  await assert.rejects(actions.preview([]), errorKind('invalid-request'));
  for (const invalidKey of ['', 'short', ' key-with-valid-length-123 ', 'key\nwith-valid-length-123', 'x'.repeat(101), null]) {
    await assert.rejects(actions.confirm(input, invalidKey), errorKind('invalid-request'));
  }
  await assert.rejects(actions.confirm({ ...input, customerPhone: '' }, key), (error) => {
    errorKind('invalid-request')(error); assert.ok(error.fieldErrors.customerPhone); return true;
  });
  assert.equal(writes, 0);
});

test('order actions cancel before calls and after late completion without leaking dependency failures', async () => {
  let touched = false; const abort = new AbortController(); abort.abort();
  const actions = createOrderCreationActions(repository({ load: async () => { touched = true; return {}; } }));
  await assert.rejects(actions.load({ signal: abort.signal }), errorKind('cancelled')); assert.equal(touched, false);
  const lateAbort = new AbortController();
  await assert.rejects(createOrderCreationActions(repository({ load: async () => { lateAbort.abort(); return {}; } })).load({ signal: lateAbort.signal }), errorKind('cancelled'));
  await assert.rejects(createOrderCreationActions(repository({ load: async () => { throw new Error('private token'); } })).load(), (error) => {
    errorKind('server')(error); assert.equal(error.message.includes('private'), false); return true;
  });
});
