const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createReviewsController } = require('../src/features/reviews/presentation/state/createReviewsController.ts');
const { ReviewsError } = require('../src/features/reviews/domain/errors/ReviewsError.ts');

const A = '000000000000000000000001', B = '000000000000000000000002';
const ORDER = '000000000000000000000003', USER = '111111111111111111111111';
const tick = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };
const authenticated = (id = USER) => ({ status: 'authenticated', user: { id, firstName: 'Ana', lastName: 'López', email: 'ana@example.test', phone: '5512345678' }, message: null });
const review = (changes = {}) => ({ id: B, userName: 'Ana', productId: A, productName: 'Lavanda', productSlug: 'lavanda',
  productImage: null, orderId: ORDER, orderReference: 'INH-PRUEBA', rating: 5, comment: 'Muy buen aroma.', status: 'published',
  createdAt: '2026-11-04T12:00:00.000Z', ...changes });
const product = (id = A, changes = {}) => ({ orderId: ORDER, orderReference: 'INH-PRUEBA', productId: id, productName: 'Lavanda',
  productSlug: 'lavanda', productImage: null, presentation: 'Natural', purchasedAt: '2026-11-04T12:00:00.000Z', review: null, ...changes });
const collection = (pending = [product()], completed = []) => ({ pending, completed });
function session(initial = authenticated()) {
  let state = initial; const listeners = new Set();
  return { getSnapshot: () => state, subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    async restore() {}, async signIn() { return state.user; }, async signOut() {},
    publish(next) { state = next; this.notify(); }, silent(next) { state = next; }, notify() { [...listeners].forEach((listener) => listener()); },
    listenerCount: () => listeners.size };
}
function setup(overrides = {}, auth = session()) {
  const actions = { list: async () => collection(), publish: async (input) => review(input), ...overrides };
  return { auth, actions, controller: createReviewsController(auth, actions) };
}
function fill(controller) { controller.selectProduct(A); controller.setRating(5); controller.setComment('  Muy buen aroma.  '); }

test('reviews wait for verified auth and distinguish checking, recovery, anonymous and confirmed empty', async () => {
  let reads = 0, writes = 0;
  const auth = session({ status: 'checking', user: null, message: null });
  const { controller } = setup({ list: async () => { reads++; return collection([], []); }, publish: async () => { writes++; } }, auth);
  controller.start(); await controller.refresh(); fill(controller); await controller.publishReview();
  assert.equal(controller.getSnapshot().status, 'checking'); assert.equal(controller.getSnapshot().collection, null);
  auth.publish({ status: 'recovery-error', user: null, message: 'Reintenta tu sesión.' });
  assert.equal(controller.getSnapshot().status, 'recovery-error'); assert.equal(controller.getSnapshot().error, 'Reintenta tu sesión.');
  auth.publish({ status: 'anonymous', user: null, message: null }); await controller.refresh();
  assert.equal(reads, 0); assert.equal(writes, 0);
  auth.publish(authenticated()); await tick(); assert.equal(reads, 1);
  assert.deepEqual(controller.getSnapshot().collection, collection([], [])); controller.stop();
});

test('start is idempotent and concurrent refreshes share one in-flight GET with abort signal', async () => {
  const response = deferred(); let reads = 0, signal;
  const { controller, auth } = setup({ list: async (options) => { reads++; signal = options.signal; return response.promise; } });
  await controller.refresh(); controller.start(); controller.start(); await controller.refresh();
  assert.equal(reads, 1); assert.equal(auth.listenerCount(), 1); assert.ok(signal instanceof AbortSignal);
  assert.equal(controller.getSnapshot().status, 'loading');
  response.resolve(collection()); await tick(); assert.equal(controller.getSnapshot().status, 'ready'); controller.stop();
});

test('initial failure does not fabricate empty; a successful explicit refresh can confirm empty', async () => {
  let reads = 0; const { controller } = setup({ list: async () => {
    if (++reads === 1) throw new ReviewsError('Sin conexión.', 'network'); return collection([], []);
  } }); controller.start(); await tick(); assert.equal(controller.getSnapshot().status, 'error');
  assert.equal(controller.getSnapshot().collection, null); await controller.refresh();
  assert.equal(controller.getSnapshot().status, 'ready'); assert.equal(controller.getSnapshot().requiresRefresh, false);
  assert.deepEqual(controller.getSnapshot().collection, collection([], [])); controller.stop();
});

