const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createProfileController } = require('../src/features/profile/presentation/state/createProfileController.ts');
const { ProfileError } = require('../src/features/profile/domain/errors/ProfileError.ts');

const A = '0123456789abcdef01234567', B = 'abcdef0123456789abcdef01';
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((a, b) => { resolve = a; reject = b; });
  return { promise, resolve, reject };
};
const profile = (id = A, firstName = 'Ana') => ({ id, firstName, lastName: 'López', email: 'ana@example.test', phone: '5512345678' });
const authenticated = (id = A) => ({ status: 'authenticated', user: profile(id), message: null });
function authSession(initial = authenticated()) {
  let state = initial;
  const listeners = new Set();
  return {
    getSnapshot: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async restore() {}, async signIn() { return state.user; }, async signOut() {},
    publish(next) { state = next; [...listeners].forEach((listener) => listener()); },
    listenerCount: () => listeners.size,
  };
}
function setup(overrides = {}, session = authSession(), onConfirmed) {
  const actions = { get: async () => profile(), update: async (draft) => ({ ...profile(), ...draft }), ...overrides };
  return { session, controller: createProfileController(session, actions, onConfirmed) };
}

test('profile waits for authentication and distinguishes checking, recovery and anonymous states', async () => {
  let reads = 0, writes = 0;
  const session = authSession({ status: 'checking', user: null, message: null });
  const { controller } = setup({ get: async () => { reads++; return profile(); }, update: async () => { writes++; return profile(); } }, session);
  controller.start(); await controller.refresh(); await controller.save(); controller.beginEdit();
  assert.equal(controller.getSnapshot().status, 'checking');
  session.publish({ status: 'recovery-error', user: null, message: 'Reintenta la sesión.' });
  assert.equal(controller.getSnapshot().status, 'recovery-error');
  assert.equal(controller.getSnapshot().error, 'Reintenta la sesión.');
  session.publish({ status: 'anonymous', user: null, message: null });
  assert.equal(controller.getSnapshot().status, 'anonymous');
  assert.equal(reads, 0); assert.equal(writes, 0);
  session.publish(authenticated()); await tick();
  assert.equal(controller.getSnapshot().profile.id, A);
  assert.equal(reads, 1);
  controller.stop();
});

test('authenticated start is idempotent and pending reads block refresh, editing and saving', async () => {
  const response = deferred(); let reads = 0, writes = 0, signal;
  const { session, controller } = setup({ get: async (options) => { reads++; signal = options.signal; return response.promise; },
    update: async () => { writes++; return profile(); } });
  await controller.refresh(); assert.equal(reads, 0);
  controller.start(); controller.start(); await controller.refresh(); controller.beginEdit(); await controller.save();
  assert.equal(session.listenerCount(), 1); assert.equal(reads, 1); assert.equal(writes, 0);
  assert.equal(controller.getSnapshot().status, 'loading');
  assert.equal(controller.getSnapshot().mode, 'summary'); assert.ok(signal instanceof AbortSignal);
  response.resolve(profile()); await tick();
  assert.equal(controller.getSnapshot().status, 'ready');
  assert.equal(controller.getSnapshot().draft.firstName, 'Ana');
  controller.stop(); assert.equal(session.listenerCount(), 0);
});

test('initial read error exposes no sample profile and manual retry recovers', async () => {
  let reads = 0;
  const { controller } = setup({ get: async () => {
    if (++reads === 1) throw new ProfileError('Revisa la conexión.', 'network');
    return profile();
  } });
  controller.start(); await tick();
  assert.equal(controller.getSnapshot().status, 'error');
  assert.equal(controller.getSnapshot().profile, null); assert.equal(controller.getSnapshot().draft, null);
  assert.equal(controller.getSnapshot().error, 'Revisa la conexión.');
  await controller.refresh(); assert.equal(controller.getSnapshot().profile.id, A);
  assert.equal(controller.getSnapshot().error, null);
  controller.stop();
});

