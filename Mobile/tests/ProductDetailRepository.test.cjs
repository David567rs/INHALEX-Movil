const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiError } = require('../src/core/network/ApiError.ts');
const { mapCatalogProduct } = require('../src/features/catalog/data/mappers/mapCatalogPage.ts');
const { ProductDetailError } = require('../src/features/productDetail/domain/errors/ProductDetailError.ts');
const { ApiProductDetailRepository } = require('../src/features/productDetail/data/repositories/ApiProductDetailRepository.ts');
const { mapProductDetail } = require('../src/features/productDetail/data/mappers/mapProductDetail.ts');

const id = '507f1f77bcf86cd799439011';
const otherId = '507f1f77bcf86cd799439012';
const now = Date.UTC(2026, 9, 20, 12);
const product = (overrides = {}) => ({
  _id: id, slug: 'eucalipto', name: 'Eucalipto', description: 'Un aroma fresco y herbal.',
  price: 60, currency: 'MXN', image: '/products/eucalipto.jpg', aromas: ['eucalipto', 'herbal'],
  inStock: true, ...overrides,
});
const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});
const repository = (fetch, options = {}) => new ApiProductDetailRepository(new HttpClient({
  baseUrl: 'https://api.example/api', fetch, ...options,
}));
const isDetailError = (kind) => (error) => {
  assert.ok(error instanceof ProductDetailError);
  assert.equal(error.kind, kind);
  return true;
};

test('detail requests the selected public route without bearer, cookies or body', async () => {
  let call;
  const repo = repository(async (url, options) => {
    call = { url, options };
    return jsonResponse(product());
  }, { getAccessToken: () => { throw new Error('Public detail must not read the session'); } });
  const result = await repo.getById(id);
  assert.equal(call.url, `https://api.example/api/products/${id}`);
  assert.equal(call.options.method, 'GET');
  assert.equal(call.options.headers.Authorization, undefined);
  assert.equal(call.options.body, undefined);
  assert.equal(call.options.credentials, 'omit');
  assert.equal(result.id, id);
});

test('detail mapper supplies absent optional fields and returns only explicit public properties', () => {
  const dto = product({ rawMaterialName: 'private inventory', stockReserved: 8, stockAvailable: 20,
    allowBackorder: true, role: 'private role', cost: 30, arbitrary: { private: true } });
  const result = mapProductDetail(dto, id, now);
  assert.deepEqual(result, {
    id, name: 'Eucalipto', description: 'Un aroma fresco y herbal.', aromas: ['eucalipto', 'herbal'],
    price: 60, currency: 'MXN', image: '/products/eucalipto.jpg', inStock: true, originalPrice: null,
    longDescription: null, benefits: [], presentation: null, origin: null,
  });
  assert.ok(!JSON.stringify(result).includes('private'));
  dto.aromas.push('changed');
  assert.deepEqual(result.aromas, ['eucalipto', 'herbal']);
});

test('known additional information is trimmed, copied and preserved without invented values', () => {
  const dto = product({ longDescription: ' Descripción extendida del aroma. ', benefits: [' Nota fresca ', '', '   ', 'Uso personal'],
    presentation: ' 10 ml ', origin: ' México ' });
  const result = mapProductDetail(dto, id, now);
  assert.equal(result.longDescription, 'Descripción extendida del aroma.');
  assert.deepEqual(result.benefits, ['Nota fresca', 'Uso personal']);
  assert.equal(result.presentation, '10 ml'); assert.equal(result.origin, 'México');
  dto.benefits.push('changed');
  assert.deepEqual(result.benefits, ['Nota fresca', 'Uso personal']);
  const missing = mapProductDetail(product({ longDescription: ' ', benefits: null, presentation: null, origin: '' }), id, now);
  assert.equal(missing.longDescription, null); assert.equal(missing.presentation, null); assert.equal(missing.origin, null);
  assert.deepEqual(missing.benefits, []);
});

