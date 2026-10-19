const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiError } = require('../src/core/network/ApiError.ts');
const { CartError } = require('../src/features/cart/domain/errors/CartError.ts');
const { ApiCartRepository } = require('../src/features/cart/data/repositories/ApiCartRepository.ts');

const id = '507f1f77bcf86cd799439011';
const secondId = '507f1f77bcf86cd799439012';
const product = (overrides = {}) => ({
  _id: id, name: 'Lavanda', description: 'Un aroma floral y relajante.',
  price: 60, currency: 'MXN', image: '/products/lavanda.jpg',
  aromas: ['lavanda', 'floral'], inStock: true, ...overrides,
});
const item = (overrides = {}) => ({ productId: id, quantity: 2, subtotal: 120, product: product(), ...overrides });
const cart = (overrides = {}) => ({ items: [item()], totalItems: 2, subtotal: 120, currency: 'MXN', ...overrides });
const emptyCart = () => cart({ items: [], totalItems: 0, subtotal: 0 });
const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});
const repository = (fetch, options = {}) => new ApiCartRepository(new HttpClient({
  baseUrl: 'https://api.example/api', fetch, getAccessToken: () => 'private.jwt.token', ...options,
}));
const isCartError = (kind) => (error) => {
  assert.ok(error instanceof CartError);
  assert.equal(error.kind, kind);
  return true;
};
const methods = ['list', 'add', 'updateQuantity', 'remove'];
function operation(repo, method, options) {
  if (method === 'list') return repo.list(options);
  if (method === 'remove') return repo.remove(id, options);
  return repo[method](id, 2, options);
}
const responseFor = (method) => method === 'remove' ? emptyCart() : cart();

test('cart list uses authenticated GET and exposes only public products in confirmed API order', async () => {
  let call;
  const repo = repository(async (url, options) => {
    call = { url, options };
    return jsonResponse(cart({ items: [item({ productId: secondId, quantity: 1, subtotal: 80,
      product: product({ _id: secondId, name: 'Menta', price: 80, inStock: false,
        stockReserved: 9, rawMaterialName: 'private inventory' }) }), item()], totalItems: 3, subtotal: 200,
      userId: 'private account', accessToken: 'private token' }));
  });
  const result = await repo.list();
  assert.equal(call.url, 'https://api.example/api/cart');
  assert.equal(call.options.method, 'GET');
  assert.equal(call.options.headers.Authorization, 'Bearer private.jwt.token');
  assert.equal(call.options.credentials, 'omit');
  assert.equal(call.options.body, undefined);
  assert.deepEqual(result.items.map((value) => value.productId), [secondId, id]);
  assert.equal(result.items[0].product.inStock, false);
  assert.deepEqual(result.items[1], { productId: id, quantity: 2, subtotal: 120,
    product: { id, name: 'Lavanda', description: 'Un aroma floral y relajante.', price: 60,
      currency: 'MXN', image: '/products/lavanda.jpg', aromas: ['lavanda', 'floral'],
      inStock: true, originalPrice: null } });
  assert.equal(result.totalItems, 3);
  assert.equal(result.subtotal, 200);
  assert.equal(result.currency, 'MXN');
  assert.ok(!JSON.stringify(result).includes('private'));
  assert.equal(Object.hasOwn(result.items[0].product, 'stockReserved'), false);
});

test('cart accepts the confirmed empty cart without inventing samples, shipping or checkout data', async () => {
  assert.deepEqual(await repository(async () => jsonResponse(emptyCart())).list(), emptyCart());
});

test('cart uses server-confirmed promotion price even after promoEndsAt and keeps safe public image mapping', async () => {
  const result = await repository(async () => jsonResponse(cart({ items: [item({ subtotal: 80,
    product: product({ promoActive: true, promoPrice: 40, promoEndsAt: '2000-01-01T00:00:00.000Z',
      image: 'javascript:private' }) })], subtotal: 80 }))).list();
  assert.equal(result.items[0].product.price, 40);
  assert.equal(result.items[0].product.originalPrice, 60);
  assert.equal(result.items[0].product.image, null);
  assert.equal(result.items[0].subtotal, 80);
});