test('only eligible pending products can be selected; selection and draft edits never write', async () => {
  let writes = 0;
  const { controller } = setup({ list: async () => collection([product()], [product(B, { review: review({ productId: B }) })]),
    publish: async () => { writes++; } });
  controller.start(); await tick(); controller.selectProduct(B); assert.equal(controller.getSnapshot().selectedProductId, null);
  fill(controller); assert.equal(controller.getSnapshot().selectedProductId, A); assert.equal(controller.getSnapshot().rating, 5);
  controller.setRating(6); controller.setRating(1.5); assert.equal(controller.getSnapshot().rating, 5);
  controller.setComment('a'.repeat(701)); assert.equal(controller.getSnapshot().comment.length, 700);
  controller.selectProduct(null); assert.equal(controller.getSnapshot().comment, ''); assert.equal(controller.getSnapshot().rating, 0);
  assert.equal(writes, 0); controller.stop();
});

test('invalid rating and blank or short trimmed comment fail locally without a POST', async () => {
  let writes = 0; const { controller } = setup({ publish: async () => { writes++; } });
  controller.start(); await tick(); controller.selectProduct(A); await controller.publishReview();
  assert.ok(controller.getSnapshot().fieldErrors.rating); assert.ok(controller.getSnapshot().fieldErrors.comment);
  controller.setRating(5); controller.setComment('   a   '); await controller.publishReview();
  assert.ok(controller.getSnapshot().fieldErrors.comment); assert.equal(writes, 0);
  assert.equal(controller.getSnapshot().requiresRefresh, false); controller.stop();
});

test('a confirmed publication sends normalized input once and moves the selected item to completed', async () => {
  let sent, writes = 0;
  const { controller } = setup({ publish: async (input, options) => { writes++; sent = input;
    assert.ok(options.signal instanceof AbortSignal); return review(input); } });
  controller.start(); await tick(); fill(controller); await controller.publishReview(); const result = controller.getSnapshot();
  assert.deepEqual(sent, { productId: A, orderId: ORDER, rating: 5, comment: 'Muy buen aroma.' });
  assert.equal(result.collection.pending.length, 0); assert.equal(result.collection.completed[0].review.comment, 'Muy buen aroma.');
  assert.match(result.notice, /se publicó correctamente/); assert.equal(result.selectedProductId, null);
  assert.equal(result.rating, 0); assert.equal(result.comment, ''); await controller.publishReview(); assert.equal(writes, 1); controller.stop();
});

test('double tap, refresh and draft changes are blocked while the POST is pending', async () => {
  const response = deferred(); let writes = 0, reads = 0;
  const { controller } = setup({ list: async () => { reads++; return collection([product(), product(B)]); },
    publish: async () => { writes++; return response.promise; } });
  controller.start(); await tick(); fill(controller); const sending = controller.publishReview();
  await controller.publishReview(); await controller.refresh(); controller.selectProduct(B); controller.setRating(1); controller.setComment('Cambio');
  assert.equal(controller.getSnapshot().publishing, true); assert.equal(controller.getSnapshot().selectedProductId, A);
  assert.equal(controller.getSnapshot().rating, 5); assert.equal(controller.getSnapshot().comment, '  Muy buen aroma.  ');
  assert.equal(writes, 1); assert.equal(reads, 1); response.resolve(review()); await sending; controller.stop();
});

test('refresh failure retains the collection and draft and blocks publication until recovery', async () => {
  let reads = 0, writes = 0;
  const { controller } = setup({ list: async () => { if (++reads === 2) throw new ReviewsError('Sin conexión.', 'network'); return collection(); },
    publish: async () => { writes++; return review(); } });
  controller.start(); await tick(); fill(controller); const before = controller.getSnapshot(); await controller.refresh();
  const failed = controller.getSnapshot(); assert.equal(failed.collection, before.collection);
  assert.equal(failed.comment, before.comment); assert.equal(failed.rating, 5); assert.equal(failed.selectedProductId, A);
  assert.equal(failed.requiresRefresh, true); await controller.publishReview(); assert.equal(writes, 0);
  await controller.refresh(); assert.equal(controller.getSnapshot().requiresRefresh, false);
  assert.equal(controller.getSnapshot().comment, before.comment); assert.equal(controller.getSnapshot().error, null); controller.stop();
});

test('successful refresh keeps an eligible draft and removes it when eligibility disappears', async () => {
  let reads = 0; const { controller } = setup({ list: async () => ++reads < 3 ? collection() : collection([], []) });
  controller.start(); await tick(); fill(controller); await controller.refresh(); assert.equal(controller.getSnapshot().rating, 5);
  await controller.refresh(); assert.equal(controller.getSnapshot().selectedProductId, null);
  assert.equal(controller.getSnapshot().comment, ''); assert.equal(controller.getSnapshot().rating, 0); controller.stop();
});

