const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createShippingAddressesController } = require('../src/features/shippingAddresses/presentation/state/createShippingAddressesController.ts');
const { ShippingAddressError } = require('../src/features/shippingAddresses/domain/errors/ShippingAddressError.ts');
const { createAuthSession } = require('../src/features/auth/domain/session/createAuthSession.ts');

const USER = '0123456789abcdef01234567', OTHER_USER = 'abcdef0123456789abcdef01';
const A = '0123456789abcdef01234561', B = '0123456789abcdef01234562';
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const user = (id = USER) => ({ id, firstName: 'Ana', lastName: 'López', email: 'ana@example.test', phone: '5512345678' });
const authenticated = (id) => ({ status: 'authenticated', user: user(id), message: null });
const draft = (label = 'Casa', isDefault = false) => ({ label, recipientName: 'Ana López', phone: '5512345678',
  street: 'Av. Principal', exteriorNumber: '12', interiorNumber: '', neighborhood: 'Centro', municipality: 'Pachuca',
  state: 'Hidalgo', postalCode: '42000', references: '', isDefault });
const address = (id = A, label = 'Casa', isDefault = true) => ({ ...draft(label, isDefault), id });
function authSession(initial = authenticated()) {
  let state = initial; const listeners = new Set();
  return { getSnapshot: () => state, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async restore() {}, async signIn() { return state.user; }, async signOut() {},
    publish(next) { state = next; [...listeners].forEach((listener) => listener()); }, listenerCount: () => listeners.size };
}
function setup(overrides = {}, session = authSession()) {
  const actions = { list: async () => [], create: async (values) => [{ ...values, id: A }],
    update: async (id, values) => [{ ...values, id }], select: async () => [], remove: async () => [], ...overrides };
  return { session, controller: createShippingAddressesController(session, actions) };
}
function fill(controller, values = draft()) {
  for (const [field, value] of Object.entries(values)) if (field !== 'isDefault') controller.updateField(field, value);
}

test('addresses never request data without verified authentication and expose checking/recovery/anonymous states', async () => {
  let reads = 0, writes = 0;
  const session = authSession({ status: 'checking', user: null, message: null });
  const { controller } = setup({ list: async () => { reads++; return []; }, create: async () => { writes++; return []; } }, session);
  controller.start(); await controller.refresh(); controller.openCreate(); await controller.save();
  assert.equal(controller.getSnapshot().status, 'checking'); assert.equal(controller.getSnapshot().addresses, null);
  session.publish({ status: 'recovery-error', user: null, message: 'Reintenta tu sesión.' });
  assert.equal(controller.getSnapshot().status, 'recovery-error'); assert.equal(controller.getSnapshot().message, 'Reintenta tu sesión.');
  session.publish({ status: 'anonymous', user: null, message: null });
  await controller.refresh(); controller.openCreate(); await controller.save();
  assert.equal(controller.getSnapshot().status, 'anonymous'); assert.equal(reads, 0); assert.equal(writes, 0);
  session.publish(authenticated()); await tick(); assert.equal(reads, 1); assert.deepEqual(controller.getSnapshot().addresses, []);
  controller.stop();
});

test('authenticated start reads once and pending GET blocks duplicate requests and every form action', async () => {
  const response = deferred(); let reads = 0, signal;
  const { session, controller } = setup({ list: async (options) => { reads++; signal = options.signal; return response.promise; } });
  await controller.refresh(); assert.equal(reads, 0);
  controller.start(); controller.start(); await controller.refresh(); controller.openCreate(); controller.openEdit(A);
  controller.updateField('label', 'Otro'); controller.toggleDefault(); controller.cancelForm(); await controller.save(); await controller.select(A); await controller.remove(A);
  assert.equal(reads, 1); assert.equal(session.listenerCount(), 1); assert.ok(signal instanceof AbortSignal);
  assert.equal(controller.getSnapshot().loading, true); assert.equal(controller.getSnapshot().draft, null);
  response.resolve([address()]); await tick();
  assert.equal(controller.getSnapshot().loading, false); assert.equal(controller.getSnapshot().addresses[0].id, A);
  controller.stop(); assert.equal(session.listenerCount(), 0);
});