test('read failures retain confirmed data and exact edited draft until a successful retry', async () => {
  let failure;
  const { controller } = setup({ get: async () => { if (failure) throw failure; return profile(); } });
  controller.start(); await tick(); controller.beginEdit(); controller.updateField('firstName', '  María  Elena ');
  for (const kind of ['network', 'timeout', 'server', 'invalid-response', 'configuration']) {
    failure = new ProfileError('No disponible.', kind); await controller.refresh();
    assert.equal(controller.getSnapshot().status, 'ready');
    assert.equal(controller.getSnapshot().profile.firstName, 'Ana');
    assert.equal(controller.getSnapshot().draft.firstName, '  María  Elena ');
    assert.equal(controller.getSnapshot().mode, 'edit'); assert.equal(controller.getSnapshot().refreshing, false);
  }
  failure = null; await controller.refresh();
  assert.equal(controller.getSnapshot().error, null);
  assert.equal(controller.getSnapshot().draft.firstName, '  María  Elena ');
  controller.stop();
});

test('local validation publishes field errors without PATCH and editing clears only that field error', async () => {
  let writes = 0;
  const { controller } = setup({ update: async () => { writes++; return profile(); } });
  controller.start(); await tick(); controller.beginEdit();
  controller.updateField('firstName', ''); controller.updateField('lastName', ''); controller.updateField('phone', '55-1234');
  await controller.save();
  assert.equal(writes, 0); assert.ok(controller.getSnapshot().fieldErrors.firstName);
  assert.ok(controller.getSnapshot().fieldErrors.lastName); assert.ok(controller.getSnapshot().fieldErrors.phone);
  assert.equal(controller.getSnapshot().requiresRefresh, false);
  controller.updateField('firstName', 'Elena');
  assert.equal(controller.getSnapshot().fieldErrors.firstName, undefined);
  assert.ok(controller.getSnapshot().fieldErrors.phone);
  assert.equal(controller.getSnapshot().draft.firstName, 'Elena');
  controller.stop();
});

test('saving sends normalized editable values and publishes only server-confirmed data', async () => {
  const response = deferred(); let writes = 0, sent;
  const { controller } = setup({ update: async (draft, options) => {
    writes++; sent = draft; assert.ok(options.signal instanceof AbortSignal); return response.promise;
  } });
  controller.start(); await tick(); controller.beginEdit();
  controller.updateField('firstName', '  María   Elena  '); controller.updateField('phone', ' 5512345678 ');
  const saving = controller.save(); await controller.save();
  assert.equal(writes, 1);
  assert.deepEqual(sent, { firstName: 'María Elena', lastName: 'López', phone: '5512345678' });
  assert.equal(controller.getSnapshot().profile.firstName, 'Ana');
  assert.equal(controller.getSnapshot().draft.firstName, '  María   Elena  ');
  assert.equal(controller.getSnapshot().saving, true); assert.equal(controller.getSnapshot().notice, null);
  response.resolve(profile(A, 'María Elena')); await saving;
  assert.equal(controller.getSnapshot().profile.firstName, 'María Elena');
  assert.equal(controller.getSnapshot().draft.firstName, 'María Elena');
  assert.equal(controller.getSnapshot().mode, 'summary'); assert.equal(controller.getSnapshot().saving, false);
  assert.ok(controller.getSnapshot().notice);
  controller.stop();
});

test('Cancel discards edits and errors without mutating the confirmed profile or issuing requests', async () => {
  let writes = 0;
  const { controller } = setup({ update: async () => { writes++; return profile(); } });
  controller.start(); await tick(); controller.beginEdit(); controller.updateField('firstName', ''); await controller.save();
  controller.cancelEdit();
  assert.equal(controller.getSnapshot().mode, 'summary'); assert.equal(controller.getSnapshot().draft.firstName, 'Ana');
  assert.equal(controller.getSnapshot().profile.firstName, 'Ana'); assert.deepEqual(controller.getSnapshot().fieldErrors, {});
  assert.equal(controller.getSnapshot().saveError, null); assert.equal(writes, 0);
  controller.beginEdit(); assert.equal(controller.getSnapshot().draft.firstName, 'Ana');
  controller.stop();
});

test('a pending PATCH locks refresh, form fields, Cancel and duplicate saves', async () => {
  const response = deferred(); let reads = 0, writes = 0;
  const { controller } = setup({ get: async () => { reads++; return profile(); },
    update: async () => { writes++; return response.promise; } });
  controller.start(); await tick(); controller.beginEdit(); controller.updateField('firstName', 'Elena');
  const saving = controller.save();
  await controller.refresh(); await controller.save(); controller.updateField('firstName', 'Otro'); controller.cancelEdit(); controller.beginEdit();
  assert.equal(reads, 1); assert.equal(writes, 1);
  assert.equal(controller.getSnapshot().draft.firstName, 'Elena'); assert.equal(controller.getSnapshot().mode, 'edit');
  response.resolve(profile(A, 'Elena')); await saving; controller.stop();
});

