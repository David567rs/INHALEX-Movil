const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createNoticesController } = require('../src/features/notices/presentation/state/createNoticesController.ts');
const { NoticesError } = require('../src/features/notices/domain/errors/NoticesError.ts');

const A = '000000000000000000000001', B = '000000000000000000000002', C = '000000000000000000000003';
const USER = '111111111111111111111111', OTHER = '222222222222222222222222';
const readAt = '2026-10-20T14:00:00.000Z';
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const authenticated = (id = USER) => ({ status: 'authenticated', user: { id, firstName: 'Ana', lastName: 'López', email: 'ana@example.test', phone: '5512345678' }, message: null });
const notice = (id = A, changes = {}) => ({ id, title: 'Tu pedido', message: 'Recibimos tu pedido.', type: 'order',
  severity: 'info', createdAt: '2026-10-20T12:00:00.000Z', readAt: null, ...changes });
const inbox = (items = [notice()], unread = 1) => ({ items, unread });
function session(initial = authenticated()) {
  let state = initial; const listeners = new Set();
  return { getSnapshot: () => state, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async restore() {}, async signIn() { return state.user; }, async signOut() {},
    publish(next) { state = next; this.notify(); }, silent(next) { state = next; }, notify() { [...listeners].forEach((listener) => listener()); },
    listenerCount: () => listeners.size };
}
function setup(overrides = {}, auth = session()) {
  const actions = { list: async () => inbox(), markRead: async (id) => notice(id, { readAt }), ...overrides };
  return { auth, actions, controller: createNoticesController(auth, actions) };
}

test('notices wait for verified auth and never fabricate empty while checking, anonymous or recovering', async () => {
  let reads = 0, writes = 0; const auth = session({ status: 'checking', user: null, message: null });
  const { controller } = setup({ list: async () => { reads++; return inbox([], 0); }, markRead: async () => { writes++; } }, auth);
  controller.start(); await controller.refresh(); controller.selectNotice(A); await controller.markSelectedRead();
  assert.equal(controller.getSnapshot().status, 'checking'); assert.equal(controller.getSnapshot().items, null);
  auth.publish({ status: 'recovery-error', user: null, message: 'Reintenta tu sesión.' });
  assert.equal(controller.getSnapshot().status, 'recovery-error'); assert.equal(controller.getSnapshot().error, 'Reintenta tu sesión.');
  auth.publish({ status: 'anonymous', user: null, message: null }); await controller.refresh();
  assert.equal(reads, 0); assert.equal(writes, 0); auth.publish(authenticated()); await tick();
  assert.equal(reads, 1); assert.deepEqual(controller.getSnapshot().items, []); assert.equal(controller.getSnapshot().unread, 0); controller.stop();
});

test('start is idempotent and blocks duplicate initial refresh while forwarding abort signal', async () => {
  const response = deferred(); let reads = 0, signal;
  const { controller, auth } = setup({ list: async (options) => { reads++; signal = options.signal; return response.promise; } });
  await controller.refresh(); assert.equal(reads, 0); controller.start(); controller.start(); await controller.refresh();
  assert.equal(reads, 1); assert.equal(auth.listenerCount(), 1); assert.ok(signal instanceof AbortSignal);
  assert.equal(controller.getSnapshot().status, 'loading'); assert.equal(controller.getSnapshot().items, null);
  response.resolve(inbox()); await tick(); assert.equal(controller.getSnapshot().status, 'ready'); controller.stop();
});

test('global unread count is preserved independently from the twelve-or-fewer loaded notices', async () => {
  const { controller } = setup({ list: async () => inbox([notice(), notice(B, { readAt })], 42) });
  controller.start(); await tick(); assert.equal(controller.getSnapshot().unread, 42); assert.equal(controller.getSnapshot().items.length, 2);
  controller.stop();
});