test('an initial read failure has no sample rows and manual retry can confirm a real empty collection', async () => {
  let reads = 0;
  const { controller } = setup({ list: async () => { if (++reads === 1) throw new ShippingAddressError('Sin conexión.', 'network'); return []; } });
  controller.start(); await tick();
  assert.equal(controller.getSnapshot().addresses, null); assert.equal(controller.getSnapshot().loading, false);
  assert.equal(controller.getSnapshot().message, 'Sin conexión.'); controller.openCreate(); assert.equal(controller.getSnapshot().draft, null);
  await controller.refresh(); assert.deepEqual(controller.getSnapshot().addresses, []); assert.equal(controller.getSnapshot().message, null); controller.stop();
});

test('local validation blocks POST and clears only a corrected field error', async () => {
  let creates = 0;
  const { controller } = setup({ create: async () => { creates++; return []; } });
  controller.start(); await tick(); controller.openCreate(); await controller.save();
  assert.equal(creates, 0); assert.ok(controller.getSnapshot().fieldErrors.label); assert.ok(controller.getSnapshot().fieldErrors.phone);
  controller.updateField('label', 'Casa'); assert.equal(controller.getSnapshot().fieldErrors.label, undefined);
  assert.ok(controller.getSnapshot().fieldErrors.phone); assert.equal(controller.getSnapshot().requiresRefresh, false); controller.stop();
});

test('create sends normalized fields once and shows only the server-confirmed list and confirmation', async () => {
  const response = deferred(); let creates = 0, received;
  const { controller } = setup({ create: async (values, options) => { creates++; received = values; assert.ok(options.signal instanceof AbortSignal); return response.promise; } });
  controller.start(); await tick(); controller.openCreate(); fill(controller, draft('  Casa nueva  '));
  const saving = controller.save(); await controller.save();
  assert.equal(creates, 1); assert.equal(received.label, 'Casa nueva'); assert.equal(received.id, undefined);
  assert.deepEqual(controller.getSnapshot().addresses, []); assert.equal(controller.getSnapshot().draft.label, '  Casa nueva  ');
  assert.equal(controller.getSnapshot().saving, true); assert.equal(controller.getSnapshot().confirmation, null);
  response.resolve([address(A, 'Casa nueva', true)]); await saving;
  assert.equal(controller.getSnapshot().addresses[0].label, 'Casa nueva'); assert.equal(controller.getSnapshot().addresses[0].isDefault, true);
  assert.equal(controller.getSnapshot().mode, 'list'); assert.equal(controller.getSnapshot().draft, null); assert.ok(controller.getSnapshot().confirmation);
  controller.dismissConfirmation(); assert.equal(controller.getSnapshot().confirmation, null); controller.stop();
});

test('edit PATCH retains the previous row until confirmation, then applies the complete authoritative list', async () => {
  const response = deferred(); let writes = 0;
  const { controller } = setup({ list: async () => [address(A, 'Casa', true), address(B, 'Trabajo', false)],
    update: async (id, values) => { writes++; assert.equal(id, B); assert.equal(values.label, 'Oficina'); assert.equal(values.isDefault, true); return response.promise; } });
  controller.start(); await tick(); controller.openEdit(B); controller.updateField('label', 'Oficina'); controller.toggleDefault();
  const saving = controller.save(); assert.equal(controller.getSnapshot().pendingId, B);
  assert.equal(controller.getSnapshot().addresses[1].label, 'Trabajo'); assert.equal(controller.getSnapshot().addresses[0].isDefault, true);
  response.resolve([address(A, 'Casa', false), address(B, 'Oficina', true)]); await saving;
  assert.equal(writes, 1); assert.equal(controller.getSnapshot().addresses[0].isDefault, false);
  assert.equal(controller.getSnapshot().addresses[1].isDefault, true); assert.equal(controller.getSnapshot().mode, 'list'); controller.stop();
});