test('failed POST preserves draft and requires GET reconciliation before another explicit POST', async () => {
  let writes = 0, reads = 0;
  const { controller } = setup({ list: async () => { reads++; return collection(); }, publish: async () => {
    if (++writes === 1) throw new ReviewsError('Sin conexión.', 'network'); return review();
  } }); controller.start(); await tick(); fill(controller); await controller.publishReview();
  const failed = controller.getSnapshot(); assert.equal(failed.publishing, false); assert.equal(failed.requiresRefresh, true);
  assert.equal(failed.comment, '  Muy buen aroma.  '); assert.equal(failed.rating, 5); assert.equal(failed.collection.pending.length, 1);
  assert.equal(failed.notice, null); await controller.publishReview(); assert.equal(writes, 1); assert.equal(reads, 1);
  await controller.refresh(); assert.equal(reads, 2); assert.equal(writes, 1); assert.equal(controller.getSnapshot().requiresRefresh, false);
  await controller.publishReview(); assert.equal(writes, 2); assert.match(controller.getSnapshot().notice, /se publicó/); controller.stop();
});

test('lost POST response is recovered by GET without creating a second review or claiming a new publication', async () => {
  let writes = 0;
  const { controller } = setup({ list: async () => writes ? collection([], [product(A, { review: review() })]) : collection(),
    publish: async () => { writes++; throw new ReviewsError('Tiempo agotado.', 'timeout'); } });
  controller.start(); await tick(); fill(controller); await controller.publishReview(); await controller.refresh();
  const recovered = controller.getSnapshot(); assert.equal(writes, 1); assert.equal(recovered.notice, 'Esta reseña ya está registrada.');
  assert.equal(recovered.collection.pending.length, 0); assert.equal(recovered.selectedProductId, null);
  assert.equal(recovered.comment, ''); await controller.publishReview(); assert.equal(writes, 1); controller.stop();
});

test('a failed reconciliation preserves the draft and uncertainty lock through repeated retries', async () => {
  let reads = 0, writes = 0;
  const { controller } = setup({ list: async () => { if (++reads > 1) throw new ReviewsError('Sin conexión.', 'network'); return collection(); },
    publish: async () => { writes++; throw new ReviewsError('Tiempo agotado.', 'timeout'); } });
  controller.start(); await tick(); fill(controller); await controller.publishReview(); await controller.refresh(); await controller.refresh();
  await controller.publishReview(); assert.equal(writes, 1); assert.equal(reads, 3);
  assert.equal(controller.getSnapshot().requiresRefresh, true); assert.equal(controller.getSnapshot().rating, 5); controller.stop();
});

test('explicit back after a failed POST discards the draft while preserving the reconciliation lock', async () => {
  let writes = 0;
  const { controller } = setup({ list: async () => writes ? collection([product(B)], [product(A, { review: review() })]) : collection([product(), product(B)]),
    publish: async () => { writes++; throw new ReviewsError('Tiempo agotado.', 'timeout'); } });
  controller.start(); await tick(); fill(controller); await controller.publishReview(); controller.selectProduct(null);
  assert.equal(controller.getSnapshot().selectedProductId, null); assert.equal(controller.getSnapshot().comment, '');
  assert.equal(controller.getSnapshot().requiresRefresh, true); controller.selectProduct(B);
  assert.equal(controller.getSnapshot().selectedProductId, null); await controller.publishReview(); assert.equal(writes, 1);
  await controller.refresh(); assert.equal(controller.getSnapshot().notice, 'Esta reseña ya está registrada.');
  assert.equal(controller.getSnapshot().requiresRefresh, false); controller.selectProduct(B);
  assert.equal(controller.getSnapshot().selectedProductId, B); controller.stop();
});

test('explicit back after a failed GET discards the draft without bypassing the required refresh', async () => {
  let reads = 0;
  const { controller } = setup({ list: async () => { if (++reads === 2) throw new ReviewsError('Sin conexión.', 'network'); return collection(); } });
  controller.start(); await tick(); fill(controller); await controller.refresh(); controller.selectProduct(null);
  assert.equal(controller.getSnapshot().selectedProductId, null); assert.equal(controller.getSnapshot().rating, 0);
  assert.equal(controller.getSnapshot().requiresRefresh, true); controller.selectProduct(A);
  assert.equal(controller.getSnapshot().selectedProductId, null); await controller.refresh(); controller.selectProduct(A);
  assert.equal(controller.getSnapshot().selectedProductId, A); controller.stop();
});