test('ambiguous PATCH failures retain draft and confirmed profile, requiring GET before another PATCH', async () => {
  let failWrite = true, failRead = false, reads = 0, writes = 0;
  const { controller } = setup({
    get: async () => { reads++; if (failRead) throw new ProfileError('Sin conexión.', 'network'); return profile(); },
    update: async (draft) => { writes++; if (failWrite) throw new ProfileError('Sin conexión.', 'network'); return { ...profile(), ...draft }; },
  });
  controller.start(); await tick(); controller.beginEdit(); controller.updateField('firstName', 'Elena');
  await controller.save();
  assert.equal(controller.getSnapshot().requiresRefresh, true); assert.equal(controller.getSnapshot().saving, false);
  assert.equal(controller.getSnapshot().profile.firstName, 'Ana'); assert.equal(controller.getSnapshot().draft.firstName, 'Elena');
  assert.equal(controller.getSnapshot().mode, 'edit'); assert.equal(controller.getSnapshot().saveError, 'Sin conexión.');
  await controller.save(); assert.equal(writes, 1);
  failRead = true; await controller.refresh(); await controller.save();
  assert.equal(controller.getSnapshot().requiresRefresh, true); assert.equal(writes, 1);
  failRead = false; failWrite = false; await controller.refresh();
  assert.equal(controller.getSnapshot().requiresRefresh, false); assert.equal(controller.getSnapshot().draft.firstName, 'Elena');
  await controller.save(); assert.equal(writes, 2); assert.equal(reads, 3);
  assert.equal(controller.getSnapshot().profile.firstName, 'Elena'); controller.stop();
});

test('canceling an ambiguous draft does not bypass reconciliation before a new edit can save', async () => {
  let writes = 0;
  const { controller } = setup({ update: async () => { writes++; throw new ProfileError('Respuesta incierta.', 'timeout'); } });
  controller.start(); await tick(); controller.beginEdit(); controller.updateField('firstName', 'Elena'); await controller.save();
  controller.cancelEdit(); controller.beginEdit(); controller.updateField('firstName', 'María'); await controller.save();
  assert.equal(controller.getSnapshot().requiresRefresh, true); assert.equal(writes, 1);
  assert.equal(controller.getSnapshot().draft.firstName, 'María'); controller.stop();
});

test('server validation errors retain editable draft and allow corrected retry without GET', async () => {
  let reads = 0, writes = 0;
  const { controller } = setup({ get: async () => { reads++; return profile(); }, update: async (draft) => {
    if (++writes === 1) throw new ProfileError('Revisa el teléfono.', 'validation', { phone: 'Usa otro número.' });
    return { ...profile(), ...draft };
  } });
  controller.start(); await tick(); controller.beginEdit(); await controller.save();
  assert.equal(controller.getSnapshot().requiresRefresh, false); assert.equal(controller.getSnapshot().fieldErrors.phone, 'Usa otro número.');
  controller.updateField('phone', '5598765432'); await controller.save();
  assert.equal(reads, 1); assert.equal(writes, 2); assert.equal(controller.getSnapshot().profile.phone, '5598765432');
  controller.stop();
});

test('GET never publishes another user profile and PATCH mismatch never confirms changes', async () => {
  let wrongRead = true, writes = 0, confirmations = 0;
  const { controller } = setup({ get: async () => profile(wrongRead ? B : A), update: async () => { writes++; return profile(B, 'Elena'); } },
    authSession(), () => { confirmations++; return true; });
  controller.start(); await tick();
  assert.equal(controller.getSnapshot().profile, null); assert.equal(controller.getSnapshot().status, 'error');
  wrongRead = false; await controller.refresh(); controller.beginEdit(); controller.updateField('firstName', 'Elena'); await controller.save();
  assert.equal(writes, 1); assert.equal(confirmations, 0);
  assert.equal(controller.getSnapshot().profile.id, A); assert.equal(controller.getSnapshot().profile.firstName, 'Ana');
  assert.equal(controller.getSnapshot().draft.firstName, 'Elena'); assert.equal(controller.getSnapshot().requiresRefresh, true);
  controller.stop();
});