test('create cannot confirm an existing identical row or a different new address as the requested addition', async () => {
  let result = [address(A, 'Casa', true)];
  const { controller } = setup({ list: async () => [address(A, 'Casa', true)], create: async () => result });
  controller.start(); await tick(); controller.openCreate(); fill(controller, draft('Casa', false)); await controller.save();
  assert.equal(controller.getSnapshot().requiresRefresh, true); assert.equal(controller.getSnapshot().mode, 'create');
  assert.equal(controller.getSnapshot().draft.label, 'Casa'); assert.equal(controller.getSnapshot().confirmation, null);
  assert.equal(controller.getSnapshot().addresses.length, 1);
  await controller.refresh(); result = [address(A, 'Casa', true), address(B, 'Otro lugar', false)]; await controller.save();
  assert.equal(controller.getSnapshot().requiresRefresh, true); assert.equal(controller.getSnapshot().confirmation, null);
  await controller.refresh(); result = [address(A, 'Casa', true), address(B, 'Casa', false), address('0123456789abcdef01234563', 'Otra', false)];
  await controller.save(); assert.equal(controller.getSnapshot().requiresRefresh, true); assert.equal(controller.getSnapshot().addresses.length, 1);
  await controller.refresh(); result = [address(A, 'Casa', true), address(B, 'Casa', false)]; await controller.save();
  assert.equal(controller.getSnapshot().requiresRefresh, false); assert.equal(controller.getSnapshot().addresses.length, 2);
  assert.ok(controller.getSnapshot().confirmation); controller.stop();
});

test('select and remove use server defaults and never change rows optimistically', async () => {
  const selected = deferred(), removed = deferred(); let selections = 0, removals = 0;
  const { controller } = setup({ list: async () => [address(A, 'Casa', true), address(B, 'Trabajo', false)],
    select: async (id) => { selections++; assert.equal(id, B); return selected.promise; },
    remove: async (id) => { removals++; assert.equal(id, B); return removed.promise; } });
  controller.start(); await tick(); await controller.select(A); assert.equal(selections, 0);
  const selecting = controller.select(B); await controller.select(B); await controller.remove(A);
  assert.equal(selections, 1); assert.equal(removals, 0); assert.equal(controller.getSnapshot().addresses[0].isDefault, true);
  selected.resolve([address(A, 'Casa', false), address(B, 'Trabajo', true)]); await selecting;
  const removing = controller.remove(B); await controller.remove(B);
  assert.equal(controller.getSnapshot().addresses.length, 2); assert.equal(removals, 1);
  removed.resolve([address(A, 'Casa', true)]); await removing;
  assert.equal(controller.getSnapshot().addresses.length, 1); assert.equal(controller.getSnapshot().addresses[0].isDefault, true); controller.stop();
});

test('a principal address cannot be toggled off during edit, while a secondary draft can toggle freely', async () => {
  const { controller } = setup({ list: async () => [address(A, 'Casa', true), address(B, 'Trabajo', false)] });
  controller.start(); await tick(); controller.openEdit(A); controller.toggleDefault();
  assert.equal(controller.getSnapshot().draft.isDefault, true);
  controller.cancelForm(); controller.openEdit(B); controller.toggleDefault(); assert.equal(controller.getSnapshot().draft.isDefault, true);
  controller.toggleDefault(); assert.equal(controller.getSnapshot().draft.isDefault, false); controller.stop();
});

test('reconciling a committed principal change restores only the principal flag and preserves every draft text', async () => {
  let remotePrincipal = false;
  const { controller } = setup({
    list: async () => [address(A, 'Casa', !remotePrincipal), address(B, 'Trabajo', remotePrincipal)],
    update: async () => { remotePrincipal = true; throw new ShippingAddressError('Respuesta incierta.', 'timeout'); },
  });
  controller.start(); await tick(); controller.openEdit(B); fill(controller, draft('  Oficina nueva  '));
  controller.updateField('references', '  Puerta azul, segundo piso  '); controller.toggleDefault(); await controller.save();
  assert.equal(controller.getSnapshot().requiresRefresh, true);
  controller.toggleDefault();
  const before = { ...controller.getSnapshot().draft };
  assert.equal(before.isDefault, false);
  await controller.refresh();
  assert.equal(controller.getSnapshot().addresses.find((item) => item.id === B).isDefault, true);
  assert.deepEqual(controller.getSnapshot().draft, { ...before, isDefault: true });
  assert.equal(controller.getSnapshot().requiresRefresh, false);
  controller.toggleDefault(); assert.equal(controller.getSnapshot().draft.isDefault, true); controller.stop();
});

test('refresh keeps the user intention to select a secondary address while the server still marks it secondary', async () => {
  const { controller } = setup({ list: async () => [address(A, 'Casa', true), address(B, 'Trabajo', false)] });
  controller.start(); await tick(); controller.openEdit(B); controller.updateField('label', '  Mi oficina  '); controller.toggleDefault();
  const before = controller.getSnapshot().draft;
  await controller.refresh();
  assert.equal(controller.getSnapshot().addresses.find((item) => item.id === B).isDefault, false);
  assert.deepEqual(controller.getSnapshot().draft, before); assert.equal(controller.getSnapshot().draft.isDefault, true); controller.stop();
});