test('opening and closing a loaded notice is local and never marks it read or requests detail', async () => {
  let reads = 0, writes = 0;
  const { controller } = setup({ list: async () => { reads++; return inbox(); }, markRead: async () => { writes++; } });
  controller.start(); await tick(); controller.selectNotice(B); assert.equal(controller.getSnapshot().selectedNoticeId, null);
  controller.selectNotice(A); assert.equal(controller.getSnapshot().selectedNoticeId, A);
  assert.equal(controller.getSnapshot().items[0].readAt, null); controller.selectNotice(null);
  assert.equal(controller.getSnapshot().selectedNoticeId, null); assert.equal(reads, 1); assert.equal(writes, 0); controller.stop();
});

test('initial list failure stays distinct from empty and explicit retry can confirm an empty inbox', async () => {
  let reads = 0; const { controller } = setup({ list: async () => {
    if (++reads === 1) throw new NoticesError('Sin conexión.', 'network'); return inbox([], 0);
  } }); controller.start(); await tick(); assert.equal(controller.getSnapshot().status, 'error'); assert.equal(controller.getSnapshot().items, null);
  await controller.refresh(); assert.equal(controller.getSnapshot().status, 'ready'); assert.deepEqual(controller.getSnapshot().items, []);
  assert.equal(controller.getSnapshot().error, null); controller.stop();
});

test('refresh failure preserves confirmed list, global count and selected notice for an explicit retry', async () => {
  let reads = 0; const { controller } = setup({ list: async () => {
    if (++reads === 2) throw new NoticesError('Sin conexión.', 'network'); return inbox();
  } }); controller.start(); await tick(); controller.selectNotice(A); const before = controller.getSnapshot(); await controller.refresh();
  const failed = controller.getSnapshot(); assert.equal(failed.items, before.items); assert.equal(failed.unread, before.unread);
  assert.equal(failed.selectedNoticeId, A); assert.equal(failed.status, 'ready'); assert.equal(failed.error, 'Sin conexión.');
  await controller.refresh(); assert.equal(controller.getSnapshot().error, null); assert.equal(controller.getSnapshot().selectedNoticeId, A); controller.stop();
});

test('successful refresh replaces old data, preserves loaded selection and clears a selection no longer present', async () => {
  let reads = 0; const { controller } = setup({ list: async () => ++reads < 3 ? inbox() : inbox([], 0) });
  controller.start(); await tick(); controller.selectNotice(A); await controller.refresh(); assert.equal(controller.getSnapshot().selectedNoticeId, A);
  await controller.refresh(); assert.deepEqual(controller.getSnapshot().items, []); assert.equal(controller.getSnapshot().selectedNoticeId, null); controller.stop();
});

test('notice snapshots are sorted newest first and projected into deeply frozen allowed fields', async () => {
  const source = [notice(A, { token: 'hidden' }), notice(B, { createdAt: null }), notice(C)];
  const { controller } = setup({ list: async () => inbox(source, 9) }); controller.start(); await tick();
  const result = controller.getSnapshot().items; assert.deepEqual(result.map((item) => item.id), [C, A, B]);
  assert.ok(Object.isFrozen(result)); assert.ok(result.every(Object.isFrozen)); assert.equal(result[1].token, undefined);
  source[0].message = 'Changed'; assert.notEqual(result[1].message, 'Changed'); controller.stop();
});

test('explicit mark confirms its item before GET reconciliation and never decrements global count blindly', async () => {
  const patch = deferred(), reconciliation = deferred(); let reads = 0, writes = 0, writeSignal, reconcileSignal;
  const { controller } = setup({ list: async (options) => { reads++; if (reads === 1) return inbox([notice(), notice(B)], 42);
    reconcileSignal = options.signal; return reconciliation.promise; },
  markRead: async (id, options) => { writes++; writeSignal = options.signal; assert.equal(id, A); return patch.promise; } });
  controller.start(); await tick(); controller.selectNotice(A); const marking = controller.markSelectedRead();
  assert.equal(controller.getSnapshot().items.find((item) => item.id === A).readAt, null);
  assert.equal(controller.getSnapshot().unread, 42); assert.equal(controller.getSnapshot().markingReadId, A);
  await controller.markSelectedRead(); await controller.refresh(); assert.equal(writes, 1); assert.equal(reads, 1);
  patch.resolve(notice(A, { readAt })); await tick(); const confirmed = controller.getSnapshot();
  assert.equal(confirmed.items.find((item) => item.id === A).readAt, readAt); assert.equal(confirmed.unread, null);
  assert.equal(confirmed.selectedNoticeId, A); assert.equal(confirmed.refreshing, true); assert.equal(writeSignal, reconcileSignal);
  await controller.refresh(); await controller.markSelectedRead(); assert.equal(writes, 1); assert.equal(reads, 2);
  reconciliation.resolve(inbox([notice(A, { readAt }), notice(B)], 43)); await marking;
  assert.equal(controller.getSnapshot().unread, 43); assert.equal(controller.getSnapshot().markingReadId, null);
  assert.equal(controller.getSnapshot().refreshing, false); assert.equal(controller.getSnapshot().selectedNoticeId, A); controller.stop();
});