test('cart accepts valid decimal amounts without requiring exact binary floating-point equality', async () => {
  for (const amount of [0.3, 0.1 * 3]) {
    const result = await repository(async () => jsonResponse(cart({
      items: [item({ quantity: 3, subtotal: amount, product: product({ price: 0.1 }) })],
      totalItems: 3, subtotal: amount,
    }))).list();
    assert.ok(Math.abs(result.items[0].product.price - 0.1) < 1e-12);
    assert.equal(result.totalItems, 3);
  }
});

test('cart normalizes hexadecimal product and embedded identities for membership comparisons', async () => {
  const result = await repository(async () => jsonResponse(cart({ items: [item({
    productId: id.toUpperCase(), product: product({ _id: id.toUpperCase() }),
  })] }))).list();
  assert.equal(result.items[0].productId, id);
  assert.equal(result.items[0].product.id, id);
});

test('cart rejects malformed envelopes, inconsistent counts, totals and currencies', async () => {
  for (const payload of [null, [], {}, 'private', { data: emptyCart() },
    cart({ items: null }), cart({ items: {} }), cart({ totalItems: '2' }), cart({ totalItems: 1 }),
    cart({ totalItems: 2.5 }), cart({ totalItems: -2 }), cart({ totalItems: Number.MAX_SAFE_INTEGER + 1 }),
    cart({ subtotal: '120' }), cart({ subtotal: 119 }), cart({ subtotal: -1 }),
    cart({ currency: 'mxn' }), cart({ currency: 'ZZZ' }), cart({ currency: 'USD' }),
    cart({ items: [], totalItems: 0 }), cart({ items: [], subtotal: 0 }),
    cart({ items: [item(), item()], totalItems: 4, subtotal: 240 }),
    cart({ items: [item(), item({ productId: id.toUpperCase(), product: product({ _id: id.toUpperCase() }) })],
      totalItems: 4, subtotal: 240 })]) {
    await assert.rejects(repository(async () => jsonResponse(payload)).list(), (error) => {
      isCartError('invalid-response')(error);
      assert.ok(!error.message.includes('private'));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test('cart rejects invalid rows, mismatched product identities, quantities, prices and private malformed data', async () => {
  const invalidItems = [null, [], {}, item({ productId: 'lavanda' }), item({ productId: `${id}\n` }),
    item({ productId: secondId }), item({ product: null }), item({ product: product({ _id: secondId }) }),
    item({ product: product({ _id: 'lavanda' }) }), item({ product: product({ name: '' }) }),
    item({ product: product({ price: '60' }) }), item({ product: product({ currency: 'ZZZ' }) }),
    item({ product: product({ aromas: [null] }) }), item({ product: product({ inStock: 'true' }) }),
    item({ subtotal: '120' }), item({ subtotal: -1 }), item({ subtotal: 119 }),
    item({ subtotal: 0 }), item({ subtotal: 80, product: product({ promoActive: false, promoPrice: 40 }) })];
  for (const quantity of [null, undefined, '2', 0, -1, 1.5, 26, Number.MAX_SAFE_INTEGER]) {
    invalidItems.push(item({ quantity }));
  }
  for (const invalidItem of invalidItems) {
    await assert.rejects(repository(async () => jsonResponse(cart({ items: [invalidItem] }))).list(),
      isCartError('invalid-response'));
  }
});

test('cart mutations use authenticated POST, PATCH and DELETE with only canonical product ID and quantity', async () => {
  const calls = [];
  const repo = repository(async (url, options) => {
    calls.push({ url, options });
    return jsonResponse(options.method === 'DELETE' ? emptyCart() : cart());
  });
  const added = await repo.add(id.toUpperCase(), 2);
  const updated = await repo.updateQuantity(id.toUpperCase(), 2);
  const removed = await repo.remove(id.toUpperCase());
  assert.equal(added.items[0].quantity, 2);
  assert.equal(updated.items[0].quantity, 2);
  assert.deepEqual(removed, emptyCart());
  assert.deepEqual(calls.map(({ options }) => options.method), ['POST', 'PATCH', 'DELETE']);
  assert.deepEqual(calls.map(({ url }) => url), ['https://api.example/api/cart',
    `https://api.example/api/cart/${id}`, `https://api.example/api/cart/${id}`]);
  assert.deepEqual(JSON.parse(calls[0].options.body), { productId: id, quantity: 2 });
  assert.deepEqual(JSON.parse(calls[1].options.body), { quantity: 2 });
  assert.equal(calls[2].options.body, undefined);
  for (const { options } of calls) {
    assert.equal(options.headers.Authorization, 'Bearer private.jwt.token');
    assert.equal(options.credentials, 'omit');
    assert.ok(!String(options.body).includes('userId'));
  }
});

test('cart validates mutation acknowledgements against the product and requested quantity', async () => {
  const wrongProduct = cart({ items: [item({ productId: secondId, product: product({ _id: secondId }) })] });
  for (const method of ['add', 'updateQuantity']) {
    for (const payload of [emptyCart(), wrongProduct, cart({ items: [item({ quantity: 1, subtotal: 60 })],
      totalItems: 1, subtotal: 60 })]) {
      await assert.rejects(operation(repository(async () => jsonResponse(payload)), method),
        isCartError('invalid-response'));
    }
  }
  const accumulated = cart({ items: [item({ quantity: 5, subtotal: 300 })], totalItems: 5, subtotal: 300 });
  assert.equal((await repository(async () => jsonResponse(accumulated)).add(id, 2)).totalItems, 5);
  await assert.rejects(repository(async () => jsonResponse(accumulated)).updateQuantity(id, 2),
    isCartError('invalid-response'));
  await assert.rejects(repository(async () => jsonResponse(cart())).remove(id), isCartError('invalid-response'));
});

test('cart rejects invalid mutation IDs and quantities before reading the private token or fetching', async () => {
  let requests = 0;
  let tokenReads = 0;
  const repo = repository(async () => { requests++; return jsonResponse(cart()); },
    { getAccessToken: () => { tokenReads++; return 'private.jwt.token'; } });
  for (const candidate of [null, undefined, {}, [], 1, '', 'lavanda', ` ${id}`, `${id}\n`,
    `${id}/other`, `${id}?userId=other`, 'z'.repeat(24)]) {
    await assert.rejects(repo.add(candidate, 2), isCartError('invalid-request'));
    await assert.rejects(repo.updateQuantity(candidate, 2), isCartError('invalid-request'));
    await assert.rejects(repo.remove(candidate), isCartError('invalid-request'));
  }
  for (const quantity of [undefined, null, {}, [], '2', 0, -1, 1.5, 26, Infinity, NaN]) {
    await assert.rejects(repo.add(id, quantity), isCartError('invalid-request'));
    await assert.rejects(repo.updateQuantity(id, quantity), isCartError('invalid-request'));
  }
  assert.equal(requests, 0);
  assert.equal(tokenReads, 0);
});

test('cart maps HTTP failures into safe domain errors without raw backend text or automatic retries', async () => {
  for (const [status, kind] of [[400, 'invalid-request'], [401, 'unauthorized'], [403, 'server'],
    [404, 'not-found'], [409, 'invalid-request'], [422, 'invalid-request'], [429, 'server'],
    [500, 'server'], [503, 'server']]) {
    for (const method of methods) {
      let attempts = 0;
      const repo = repository(async () => { attempts++; return jsonResponse({ message: 'private backend diagnostic' }, status); });
      await assert.rejects(operation(repo, method), (error) => {
        isCartError(kind)(error);
        assert.ok(!error.message.includes('private'));
        assert.equal(error.cause, undefined);
        return true;
      });
      assert.equal(attempts, 1);
    }
  }
});

test('cart rejects non-JSON, malformed JSON, empty 204 and unexpected response origins for every operation', async () => {
  for (const method of methods) {
    for (const response of [new Response('{', { headers: { 'content-type': 'application/json' } }),
      new Response('<html/>', { headers: { 'content-type': 'text/html' } }), new Response(null, { status: 204 })]) {
      await assert.rejects(operation(repository(async () => response), method), isCartError('invalid-response'));
    }
    await assert.rejects(operation(repository(async () => {
      const response = jsonResponse(responseFor(method));
      Object.defineProperty(response, 'url', { value: 'https://unexpected.example/api/cart' });
      return response;
    }), method), isCartError('invalid-response'));
  }
});

test('cart hides network diagnostics and never retries an uncertain mutation automatically', async () => {
  for (const method of methods) {
    let attempts = 0;
    const repo = repository(async () => { attempts++; throw new Error('private transport diagnostic'); });
    await assert.rejects(operation(repo, method), (error) => {
      isCartError('network')(error);
      assert.ok(!error.message.includes('private'));
      assert.equal(error.cause, undefined);
      return true;
    });
    assert.equal(attempts, 1);
  }
});

test('cart timeouts abort each transport operation without retrying', async () => {
  for (const method of methods) {
    let attempts = 0;
    let signal;
    const repo = repository((_url, options) => { attempts++; signal = options.signal; return new Promise(() => {}); },
      { requestTimeoutMs: 15 });
    await assert.rejects(operation(repo, method), isCartError('timeout'));
    assert.equal(signal.aborted, true);
    assert.equal(attempts, 1);
  }
});

test('cart cancellation aborts transport and pre-cancelled operations do not read token or fetch', async () => {
  for (const method of methods) {
    let attempts = 0;
    let tokenReads = 0;
    let signal;
    let started;
    const ready = new Promise((resolve) => { started = resolve; });
    const repo = repository((_url, options) => {
      attempts++; signal = options.signal; started(); return new Promise(() => {});
    }, { getAccessToken: () => { tokenReads++; return 'private.jwt.token'; } });
    const controller = new AbortController();
    const pending = operation(repo, method, { signal: controller.signal });
    await ready;
    controller.abort();
    await assert.rejects(pending, isCartError('cancelled'));
    assert.equal(signal.aborted, true);
    await assert.rejects(operation(repo, method, { signal: controller.signal }), isCartError('cancelled'));
    assert.equal(attempts, 1);
    assert.equal(tokenReads, 1);
  }
});

test('cart discards late success and failure when an injected transport ignores cancellation', async () => {
  for (const method of methods) {
    for (const shouldFail of [false, true]) {
      let finish;
      let fail;
      const repo = new ApiCartRepository({ request: () => new Promise((resolve, reject) => { finish = resolve; fail = reject; }) });
      const controller = new AbortController();
      const pending = operation(repo, method, { signal: controller.signal });
      controller.abort();
      if (shouldFail) fail(new Error('private late diagnostic'));
      else finish(responseFor(method));
      await assert.rejects(pending, isCartError('cancelled'));
    }
  }
});

test('cart converts configuration and unexpected errors without retaining private causes', async () => {
  for (const [failure, kind] of [[new ApiError('private configuration', 'invalid-request'), 'configuration'],
    [new Error('private implementation diagnostic'), 'server'], ['private value', 'server']]) {
    for (const method of methods) {
      const repo = new ApiCartRepository({ request: async () => { throw failure; } });
      await assert.rejects(operation(repo, method), (error) => {
        isCartError(kind)(error);
        assert.ok(!error.message.includes('private'));
        assert.equal(error.cause, undefined);
        return true;
      });
    }
  }
});