test('five confirmed addresses block creating a form and a stale open form cannot bypass the limit', async () => {
  let full = false, creates = 0;
  const five = Array.from({ length: 5 }, (_, index) => address(`0123456789abcdef0123456${index}`, `Casa ${index}`, index === 0));
  const { controller } = setup({ list: async () => full ? five : [], create: async () => { creates++; return five; } });
  controller.start(); await tick(); controller.openCreate(); fill(controller); full = true; await controller.refresh();
  assert.equal(controller.getSnapshot().mode, 'create'); assert.ok(controller.getSnapshot().draft);
  await controller.save(); assert.equal(creates, 0); assert.equal(controller.getSnapshot().addresses.length, 5);
  controller.cancelForm(); controller.openCreate(); assert.equal(controller.getSnapshot().mode, 'list'); assert.equal(controller.getSnapshot().draft, null); controller.stop();
});

test('Cancel discards local fields, errors and principal choice without requests', async () => {
  let updates = 0;
  const { controller } = setup({ list: async () => [address()], update: async () => { updates++; return []; } });
  controller.start(); await tick(); controller.openEdit(A); controller.updateField('label', ''); await controller.save(); controller.cancelForm();
  assert.equal(updates, 0); assert.equal(controller.getSnapshot().mode, 'list'); assert.equal(controller.getSnapshot().editingId, null);
  assert.equal(controller.getSnapshot().draft, null); assert.deepEqual(controller.getSnapshot().fieldErrors, {});
  controller.openEdit(A); assert.equal(controller.getSnapshot().draft.label, 'Casa'); controller.stop();
});

test('a pending write blocks GET and every competing form and CRUD action', async () => {
  const response = deferred(); let reads = 0, updates = 0, deletes = 0;
  const { controller } = setup({ list: async () => { reads++; return [address()]; }, update: async () => { updates++; return response.promise; },
    remove: async () => { deletes++; return []; } });
  controller.start(); await tick(); controller.openEdit(A); controller.updateField('label', 'Nueva'); const saving = controller.save();
  await controller.refresh(); controller.cancelForm(); controller.openCreate(); controller.openEdit(A); controller.updateField('label', 'Otro'); controller.toggleDefault();
  await controller.save(); await controller.remove(A); await controller.select(A);
  assert.equal(reads, 1); assert.equal(updates, 1); assert.equal(deletes, 0); assert.equal(controller.getSnapshot().draft.label, 'Nueva');
  assert.equal(controller.getSnapshot().mode, 'edit'); response.resolve([address(A, 'Nueva')]); await saving; controller.stop();
});

test('uncertain writes preserve exact form and confirmed rows, requiring a successful GET before another write', async () => {
  let writeFails = true, readFails = false, reads = 0, updates = 0;
  const { controller } = setup({ list: async () => { reads++; if (readFails) throw new ShippingAddressError('Sin red.', 'network'); return [address()]; },
    update: async (_, values) => { updates++; if (writeFails) throw new ShippingAddressError('Respuesta incierta.', 'timeout'); return [{ ...values, id: A }]; } });
  controller.start(); await tick(); controller.openEdit(A); controller.updateField('label', '  Mi casa  '); await controller.save();
  assert.equal(controller.getSnapshot().requiresRefresh, true); assert.equal(controller.getSnapshot().addresses[0].label, 'Casa');
  assert.equal(controller.getSnapshot().draft.label, '  Mi casa  '); assert.equal(controller.getSnapshot().mode, 'edit');
  controller.updateField('references', 'Puerta verde'); assert.equal(controller.getSnapshot().message, 'Respuesta incierta.');
  await controller.save(); assert.equal(updates, 1);
  readFails = true; await controller.refresh(); assert.equal(controller.getSnapshot().requiresRefresh, true);
  assert.equal(controller.getSnapshot().draft.references, 'Puerta verde'); await controller.save(); assert.equal(updates, 1);
  readFails = false; writeFails = false; await controller.refresh();
  assert.equal(controller.getSnapshot().requiresRefresh, false); assert.equal(controller.getSnapshot().draft.label, '  Mi casa  ');
  assert.equal(updates, 1); await controller.save(); assert.equal(updates, 2); assert.equal(reads, 3);
  assert.equal(controller.getSnapshot().addresses[0].label, 'Mi casa'); controller.stop();
});