test('a confirmed PATCH with failed GET retains the read notice and retries only GET, never PATCH', async () => {
  let reads = 0, writes = 0;
  const { controller } = setup({ list: async () => { reads++; if (reads === 2) throw new NoticesError('Sin conexión.', 'network');
    return inbox([notice(A, reads > 2 ? { readAt } : {})], reads > 2 ? 7 : 8); },
  markRead: async () => { writes++; return notice(A, { readAt }); } });
  controller.start(); await tick(); controller.selectNotice(A); await controller.markSelectedRead(); const failed = controller.getSnapshot();
  assert.equal(failed.status, 'ready'); assert.equal(failed.items[0].readAt, readAt); assert.equal(failed.unread, null);
  assert.equal(failed.selectedNoticeId, A); assert.equal(failed.readError, null); assert.match(failed.error, /se marcó como leído/);
  await controller.markSelectedRead(); assert.equal(writes, 1); await controller.refresh();
  assert.equal(reads, 3); assert.equal(writes, 1); assert.equal(controller.getSnapshot().unread, 7); assert.equal(controller.getSnapshot().error, null); controller.stop();
});

test('failed PATCH preserves unread item, selected detail and global count until explicit retry', async () => {
  let writes = 0, reads = 0;
  const { controller } = setup({ list: async () => { reads++; return inbox([notice(A, writes > 1 ? { readAt } : {})], writes > 1 ? 0 : 1); },
    markRead: async () => { if (++writes === 1) throw new NoticesError('Sin conexión.', 'network'); return notice(A, { readAt }); } });
  controller.start(); await tick(); controller.selectNotice(A); const before = controller.getSnapshot(); await controller.markSelectedRead();
  const failed = controller.getSnapshot(); assert.equal(failed.items, before.items); assert.equal(failed.unread, 1);
  assert.equal(failed.selectedNoticeId, A); assert.equal(failed.readError, 'Sin conexión.'); assert.equal(failed.error, null);
  assert.equal(reads, 1); assert.equal(writes, 1); await controller.markSelectedRead();
  assert.equal(writes, 2); assert.equal(reads, 2); assert.equal(controller.getSnapshot().items[0].readAt, readAt);
  assert.equal(controller.getSnapshot().readError, null); controller.stop();
});

test('already read notices, missing selection and invalid selection never trigger PATCH', async () => {
  let writes = 0; const { controller } = setup({ list: async () => inbox([notice(A, { readAt })], 0), markRead: async () => { writes++; } });
  controller.start(); await tick(); await controller.markSelectedRead(); controller.selectNotice('invalid'); await controller.markSelectedRead();
  controller.selectNotice(A); await controller.markSelectedRead(); assert.equal(writes, 0); controller.stop();
});

test('wrong ID or unconfirmed read response is rejected without changing local read state or issuing GET', async () => {
  for (const response of [notice(B, { readAt }), notice(), notice(A, { readAt: undefined })]) {
    let reads = 0; const { controller } = setup({ list: async () => { reads++; return inbox(); }, markRead: async () => response });
    controller.start(); await tick(); controller.selectNotice(A); await controller.markSelectedRead();
    assert.equal(controller.getSnapshot().items[0].readAt, null); assert.equal(controller.getSnapshot().unread, 1);
    assert.match(controller.getSnapshot().readError, /confirmar el estado/); assert.equal(reads, 1); controller.stop();
  }
});

