const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createAuthSession } = require('../src/features/auth/domain/session/createAuthSession.ts');
const { createCartController } = require('../src/features/cart/presentation/state/createCartController.ts');
const { createFavoritesController } = require('../src/features/favorites/presentation/state/createFavoritesController.ts');
const { createProfileController } = require('../src/features/profile/presentation/state/createProfileController.ts');

const USER_ID = '0123456789abcdef01234567';
const PRODUCT_ID = '507f1f77bcf86cd799439011';
const user = { id: USER_ID, firstName: 'Ana', lastName: 'Flores', email: 'ana@example.test', phone: '5512345678' };
const product = { id: PRODUCT_ID, name: 'Lavanda de prueba', description: 'Aroma floral', aromas: ['Floral'],
  price: 149, currency: 'MXN', image: null, inStock: true, originalPrice: null };
const form = { email: user.email, password: 'test password' };
const tick = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function cart(quantity) {
  return { items: [{ productId: PRODUCT_ID, quantity, subtotal: 149 * quantity, product }],
    totalItems: quantity, subtotal: 149 * quantity, currency: 'MXN' };
}
async function authenticatedRuntime() {
  let loginCount = 0;
  const stored = [];
  const runtime = createAuthSession(async () => ({ accessToken: `test.session${++loginCount}.signature`, user }), {
    get: async () => null, set: async (token) => { stored.push(token); }, clear: async () => {},
  }, async () => user);
  await runtime.session.signIn(form);
  return { runtime, stored };
}
function profileController(runtime, onUpdate = () => {}) {
  return createProfileController(runtime.session, {
    get: async () => ({ ...runtime.session.getSnapshot().user }),
    update: async (draft) => { onUpdate(); return { ...runtime.session.getSnapshot().user, ...draft }; },
  }, runtime.updatePublicUser);
}

test('confirmed profile PATCH keeps a pending cart POST alive without extra GET or credential changes', async () => {
  const { runtime, stored } = await authenticatedRuntime();
  const response = deferred();
  let reads = 0, posts = 0, patches = 0, signal;
  const collection = createCartController(runtime.authorizationSession, {
    list: async () => { reads++; return cart(1); },
    add: async (id, quantity, options) => {
      posts++; assert.equal(id, PRODUCT_ID); assert.equal(quantity, 1); signal = options.signal;
      return response.promise;
    },
    updateQuantity: async () => { throw new Error('Unexpected quantity write'); },
    remove: async () => { throw new Error('Unexpected removal'); },
  });
  const profile = profileController(runtime, () => { patches++; });
  collection.start(); profile.start();
  try {
    await tick();
    const authorization = runtime.authorizationSession.getSnapshot();
    const publicSession = runtime.session.getSnapshot();
    const token = runtime.getAccessToken();
    const adding = collection.add(product);
    profile.beginEdit(); profile.updateField('firstName', 'Elena'); await profile.save();
    await tick();

    assert.equal(patches, 1); assert.equal(posts, 1); assert.equal(reads, 1);
    assert.equal(signal.aborted, false);
    assert.equal(collection.getSnapshot().pendingProductId, PRODUCT_ID);
    assert.equal(collection.getSnapshot().cart.totalItems, 1, 'pending POST must not invent local quantities');
    assert.equal(runtime.authorizationSession.getSnapshot(), authorization);
    assert.notEqual(runtime.session.getSnapshot(), publicSession);
    assert.equal(runtime.session.getSnapshot().user.firstName, 'Elena');
    assert.equal(profile.getSnapshot().profile.firstName, 'Elena');
    assert.equal(profile.getSnapshot().mode, 'summary');
    assert.equal(runtime.getAccessToken(), token); assert.equal(stored.length, 1);

    response.resolve(cart(2)); await adding;
    assert.equal(collection.getSnapshot().cart.totalItems, 2);
    assert.equal(collection.getSnapshot().pendingProductId, null);
    assert.equal(collection.getSnapshot().notice, 'Producto agregado a tu bolsa.');
    assert.equal(reads, 1); assert.equal(posts, 1);
  } finally { collection.stop(); profile.stop(); }
});