test('Cancel and new form attempts cannot bypass reconciliation after a failed create', async () => {
  let creates = 0;
  const { controller } = setup({ create: async () => { creates++; throw new ShippingAddressError('Sin red.', 'network'); } });
  controller.start(); await tick(); controller.openCreate(); fill(controller); await controller.save(); controller.cancelForm();
  assert.equal(controller.getSnapshot().requiresRefresh, true); assert.equal(controller.getSnapshot().message, 'Sin red.');
  controller.openCreate(); await controller.save(); assert.equal(controller.getSnapshot().mode, 'list'); assert.equal(creates, 1); controller.stop();
});

test('all non-validation mutation failures require reconciliation and preserve the selected default', async () => {
  let kind = 'server';
  const { controller } = setup({ list: async () => [address(A, 'Casa', true), address(B, 'Trabajo', false)],
    select: async () => { throw new ShippingAddressError('No confirmado.', kind); } });
  controller.start(); await tick();
  for (kind of ['network', 'timeout', 'server', 'invalid-response', 'not-found', 'limit', 'configuration', 'cancelled', 'unknown']) {
    await controller.select(B);
    assert.equal(controller.getSnapshot().requiresRefresh, true, kind);
    assert.equal(controller.getSnapshot().addresses[0].isDefault, true); assert.equal(controller.getSnapshot().addresses[1].isDefault, false);
    await controller.refresh();
  }
  controller.stop();
});

test('backend validation preserves the form and allows corrected save without a reconciliation GET', async () => {
  let creates = 0, reads = 0;
  const { controller } = setup({ list: async () => { reads++; return []; }, create: async (values) => {
    if (++creates === 1) throw new ShippingAddressError('Revisa tu teléfono.', 'validation', { phone: 'Escribe otro número.' });
    return [{ ...values, id: A }];
  } });
  controller.start(); await tick(); controller.openCreate(); fill(controller); await controller.save();
  assert.equal(controller.getSnapshot().requiresRefresh, false); assert.equal(controller.getSnapshot().fieldErrors.phone, 'Escribe otro número.');
  controller.updateField('phone', '5598765432'); await controller.save();
  assert.equal(reads, 1); assert.equal(creates, 2); assert.equal(controller.getSnapshot().addresses[0].phone, '5598765432'); controller.stop();
});

test('failed GET retains confirmed rows and an open draft; successful GET also preserves the draft', async () => {
  let failure = false;
  const { controller } = setup({ list: async () => { if (failure) throw new ShippingAddressError('No disponible.', 'server'); return [address()]; } });
  controller.start(); await tick(); controller.openEdit(A); controller.updateField('label', 'Borrador');
  failure = true; await controller.refresh();
  assert.equal(controller.getSnapshot().addresses[0].label, 'Casa'); assert.equal(controller.getSnapshot().draft.label, 'Borrador');
  assert.equal(controller.getSnapshot().refreshing, false); failure = false; await controller.refresh();
  assert.equal(controller.getSnapshot().draft.label, 'Borrador'); assert.equal(controller.getSnapshot().message, null); controller.stop();
});