test('incorrect known optional types reject the response instead of exposing raw objects', () => {
  for (const field of ['longDescription', 'presentation', 'origin']) {
    for (const value of [7, false, {}, []]) {
      assert.throws(() => mapProductDetail(product({ [field]: value }), id, now), isDetailError('invalid-response'));
    }
  }
  for (const benefits of ['text', {}, false, [null], ['safe', 3]]) {
    assert.throws(() => mapProductDetail(product({ benefits }), id, now), isDetailError('invalid-response'));
  }
});

test('requested ObjectId identity is matched case-insensitively and mismatched products are rejected', () => {
  assert.equal(mapProductDetail(product(), id.toUpperCase(), now).id, id);
  for (const dto of [product({ _id: otherId }), product({ _id: 'not-a-mongo-id' }), product({ _id: '' }), product({ _id: 1 })]) {
    assert.throws(() => mapProductDetail(dto, id, now), isDetailError('invalid-response'));
  }
});

test('slug requests require a matching canonical response slug and a valid Mongo identity', async () => {
  let route;
  const repo = repository(async (url) => { route = url; return jsonResponse(product()); });
  assert.equal((await repo.getById('Eucalipto')).id, id);
  assert.equal(route, 'https://api.example/api/products/Eucalipto');
  for (const dto of [product({ slug: 'lavanda' }), product({ slug: undefined }), product({ slug: 'Eucalipto' }), product({ _id: 'bad' })]) {
    assert.throws(() => mapProductDetail(dto, 'eucalipto', now), isDetailError('invalid-response'));
  }
});

test('custom product slugs can retain boundary or repeated hyphens without accepting path separators', async () => {
  for (const slug of ['-eucalipto', 'eucalipto-', '--eucalipto--', 'euca--lipto']) {
    let route;
    const repo = repository(async (url) => { route = url; return jsonResponse(product({ slug })); });
    assert.equal((await repo.getById(slug.toUpperCase())).id, id);
    assert.equal(route, `https://api.example/api/products/${slug.toUpperCase()}`);
  }
});

test('detail shares catalog price and image mapping across current, expired and invalid promotions', () => {
  const cases = [
    {}, { price: 0 },
    { promoActive: true, promoPrice: 40, promoEndsAt: new Date(now + 60_000).toISOString() },
    { promoActive: true, promoPrice: 40, promoEndsAt: null },
    { promoActive: true, promoPrice: 40, promoEndsAt: new Date(now - 1).toISOString() },
    { promoActive: true, promoPrice: 40, promoEndsAt: 'invalid-date' },
    { promoActive: true, promoPrice: 0 }, { promoActive: true, promoPrice: 60 },
    { promoActive: 'true', promoPrice: 40 }, { promoActive: true, promoPrice: '40' },
    { image: 'https://images.example/eucalipto.jpg' }, { image: 'https://user:pass@images.example/a.jpg' },
    { image: 'http://images.example/a.jpg' }, { image: '/products/../private.jpg' }, { image: null },
  ];
  for (const overrides of cases) {
    const dto = product(overrides);
    const detail = mapProductDetail(dto, id, now);
    const catalog = mapCatalogProduct(dto, now);
    for (const key of Object.keys(catalog)) assert.deepEqual(detail[key], catalog[key], key);
  }
  const current = mapProductDetail(product({ promoActive: true, promoPrice: 40 }), id, now);
  assert.deepEqual([current.price, current.originalPrice], [40, 60]);
  const zero = mapProductDetail(product({ price: 0, inStock: false }), id, now);
  assert.deepEqual([zero.price, zero.originalPrice, zero.inStock], [0, null, false]);
});