test('unknown errors expose safe messages and require read reconciliation after an uncertain write', async () => {
  let failedRead = false;
  const { controller } = setup({ get: async () => { if (failedRead) throw new Error('mongodb://private'); return profile(); },
    update: async () => { throw new Error('Authorization: Bearer private'); } });
  controller.start(); await tick(); controller.beginEdit(); await controller.save();
  assert.equal(controller.getSnapshot().saveError, 'No pudimos confirmar los cambios. Consulta tu perfil antes de volver a guardar.');
  assert.equal(controller.getSnapshot().requiresRefresh, true);
  failedRead = true; await controller.refresh();
  assert.equal(controller.getSnapshot().error, 'No pudimos cargar tu perfil. Inténtalo de nuevo.'); controller.stop();
});

test('logout clears profile, draft and errors synchronously and ignores a late PATCH result', async () => {
  const response = deferred(); let signal, confirmations = 0;
  const { session, controller } = setup({ update: async (_, options) => { signal = options.signal; return response.promise; } },
    authSession(), () => { confirmations++; return true; });
  controller.start(); await tick(); controller.beginEdit(); controller.updateField('firstName', 'Elena'); const saving = controller.save();
  session.publish({ status: 'anonymous', user: null, message: null });
  assert.equal(signal.aborted, true); assert.equal(controller.getSnapshot().profile, null); assert.equal(controller.getSnapshot().draft, null);
  response.resolve(profile(A, 'Elena')); await saving;
  assert.equal(controller.getSnapshot().status, 'anonymous'); assert.equal(confirmations, 0); controller.stop();
});

test('different account and same-account login reset drafts and ignore obsolete GET responses', async () => {
  const old = deferred(), current = deferred(), nextLogin = deferred(); let reads = 0, oldSignal;
  const { session, controller } = setup({ get: async (options) => {
    if (++reads === 1) { oldSignal = options.signal; return old.promise; }
    return reads === 2 ? current.promise : nextLogin.promise;
  } });
  controller.start(); session.publish(authenticated(B));
  assert.equal(oldSignal.aborted, true); current.resolve(profile(B, 'Beatriz')); await tick();
  controller.beginEdit(); controller.updateField('firstName', 'Borrador'); session.publish(authenticated(B));
  assert.equal(controller.getSnapshot().profile, null); assert.equal(controller.getSnapshot().draft, null);
  nextLogin.resolve(profile(B, 'Beatriz nueva')); await tick(); old.resolve(profile(A)); await tick();
  assert.equal(controller.getSnapshot().profile.id, B); assert.equal(controller.getSnapshot().profile.firstName, 'Beatriz nueva'); controller.stop();
});

test('401 from GET clears all personal data and remains blocked across runtime restart until login changes', async () => {
  let reads = 0;
  const { session, controller } = setup({ get: async () => {
    if (++reads === 2) throw new ProfileError('No autorizada.', 'unauthorized'); return profile();
  } });
  controller.start(); await tick(); controller.beginEdit(); controller.updateField('firstName', 'Elena'); await controller.refresh();
  assert.equal(controller.getSnapshot().status, 'session-expired'); assert.equal(controller.getSnapshot().profile, null);
  assert.equal(controller.getSnapshot().draft, null); controller.beginEdit(); await controller.save(); await controller.refresh();
  controller.stop(); controller.start(); await controller.refresh(); assert.equal(reads, 2);
  session.publish(authenticated()); await tick(); assert.equal(reads, 3); assert.equal(controller.getSnapshot().status, 'ready'); controller.stop();
});

test('401 from PATCH clears draft while an obsolete 401 cannot expire another account', async () => {
  const staleRead = deferred(); let reads = 0;
  const { session, controller } = setup({ get: async () => ++reads === 2 ? staleRead.promise : profile(session.getSnapshot().user.id),
    update: async () => { throw new ProfileError('No autorizada.', 'unauthorized'); } });
  controller.start(); await tick(); controller.beginEdit(); await controller.save();
  assert.equal(controller.getSnapshot().status, 'session-expired'); assert.equal(controller.getSnapshot().draft, null);
  session.publish(authenticated()); session.publish(authenticated(B)); await tick();
  staleRead.reject(new ProfileError('No autorizada.', 'unauthorized')); await tick();
  assert.equal(controller.getSnapshot().status, 'ready'); assert.equal(controller.getSnapshot().profile.id, B); controller.stop();
});