test('a failed GET blocks every write and creating a form until a subsequent GET succeeds', async () => {
  let failRead = false, reads = 0, updates = 0, selections = 0, removals = 0;
  let rows = [address(A, 'Casa', true), address(B, 'Trabajo', false)];
  const { controller } = setup({
    list: async () => { reads++; if (failRead) throw new ShippingAddressError('No disponible.', 'network'); return rows; },
    update: async (id, values) => { updates++; rows = rows.map((item) => item.id === id ? { ...values, id } : item); return rows; },
    select: async (id) => { selections++; rows = rows.map((item) => ({ ...item, isDefault: item.id === id })); return rows; },
    remove: async (id) => { removals++; rows = rows.filter((item) => item.id !== id); return rows; },
  });
  controller.start(); await tick(); controller.openEdit(B); controller.updateField('label', '  Borrador  ');
  failRead = true; await controller.refresh();
  assert.equal(controller.getSnapshot().requiresRefresh, true);
  assert.equal(controller.getSnapshot().addresses[1].label, 'Trabajo');
  assert.equal(controller.getSnapshot().draft.label, '  Borrador  ');
  await controller.save(); controller.openCreate();
  assert.equal(updates, 0); assert.equal(controller.getSnapshot().mode, 'edit');
  assert.equal(controller.getSnapshot().draft.label, '  Borrador  ');
  controller.cancelForm(); await controller.select(B); await controller.remove(A); controller.openCreate();
  assert.equal(selections, 0); assert.equal(removals, 0); assert.equal(controller.getSnapshot().mode, 'list');
  await controller.refresh();
  assert.equal(controller.getSnapshot().requiresRefresh, true); assert.equal(controller.getSnapshot().addresses.length, 2);
  failRead = false; await controller.refresh();
  assert.equal(controller.getSnapshot().requiresRefresh, false); assert.equal(reads, 4);
  controller.openEdit(B); controller.updateField('label', 'Oficina'); await controller.save();
  await controller.select(B); await controller.remove(A); controller.openCreate();
  assert.equal(updates, 1); assert.equal(selections, 1); assert.equal(removals, 1);
  assert.equal(controller.getSnapshot().mode, 'create'); assert.equal(controller.getSnapshot().addresses[0].label, 'Oficina');
  controller.stop();
});

test('a reconciled deletion of the editing target retains the draft but prevents PATCH to a missing row', async () => {
  let deleted = false, updates = 0;
  const { controller } = setup({ list: async () => deleted ? [] : [address()], update: async () => { updates++; return []; } });
  controller.start(); await tick(); controller.openEdit(A); controller.updateField('label', 'Borrador'); deleted = true; await controller.refresh(); await controller.save();
  assert.equal(updates, 0); assert.equal(controller.getSnapshot().draft.label, 'Borrador'); assert.ok(controller.getSnapshot().message); controller.stop();
});

test('logout clears addresses and drafts immediately, aborting and ignoring a late create response', async () => {
  const response = deferred(); let signal;
  const { session, controller } = setup({ create: async (_, options) => { signal = options.signal; return response.promise; } });
  controller.start(); await tick(); controller.openCreate(); fill(controller); const saving = controller.save();
  session.publish({ status: 'anonymous', user: null, message: null });
  assert.equal(signal.aborted, true); assert.equal(controller.getSnapshot().addresses, null); assert.equal(controller.getSnapshot().draft, null);
  response.resolve([address()]); await saving;
  assert.equal(controller.getSnapshot().status, 'anonymous'); assert.equal(controller.getSnapshot().confirmation, null); controller.stop();
});

test('a different account and another login to the same account reset state and discard earlier responses', async () => {
  const old = deferred(), other = deferred(), relogin = deferred(); let reads = 0, oldSignal;
  const { session, controller } = setup({ list: async (options) => { if (++reads === 1) { oldSignal = options.signal; return old.promise; } return reads === 2 ? other.promise : relogin.promise; } });
  controller.start(); session.publish(authenticated(OTHER_USER)); assert.equal(oldSignal.aborted, true);
  other.resolve([address(B, 'Otra cuenta')]); await tick(); controller.openEdit(B); controller.updateField('label', 'Borrador');
  session.publish(authenticated(OTHER_USER)); assert.equal(controller.getSnapshot().addresses, null); assert.equal(controller.getSnapshot().draft, null);
  relogin.resolve([address(B, 'Actual')]); await tick(); old.resolve([address(A, 'Vieja')]); await tick();
  assert.equal(controller.getSnapshot().addresses[0].label, 'Actual'); controller.stop();
});

test('real authorizationSession preserves a pending address write when only profile metadata changes', async () => {
  const runtime = createAuthSession(async () => ({ accessToken: 'header.payload.signature', user: user() }),
    { get: async () => null, set: async () => {}, clear: async () => {} }, async () => user());
  await runtime.session.signIn({ email: 'ana@example.test', password: 'password' });
  const response = deferred(); let signal, reads = 0;
  const { controller } = setup({ list: async () => { reads++; return []; }, create: async (_, options) => { signal = options.signal; return response.promise; } }, runtime.authorizationSession);
  controller.start(); await tick(); controller.openCreate(); fill(controller); const saving = controller.save();
  const expected = runtime.session.getSnapshot();
  assert.equal(runtime.updatePublicUser({ ...user(), firstName: 'Elena' }, expected), true);
  assert.equal(signal.aborted, false); assert.equal(controller.getSnapshot().saving, true); assert.equal(reads, 1);
  response.resolve([address()]); await saving;
  assert.equal(controller.getSnapshot().addresses.length, 1); assert.ok(controller.getSnapshot().confirmation); controller.stop();
});