test('409 reconciles an existing hidden review without calling it newly published', async () => {
  let reads = 0, writes = 0;
  const { controller } = setup({ list: async () => ++reads === 1 ? collection() : collection([], [product(A, { review: review({ status: 'hidden' }) })]),
    publish: async () => { writes++; throw new ReviewsError('Ya calificaste este producto.', 'conflict'); } });
  controller.start(); await tick(); fill(controller); await controller.publishReview();
  assert.equal(reads, 2); assert.equal(writes, 1); assert.equal(controller.getSnapshot().collection.completed[0].review.status, 'hidden');
  assert.equal(controller.getSnapshot().notice, 'Esta reseña ya está registrada.'); controller.stop();
});

test('409 with a failed GET remains an error with retained draft and does not report success', async () => {
  let reads = 0; const { controller } = setup({ list: async () => { if (++reads > 1) throw new ReviewsError('Sin conexión.', 'network'); return collection(); },
    publish: async () => { throw new ReviewsError('Ya calificaste este producto.', 'conflict'); } });
  controller.start(); await tick(); fill(controller); await controller.publishReview();
  assert.equal(controller.getSnapshot().notice, null); assert.equal(controller.getSnapshot().requiresRefresh, true);
  assert.equal(controller.getSnapshot().comment, '  Muy buen aroma.  '); assert.match(controller.getSnapshot().publishError, /Ya calificaste/); controller.stop();
});

test('mismatched POST result is treated as uncertain and cannot overwrite the selected product', async () => {
  for (const changes of [{ productId: B }, { orderId: B }]) {
    const { controller } = setup({ publish: async () => review(changes) }); controller.start(); await tick(); fill(controller); await controller.publishReview();
    assert.equal(controller.getSnapshot().collection.completed.length, 0); assert.equal(controller.getSnapshot().requiresRefresh, true);
    assert.equal(controller.getSnapshot().selectedProductId, A); assert.equal(controller.getSnapshot().notice, null); controller.stop();
  }
});

test('a stale GET never reoffers an acknowledged review and a later hidden status is respected', async () => {
  let reads = 0; const { controller } = setup({ list: async () => ++reads < 3 ? collection() : collection([], [product(A, { review: review({ status: 'hidden' }) })]) });
  controller.start(); await tick(); fill(controller); await controller.publishReview(); await controller.refresh();
  assert.equal(controller.getSnapshot().collection.pending.length, 0); assert.equal(controller.getSnapshot().collection.completed.length, 1);
  await controller.refresh(); assert.equal(controller.getSnapshot().collection.completed[0].review.status, 'hidden'); controller.stop();
});

test('collection snapshots whitelist and freeze nested fields, prefer completed duplicates and preserve older purchase review', async () => {
  const source = product(A, { secret: 'private', review: review({ token: 'private', orderId: B }) });
  const { controller } = setup({ list: async () => collection([product(), product(B), product(B)], [source]) });
  controller.start(); await tick(); const result = controller.getSnapshot().collection;
  assert.equal(result.pending.length, 1); assert.equal(result.completed.length, 1);
  assert.equal(result.completed[0].review.orderId, B); assert.equal(result.completed[0].secret, undefined);
  assert.equal(result.completed[0].review.token, undefined); assert.ok(Object.isFrozen(result));
  assert.ok(Object.isFrozen(result.completed)); assert.ok(Object.isFrozen(result.completed[0])); assert.ok(Object.isFrozen(result.completed[0].review));
  source.productName = 'Changed'; source.review.comment = 'Changed'; assert.notEqual(result.completed[0].productName, 'Changed');
  assert.notEqual(result.completed[0].review.comment, 'Changed'); controller.stop();
});

test('401 from GET or POST immediately clears private state and blocks further requests for that session', async () => {
  for (const operation of ['read', 'write']) {
    let reads = 0, writes = 0; const { controller } = setup({ list: async () => {
      reads++; if (operation === 'read' && reads > 1) throw new ReviewsError('Sesión vencida.', 'unauthorized'); return collection();
    }, publish: async () => { writes++; throw new ReviewsError('Sesión vencida.', 'unauthorized'); } });
    controller.start(); await tick(); fill(controller);
    if (operation === 'read') await controller.refresh(); else await controller.publishReview();
    assert.equal(controller.getSnapshot().status, 'session-expired'); assert.equal(controller.getSnapshot().collection, null);
    assert.equal(controller.getSnapshot().comment, ''); const before = [reads, writes];
    await controller.refresh(); await controller.publishReview(); assert.deepEqual([reads, writes], before); controller.stop();
  }
});