test('local selection can close or change during a mark without sending errors to the wrong detail', async () => {
  const response = deferred(); const { controller } = setup({ list: async () => inbox([notice(), notice(B)], 2), markRead: async () => response.promise });
  controller.start(); await tick(); controller.selectNotice(A); const marking = controller.markSelectedRead();
  controller.selectNotice(null); controller.selectNotice(B); response.reject(new NoticesError('Error del aviso anterior.', 'network')); await marking;
  assert.equal(controller.getSnapshot().selectedNoticeId, B); assert.equal(controller.getSnapshot().readError, null); controller.stop();
});

test('refresh blocks a concurrent explicit mark and duplicate list requests', async () => {
  const response = deferred(); let reads = 0, writes = 0;
  const { controller } = setup({ list: async () => ++reads === 1 ? inbox() : response.promise, markRead: async () => { writes++; } });
  controller.start(); await tick(); controller.selectNotice(A); const refreshing = controller.refresh();
  await controller.refresh(); await controller.markSelectedRead(); assert.equal(reads, 2); assert.equal(writes, 0);
  response.resolve(inbox()); await refreshing; controller.stop();
});

test('logout aborts pending PATCH, hides all data and ignores obsolete write results', async () => {
  const response = deferred(); let signal, reads = 0;
  const { controller, auth } = setup({ list: async () => { reads++; return inbox(); }, markRead: async (id, options) => { signal = options.signal; return response.promise; } });
  controller.start(); await tick(); controller.selectNotice(A); const marking = controller.markSelectedRead();
  auth.publish({ status: 'anonymous', user: null, message: null }); assert.equal(signal.aborted, true);
  assert.equal(controller.getSnapshot().items, null); assert.equal(controller.getSnapshot().selectedNoticeId, null);
  response.resolve(notice(A, { readAt })); await marking; assert.equal(reads, 1); assert.equal(controller.getSnapshot().status, 'anonymous'); controller.stop();
});

test('switching accounts aborts reconciliation and late data cannot revive the old inbox', async () => {
  const old = deferred(), next = deferred(); let reads = 0, oldSignal;
  const { controller, auth } = setup({ list: async (options) => {
    if (++reads === 1) return inbox(); if (reads === 2) { oldSignal = options.signal; return old.promise; } return next.promise;
  } }); controller.start(); await tick(); controller.selectNotice(A); const marking = controller.markSelectedRead(); await tick();
  auth.publish(authenticated(OTHER)); assert.equal(oldSignal.aborted, true); assert.equal(controller.getSnapshot().items, null);
  old.resolve(inbox([notice(A, { readAt })], 0)); await marking; assert.equal(controller.getSnapshot().items, null);
  next.resolve(inbox([notice(B)], 9)); await tick(); assert.equal(controller.getSnapshot().items[0].id, B);
  assert.equal(controller.getSnapshot().unread, 9); assert.equal(controller.getSnapshot().selectedNoticeId, null); controller.stop();
});

test('same-account reauthorization discards data from the previous authorization object', async () => {
  const old = deferred(), next = deferred(); let reads = 0;
  const { controller, auth } = setup({ list: async () => ++reads === 1 ? old.promise : next.promise });
  controller.start(); auth.publish(authenticated(USER)); old.resolve(inbox([notice(A)])); await tick();
  assert.equal(controller.getSnapshot().items, null); next.resolve(inbox([notice(B)])); await tick();
  assert.equal(controller.getSnapshot().items[0].id, B); controller.stop();
});

test('getSnapshot hides previous personal inbox before delayed auth notifications and stays reference stable', async () => {
  const { controller, auth } = setup(); controller.start(); await tick(); controller.selectNotice(A);
  auth.silent(authenticated(OTHER)); const hidden = controller.getSnapshot();
  assert.equal(hidden.items, null); assert.equal(hidden.unread, null); assert.equal(hidden.selectedNoticeId, null);
  assert.equal(controller.getSnapshot(), hidden); auth.notify(); await tick(); assert.equal(controller.getSnapshot().items.length, 1); controller.stop();
});