test('stop aborts pending reads and effect restart accepts only the newest response', async () => {
  const old = deferred(), fresh = deferred(); let reads = 0, oldSignal, notifications = 0;
  const { controller } = setup({ get: async (options) => {
    if (++reads === 1) { oldSignal = options.signal; return old.promise; } return fresh.promise;
  } });
  const unsubscribe = controller.subscribe(() => notifications++);
  controller.start(); controller.stop(); const before = notifications;
  assert.equal(oldSignal.aborted, true); assert.equal(controller.getSnapshot().profile, null);
  old.resolve(profile(A, 'Vieja')); await tick(); assert.equal(notifications, before);
  controller.start(); fresh.resolve(profile(A, 'Nueva')); await tick();
  assert.equal(controller.getSnapshot().profile.firstName, 'Nueva'); assert.equal(reads, 2);
  unsubscribe(); controller.stop();
});

test('confirmed PATCH callback updates the public session without recursively reloading profile', async () => {
  const session = authSession(); let reads = 0, calls = 0, expected;
  const { controller } = setup({ get: async () => { reads++; return profile(); } }, session, (confirmed, snapshot) => {
    calls++; expected = snapshot;
    assert.equal(session.getSnapshot(), snapshot);
    session.publish({ status: 'authenticated', user: { ...confirmed }, message: null });
    return true;
  });
  controller.start(); await tick(); const original = session.getSnapshot();
  controller.beginEdit(); controller.updateField('firstName', 'Elena'); await controller.save();
  assert.equal(calls, 1); assert.equal(expected, original); assert.equal(reads, 1);
  assert.equal(controller.getSnapshot().profile.firstName, 'Elena'); assert.equal(controller.getSnapshot().saving, false);
  assert.equal(controller.getSnapshot().mode, 'summary'); assert.ok(controller.getSnapshot().notice);
  controller.beginEdit(); controller.updateField('firstName', 'María'); await controller.save();
  assert.equal(reads, 1); assert.equal(calls, 2); assert.equal(controller.getSnapshot().profile.firstName, 'María'); controller.stop();
});

test('session invalidation during the confirmation callback prevents publishing the former profile', async () => {
  const session = authSession();
  const { controller } = setup({}, session, () => {
    session.publish({ status: 'anonymous', user: null, message: null }); return false;
  });
  controller.start(); await tick(); controller.beginEdit(); controller.updateField('firstName', 'Elena'); await controller.save();
  assert.equal(controller.getSnapshot().status, 'anonymous'); assert.equal(controller.getSnapshot().profile, null);
  assert.equal(controller.getSnapshot().draft, null); assert.equal(controller.getSnapshot().notice, null); controller.stop();
});

test('a failed private confirmation callback leaves a recoverable draft instead of stuck saving', async () => {
  const session = authSession();
  const { controller } = setup({}, session, (confirmed) => {
    session.publish({ status: 'authenticated', user: confirmed, message: null }); throw new Error('private callback exception');
  });
  controller.start(); await tick(); controller.beginEdit(); controller.updateField('firstName', 'Elena'); await controller.save();
  assert.equal(controller.getSnapshot().saving, false); assert.equal(controller.getSnapshot().requiresRefresh, true);
  assert.equal(controller.getSnapshot().profile.firstName, 'Ana'); assert.equal(controller.getSnapshot().draft.firstName, 'Elena');
  assert.equal(controller.getSnapshot().notice, null); controller.stop();
});

test('published snapshots copy and freeze public profile, draft and field errors', async () => {
  const source = { ...profile(), accessToken: 'private' };
  const { controller } = setup({ get: async () => source });
  controller.start(); await tick(); const ready = controller.getSnapshot(); source.firstName = 'Alterado';
  assert.equal(ready.profile.firstName, 'Ana'); assert.equal(ready.profile.accessToken, undefined);
  assert.equal(Object.isFrozen(ready), true); assert.equal(Object.isFrozen(ready.profile), true); assert.equal(Object.isFrozen(ready.draft), true);
  controller.beginEdit(); controller.updateField('firstName', ''); await controller.save();
  assert.equal(Object.isFrozen(controller.getSnapshot().fieldErrors), true); controller.stop();
});