test('403 clears private data and permits only a later authorized GET to restore eligibility', async () => {
  let reads = 0; const { controller } = setup({ list: async () => { if (++reads === 2) throw new ReviewsError('Acceso no permitido.', 'forbidden'); return collection(); } });
  controller.start(); await tick(); fill(controller); await controller.refresh();
  assert.equal(controller.getSnapshot().status, 'error'); assert.equal(controller.getSnapshot().collection, null);
  assert.equal(controller.getSnapshot().comment, ''); await controller.refresh(); assert.equal(controller.getSnapshot().status, 'ready'); controller.stop();
});

test('logout aborts a pending POST, hides drafts and ignores its late success', async () => {
  const response = deferred(); let signal; const { controller, auth } = setup({ publish: async (input, options) => { signal = options.signal; return response.promise; } });
  controller.start(); await tick(); fill(controller); const sending = controller.publishReview();
  auth.publish({ status: 'anonymous', user: null, message: null }); assert.equal(signal.aborted, true);
  assert.equal(controller.getSnapshot().status, 'anonymous'); assert.equal(controller.getSnapshot().collection, null);
  assert.equal(controller.getSnapshot().comment, ''); response.resolve(review()); await sending;
  assert.equal(controller.getSnapshot().collection, null); assert.equal(controller.getSnapshot().notice, null); controller.stop();
});

test('a new login to the same account rejects a stale GET from the earlier session', async () => {
  const response = deferred(); let reads = 0, signal;
  const { controller, auth } = setup({ list: async (options) => { if (++reads === 1) { signal = options.signal; return response.promise; } return collection([], []); } });
  controller.start(); auth.publish(authenticated()); await tick(); assert.equal(signal.aborted, true);
  response.resolve(collection()); await tick(); assert.deepEqual(controller.getSnapshot().collection, collection([], [])); controller.stop();
});

test('silent session changes are hidden synchronously with stable snapshots before subscriber notification', async () => {
  const { controller, auth } = setup(); controller.start(); await tick(); fill(controller);
  auth.silent({ status: 'anonymous', user: null, message: null }); const hidden = controller.getSnapshot();
  assert.equal(hidden.collection, null); assert.equal(hidden.comment, ''); assert.equal(hidden.status, 'anonymous');
  assert.equal(controller.getSnapshot(), hidden); auth.notify(); assert.equal(controller.getSnapshot().collection, null); controller.stop();
});

test('stop cancels requests, unsubscribes and clears drafts; start reloads instead of resubmitting', async () => {
  const response = deferred(); let writes = 0, signal, reads = 0;
  const { controller, auth } = setup({ list: async () => { reads++; return collection(); },
    publish: async (input, options) => { writes++; signal = options.signal; return response.promise; } });
  controller.start(); await tick(); fill(controller); const sending = controller.publishReview(); controller.stop(); controller.stop();
  assert.equal(signal.aborted, true); assert.equal(auth.listenerCount(), 0); assert.equal(controller.getSnapshot().comment, '');
  controller.start(); await tick(); response.resolve(review()); await sending;
  assert.equal(reads, 2); assert.equal(writes, 1); assert.equal(controller.getSnapshot().notice, null);
  assert.equal(controller.getSnapshot().collection.pending.length, 1); controller.stop();
});

test('a listener throwing during successful POST cannot change the result into an error', async () => {
  const { controller } = setup(); controller.start(); await tick(); fill(controller);
  controller.subscribe(() => { throw new Error('Observer failed.'); }); await controller.publishReview();
  assert.equal(controller.getSnapshot().publishError, null); assert.match(controller.getSnapshot().notice, /se publicó/); controller.stop();
});

test('a listener signing out before dispatch prevents the POST entirely', async () => {
  let writes = 0; const { controller, auth } = setup({ publish: async () => { writes++; return review(); } });
  controller.start(); await tick(); fill(controller); controller.subscribe(() => {
    if (controller.getSnapshot().publishing) auth.publish({ status: 'anonymous', user: null, message: null });
  }); await controller.publishReview(); assert.equal(writes, 0); assert.equal(controller.getSnapshot().status, 'anonymous'); controller.stop();
});