test('late responses cannot publish after silent auth change even before its notification arrives', async () => {
  const response = deferred(); const { controller, auth } = setup({ list: async () => response.promise }); controller.start();
  auth.silent({ status: 'anonymous', user: null, message: null }); response.resolve(inbox()); await tick();
  assert.equal(controller.getSnapshot().items, null); assert.equal(controller.getSnapshot().status, 'anonymous'); auth.notify(); controller.stop();
});

test('list 401 expires the module and blocks retries until a new authorization identity', async () => {
  let reads = 0, reject = false;
  const { controller, auth } = setup({ list: async () => { reads++; if (reject) throw new NoticesError('Sesión rechazada.', 'unauthorized'); return inbox(); } });
  controller.start(); await tick(); reject = true; const authBefore = auth.getSnapshot(); await controller.refresh();
  assert.equal(controller.getSnapshot().status, 'session-expired'); assert.equal(controller.getSnapshot().items, null);
  assert.equal(auth.getSnapshot(), authBefore); await controller.refresh(); await controller.markSelectedRead(); assert.equal(reads, 2);
  controller.stop(); controller.start(); await tick(); assert.equal(reads, 2);
  reject = false; auth.publish(authenticated(USER)); await tick(); assert.equal(reads, 3); assert.equal(controller.getSnapshot().status, 'ready'); controller.stop();
});

test('401 in PATCH or reconciliation purges list, detail, count and pending state', async () => {
  for (const failAt of ['patch', 'get']) {
    let reads = 0; const { controller, auth } = setup({ list: async () => {
      if (++reads > 1) throw new NoticesError('Sesión rechazada.', 'unauthorized'); return inbox();
    }, markRead: async () => { if (failAt === 'patch') throw new NoticesError('Sesión rechazada.', 'unauthorized'); return notice(A, { readAt }); } });
    controller.start(); await tick(); controller.selectNotice(A); const authBefore = auth.getSnapshot(); await controller.markSelectedRead();
    const state = controller.getSnapshot(); assert.equal(state.status, 'session-expired'); assert.equal(state.items, null); assert.equal(state.unread, null);
    assert.equal(state.selectedNoticeId, null); assert.equal(state.markingReadId, null); assert.equal(auth.getSnapshot(), authBefore); controller.stop();
  }
});

test('403 in list, PATCH or reconciliation withdraws confirmed data without changing global auth', async () => {
  for (const failAt of ['list', 'patch', 'get']) {
    let reads = 0; const { controller, auth } = setup({ list: async () => {
      if (++reads > 1) throw new NoticesError('Acceso rechazado.', 'forbidden'); return inbox();
    }, markRead: async () => { if (failAt === 'patch') throw new NoticesError('Acceso rechazado.', 'forbidden'); return notice(A, { readAt }); } });
    controller.start(); await tick(); controller.selectNotice(A); const authBefore = auth.getSnapshot();
    if (failAt === 'list') await controller.refresh(); else await controller.markSelectedRead();
    const state = controller.getSnapshot(); assert.equal(state.status, 'error'); assert.equal(state.items, null); assert.equal(state.unread, null);
    assert.equal(state.selectedNoticeId, null); assert.equal(state.markingReadId, null); assert.equal(auth.getSnapshot(), authBefore); controller.stop();
  }
});

test('unexpected dependency failures never reveal raw transport details or turn a failed mark into an optimistic change', async () => {
  const { controller } = setup({ markRead: async () => { throw new Error('SECRET access token'); } });
  controller.start(); await tick(); controller.selectNotice(A); await controller.markSelectedRead();
  assert.doesNotMatch(controller.getSnapshot().readError, /SECRET|access token/); assert.equal(controller.getSnapshot().items[0].readAt, null); controller.stop();
});