test('detail rejects malformed base DTOs and currencies using its own domain error', async () => {
  for (const dto of [null, [], {}, product({ name: '' }), product({ description: '' }),
    product({ price: '60' }), product({ price: -1 }), product({ price: Infinity }), product({ currency: 'ZZZ' }),
    product({ currency: 'mxn' }), product({ aromas: ['safe', null] }), product({ inStock: 'true' })]) {
    assert.throws(() => mapProductDetail(dto, id, now), isDetailError('invalid-response'));
  }
  await assert.rejects(repository(async () => jsonResponse(product({ currency: 'ZZZ' }))).getById(id), isDetailError('invalid-response'));
});

test('invalid route identities are rejected before any transport call', async () => {
  let calls = 0;
  const repo = repository(async () => { calls++; return jsonResponse(product()); });
  for (const value of ['', ' ', '../x', 'x/y', 'x?admin=true', 'x#y', 'x%2fy', 'x_y', '-', '--', 'á', 'a'.repeat(161), null, []]) {
    await assert.rejects(repo.getById(value), isDetailError('not-found'));
  }
  assert.equal(calls, 0);
});

test('404 and server errors produce safe messages without retaining backend internals or retrying', async () => {
  for (const [status, kind] of [[404, 'not-found'], [400, 'server'], [401, 'server'], [403, 'server'], [429, 'server'], [500, 'server'], [503, 'server']]) {
    let calls = 0;
    const repo = repository(async () => { calls++; return jsonResponse({ message: 'private database internals' }, status); });
    await assert.rejects(repo.getById(id), (error) => {
      isDetailError(kind)(error); assert.ok(!error.message.includes('private')); assert.equal(error.cause, undefined); return true;
    });
    assert.equal(calls, 1);
  }
});

test('network failures stay recoverable and explicit retry is possible without automatic retry', async () => {
  let calls = 0;
  const repo = repository(async () => {
    if (++calls === 1) throw new Error('private socket diagnostic');
    return jsonResponse(product());
  });
  await assert.rejects(repo.getById(id), (error) => {
    isDetailError('network')(error); assert.ok(!error.message.includes('private')); return true;
  });
  assert.equal(calls, 1);
  assert.equal((await repo.getById(id)).id, id); assert.equal(calls, 2);
});

test('timeout aborts the selected request and does not start another one', async () => {
  let calls = 0, signal;
  const repo = repository((_url, options) => { calls++; signal = options.signal; return new Promise(() => {}); }, { requestTimeoutMs: 15 });
  await assert.rejects(repo.getById(id), isDetailError('timeout'));
  assert.equal(signal.aborted, true); assert.equal(calls, 1);
});

test('cancellation reaches fetch and an already cancelled request performs no additional transport', async () => {
  let calls = 0, signal;
  const controller = new AbortController();
  const repo = repository((_url, options) => { calls++; signal = options.signal; return new Promise(() => {}); });
  const pending = repo.getById(id, { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, isDetailError('cancelled'));
  assert.equal(signal.aborted, true);
  await assert.rejects(repo.getById(id, { signal: controller.signal }), isDetailError('cancelled'));
  assert.equal(calls, 1);
});

test('non-JSON, invalid JSON and a different response origin are not published as product details', async () => {
  const responses = [
    () => new Response('<html>wrong</html>', { headers: { 'content-type': 'text/html' } }),
    () => new Response('{bad', { headers: { 'content-type': 'application/json' } }),
    () => {
      const response = jsonResponse(product());
      Object.defineProperty(response, 'url', { value: `https://other.example/api/products/${id}` });
      return response;
    },
  ];
  for (const response of responses) await assert.rejects(repository(async () => response()).getById(id), isDetailError('invalid-response'));
});

test('configuration and unexpected transport failures never expose infrastructure messages', async () => {
  for (const [failure, kind] of [[new ApiError('private config detail', 'invalid-request'), 'configuration'], [new Error('private diagnostic'), 'server']]) {
    const repo = new ApiProductDetailRepository({ request: async () => { throw failure; } });
    await assert.rejects(repo.getById(id), (error) => {
      isDetailError(kind)(error); assert.ok(!error.message.includes('private')); assert.equal(error.cause, undefined); return true;
    });
  }
});