test('real logout still aborts a pending cart POST and discards its late authoritative response', async () => {
  const { runtime } = await authenticatedRuntime();
  const response = deferred(); let reads = 0, signal;
  const collection = createCartController(runtime.authorizationSession, {
    list: async () => { reads++; return cart(1); },
    add: async (_, __, options) => { signal = options.signal; return response.promise; },
    updateQuantity: async () => cart(1), remove: async () => cart(1),
  });
  collection.start();
  try {
    await tick();
    const adding = collection.add(product);
    const logout = runtime.session.signOut();
    assert.equal(signal.aborted, true);
    assert.equal(runtime.authorizationSession.getSnapshot().status, 'anonymous');
    assert.equal(runtime.getAccessToken(), undefined);
    assert.equal(collection.getSnapshot().status, 'anonymous');
    assert.equal(collection.getSnapshot().cart, null);
    assert.equal(collection.getSnapshot().pendingProductId, null);
    await logout;
    response.resolve(cart(2)); await adding;
    assert.equal(collection.getSnapshot().cart, null);
    assert.equal(collection.getSnapshot().notice, null);
    assert.equal(reads, 1);
  } finally { collection.stop(); }
});

test('another login to the same user invalidates the old authorization and ignores its pending cart POST', async () => {
  const { runtime, stored } = await authenticatedRuntime();
  const oldResponse = deferred(), freshRead = deferred(); let reads = 0, signal;
  const collection = createCartController(runtime.authorizationSession, {
    list: async () => ++reads === 1 ? cart(1) : freshRead.promise,
    add: async (_, __, options) => { signal = options.signal; return oldResponse.promise; },
    updateQuantity: async () => cart(1), remove: async () => cart(1),
  });
  collection.start();
  try {
    await tick();
    const oldAuthorization = runtime.authorizationSession.getSnapshot();
    const oldPublicSession = runtime.session.getSnapshot();
    const adding = collection.add(product);
    await runtime.session.signIn(form);
    const authorization = runtime.authorizationSession.getSnapshot();
    assert.notEqual(authorization, oldAuthorization);
    assert.equal(authorization.user.id, oldAuthorization.user.id, 'same account still means a new authorization');
    assert.equal(signal.aborted, true); assert.equal(reads, 2); assert.equal(stored.length, 2);
    assert.equal(collection.getSnapshot().status, 'loading');
    assert.equal(collection.getSnapshot().cart, null);
    assert.equal(runtime.updatePublicUser({ ...user, firstName: 'Obsolete' }, oldPublicSession), false);

    freshRead.resolve(cart(3)); await tick();
    oldResponse.resolve(cart(2)); await adding;
    assert.equal(collection.getSnapshot().cart.totalItems, 3);
    assert.equal(collection.getSnapshot().pendingProductId, null);
    assert.equal(collection.getSnapshot().notice, null);
  } finally { collection.stop(); }
});

test('confirmed profile PATCH also preserves pending favorites writes without refetching the collection', async () => {
  const { runtime } = await authenticatedRuntime();
  const response = deferred(); let reads = 0, writes = 0, signal;
  const favorites = createFavoritesController(runtime.authorizationSession, {
    list: async () => { reads++; return []; },
    add: async (id, options) => { writes++; assert.equal(id, PRODUCT_ID); signal = options.signal; return response.promise; },
    remove: async () => { throw new Error('Unexpected removal'); },
  });
  const profile = profileController(runtime);
  favorites.start(); profile.start();
  try {
    await tick();
    const adding = favorites.add(product);
    profile.beginEdit(); profile.updateField('phone', '5598765432'); await profile.save();
    await tick();
    assert.equal(runtime.session.getSnapshot().user.phone, '5598765432');
    assert.equal(signal.aborted, false); assert.equal(reads, 1); assert.equal(writes, 1);
    assert.deepEqual(favorites.getSnapshot().pendingProductIds, [PRODUCT_ID]);
    assert.deepEqual(favorites.getSnapshot().products, []);
    response.resolve(); await adding;
    assert.deepEqual(favorites.getSnapshot().products.map((item) => item.id), [PRODUCT_ID]);
    assert.deepEqual(favorites.getSnapshot().pendingProductIds, []);
    assert.equal(reads, 1);
  } finally { favorites.stop(); profile.stop(); }
});