test('stop aborts work and restart fetches fresh data without publishing old account results', async () => {
  const response = deferred(); let reads = 0, signal;
  const { controller } = setup({ list: async (options) => { if (++reads === 1) { signal = options.signal; return response.promise; } return inbox([notice(B)]); } });
  controller.start(); controller.stop(); assert.equal(signal.aborted, true); response.resolve(inbox()); await tick();
  assert.equal(controller.getSnapshot().items, null); controller.start(); await tick(); assert.equal(controller.getSnapshot().items[0].id, B); controller.stop();
});

test('observer failures cannot corrupt data and reentrant logout prevents an unauthorized PATCH', async () => {
  let writes = 0; const { controller, auth } = setup({ markRead: async () => { writes++; return notice(A, { readAt }); } });
  controller.subscribe(() => { throw new Error('Observer failed'); }); controller.start(); await tick(); assert.equal(controller.getSnapshot().status, 'ready');
  controller.selectNotice(A); controller.subscribe(() => {
    if (controller.getSnapshot().markingReadId) auth.publish({ status: 'anonymous', user: null, message: null });
  }); await controller.markSelectedRead(); assert.equal(writes, 0); assert.equal(controller.getSnapshot().items, null); controller.stop();
});

test('reentrant account change while publishing a list cannot erase the new account pending request', async () => {
  const next = deferred(); let reads = 0, switched = false;
  const { controller, auth } = setup({ list: async () => ++reads === 1 ? inbox([notice(A)]) : next.promise });
  controller.subscribe(() => {
    if (!switched && controller.getSnapshot().status === 'ready') {
      switched = true; auth.publish(authenticated(OTHER));
    }
  });
  controller.start(); await tick(); assert.equal(reads, 2); assert.equal(controller.getSnapshot().status, 'loading');
  assert.equal(controller.getSnapshot().items, null); next.resolve(inbox([notice(B)], 7)); await tick();
  assert.equal(controller.getSnapshot().status, 'ready'); assert.equal(controller.getSnapshot().items[0].id, B);
  assert.equal(controller.getSnapshot().unread, 7); controller.stop();
});

test('reentrant account change while publishing reconciliation cannot leave the new account loading forever', async () => {
  const next = deferred(); let reads = 0, switched = false;
  const { controller, auth } = setup({ list: async () => {
    reads++; return reads === 1 ? inbox([notice(A)], 1) : reads === 2 ? inbox([notice(A, { readAt })], 0) : next.promise;
  } });
  controller.subscribe(() => {
    const state = controller.getSnapshot();
    if (!switched && state.status === 'ready' && state.unread === 0 && state.items?.[0].readAt) {
      switched = true; auth.publish(authenticated(OTHER));
    }
  });
  controller.start(); await tick(); controller.selectNotice(A); await controller.markSelectedRead();
  assert.equal(reads, 3); assert.equal(controller.getSnapshot().status, 'loading'); assert.equal(controller.getSnapshot().items, null);
  next.resolve(inbox([notice(B)], 9)); await tick(); assert.equal(controller.getSnapshot().status, 'ready');
  assert.equal(controller.getSnapshot().items[0].id, B); assert.equal(controller.getSnapshot().unread, 9);
  assert.equal(controller.getSnapshot().selectedNoticeId, null); controller.stop();
});

test('an explicit refresh started by a publication observer retains its own pending identity', async () => {
  const response = deferred(); let reads = 0, requested = false;
  const { controller } = setup({ list: async () => ++reads === 1 ? inbox([notice(A)], 1) : response.promise });
  controller.subscribe(() => {
    if (!requested && controller.getSnapshot().status === 'ready') {
      requested = true; void controller.refresh();
    }
  });
  controller.start(); await tick(); assert.equal(reads, 2); assert.equal(controller.getSnapshot().refreshing, true);
  response.resolve(inbox([notice(B)], 4)); await tick(); assert.equal(controller.getSnapshot().refreshing, false);
  assert.equal(controller.getSnapshot().items[0].id, B); assert.equal(controller.getSnapshot().unread, 4); controller.stop();
});