test('401 from GET clears personal data and remains blocked through stop/start until a new login', async () => {
  let reads = 0;
  const { session, controller } = setup({ list: async () => { if (++reads === 2) throw new ShippingAddressError('No autorizada.', 'unauthorized'); return [address()]; } });
  controller.start(); await tick(); controller.openEdit(A); await controller.refresh();
  assert.equal(controller.getSnapshot().status, 'expired'); assert.equal(controller.getSnapshot().addresses, null); assert.equal(controller.getSnapshot().draft, null);
  controller.stop(); controller.start(); await controller.refresh(); controller.openCreate(); await controller.save(); assert.equal(reads, 2);
  session.publish(authenticated()); await tick(); assert.equal(reads, 3); assert.equal(controller.getSnapshot().status, 'ready'); controller.stop();
});

test('401 from mutation clears all fields, while an obsolete 401 cannot expire a new account', async () => {
  const oldRead = deferred(); let reads = 0;
  const { session, controller } = setup({ list: async () => ++reads === 2 ? oldRead.promise : [address()], remove: async () => { throw new ShippingAddressError('No autorizada.', 'unauthorized'); } });
  controller.start(); await tick(); await controller.remove(A);
  assert.equal(controller.getSnapshot().status, 'expired'); assert.equal(controller.getSnapshot().addresses, null);
  assert.deepEqual(controller.getSnapshot().fieldErrors, {}); assert.equal(controller.getSnapshot().pendingId, null);
  session.publish(authenticated()); session.publish(authenticated(OTHER_USER)); await tick();
  oldRead.reject(new ShippingAddressError('No autorizada.', 'unauthorized')); await tick();
  assert.equal(controller.getSnapshot().status, 'ready'); assert.equal(controller.getSnapshot().addresses.length, 1); controller.stop();
});

test('stop aborts pending writes and a late result cannot notify observers or revive a draft', async () => {
  const response = deferred(); let signal, notifications = 0;
  const { controller } = setup({ create: async (_, options) => { signal = options.signal; return response.promise; } });
  const unsubscribe = controller.subscribe(() => notifications++);
  controller.start(); await tick(); controller.openCreate(); fill(controller); const saving = controller.save(); controller.stop();
  const before = notifications; assert.equal(signal.aborted, true);
  response.resolve([address()]); await saving;
  assert.equal(notifications, before); assert.equal(controller.getSnapshot().addresses, null); assert.equal(controller.getSnapshot().draft, null);
  unsubscribe();
});

test('effect restart accepts only its current read even when a stopped transport ignores AbortSignal', async () => {
  const old = deferred(), fresh = deferred(); let reads = 0;
  const { controller } = setup({ list: async () => ++reads === 1 ? old.promise : fresh.promise });
  controller.start(); controller.stop(); controller.start(); fresh.resolve([address(B, 'Actual')]); await tick();
  old.resolve([address(A, 'Vieja')]); await tick(); assert.equal(controller.getSnapshot().addresses[0].label, 'Actual'); controller.stop();
});

test('unknown failures never expose transport details and snapshots freeze copies of public fields', async () => {
  const source = { ...address(), ownerToken: 'private' }; let fail = false;
  const { controller } = setup({ list: async () => { if (fail) throw new Error('mongodb://private'); return [source]; }, remove: async () => { throw new Error('Authorization: Bearer private'); } });
  controller.start(); await tick(); const snapshot = controller.getSnapshot(); source.label = 'Alterada';
  assert.equal(snapshot.addresses[0].label, 'Casa'); assert.equal(snapshot.addresses[0].ownerToken, undefined);
  assert.equal(Object.isFrozen(snapshot), true); assert.equal(Object.isFrozen(snapshot.addresses), true); assert.equal(Object.isFrozen(snapshot.addresses[0]), true);
  await controller.remove(A); assert.equal(controller.getSnapshot().message, 'No pudimos confirmar el cambio. Reintenta la consulta antes de volver a guardar.');
  fail = true; await controller.refresh(); assert.equal(controller.getSnapshot().message, 'No pudimos cargar tus direcciones. Inténtalo de nuevo.'); controller.stop();
});
