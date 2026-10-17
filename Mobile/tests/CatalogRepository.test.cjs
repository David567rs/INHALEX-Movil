const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiError } = require('../src/core/network/ApiError.ts');
const { CatalogError } = require('../src/features/catalog/domain/errors/CatalogError.ts');
const { ApiCatalogRepository } = require('../src/features/catalog/data/repositories/ApiCatalogRepository.ts');
const { mapCatalogPage } = require('../src/features/catalog/data/mappers/mapCatalogPage.ts');

const input = { page: 1, limit: 20 };
const now = Date.UTC(2026, 9, 17, 12);
const product = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011', name: 'Eucalipto', description: 'Un aroma fresco y herbal.',
  price: 60, currency: 'MXN', image: '/products/eucalipto.jpg',
  aromas: ['eucalipto', 'herbal'], inStock: true, ...overrides,
});
const payload = (items = [product()], overrides = {}) => ({
  items, total: items.length, page: 1, limit: 20, totalPages: 1, ...overrides,
});
const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});
const repository = (fetch, options = {}) => new ApiCatalogRepository(new HttpClient({
  baseUrl: 'https://api.example/api', fetch, ...options,
}));
const isCatalogError = (kind) => (error) => {
  assert.ok(error instanceof CatalogError);
  assert.equal(error.kind, kind);
  return true;
};

test('catalog uses the paginated public GET without bearer, cookies or body and only returns public product fields', async () => {
  let call;
  const repo = repository(async (url, options) => {
    call = { url, options };
    return jsonResponse(payload([product({ rawMaterialName: 'private', stockReserved: 9, cost: 2, slug: 'eucalipto' })], {
      privateMetadata: 'ignored',
    }));
  }, { getAccessToken: () => { throw new Error('A public catalog must not read the session'); } });
  const result = await repo.list(input);
  assert.equal(call.url, 'https://api.example/api/products?page=1&limit=20');
  assert.equal(call.options.method, 'GET');
  assert.equal(call.options.body, undefined);
  assert.equal(call.options.headers.Authorization, undefined);
  assert.equal(call.options.credentials, 'omit');
  assert.deepEqual(result, {
    items: [{ id: '507f1f77bcf86cd799439011', name: 'Eucalipto', description: 'Un aroma fresco y herbal.',
      aromas: ['eucalipto', 'herbal'], price: 60, currency: 'MXN', image: '/products/eucalipto.jpg',
      inStock: true, originalPrice: null }],
    total: 1, page: 1, limit: 20, totalPages: 1,
  });
  assert.ok(!JSON.stringify(result).includes('private'));
  assert.equal(Object.hasOwn(result.items[0], 'stockReserved'), false);
  assert.equal(Object.hasOwn(result.items[0], 'cost'), false);
});

test('catalog prices remain in pesos, include zero, preserve currency and retain unavailable products', async () => {
  const page = await repository(async () => jsonResponse(payload([
    product({ price: 0, inStock: false }),
    product({ _id: 'second-id', price: 60.5, currency: 'USD', aromas: [] }),
  ]))).list(input);
  assert.equal(page.items[0].price, 0);
  assert.equal(page.items[0].inStock, false);
  assert.equal(page.items[1].price, 60.5);
  assert.equal(page.items[1].currency, 'USD');
  assert.deepEqual(page.items[1].aromas, []);
});

test('catalog rejects invalid currencies instead of silently calling their prices MXN', () => {
  for (const currency of ['ZZZ', 'MX', 'MXNN', 'mxn', '', ' MXN ', 123, null, undefined]) {
    assert.throws(() => mapCatalogPage(payload([product({ currency })]), input), isCatalogError('invalid-response'));
  }
  for (const currency of ['MXN', 'USD', 'EUR']) {
    assert.equal(mapCatalogPage(payload([product({ currency })]), input).items[0].currency, currency);
  }
});

test('catalog rejects malformed required fields without coercing strings, numbers or booleans', () => {
  for (const invalid of [null, [], {}, product({ _id: ' ' }), product({ name: '' }),
    product({ description: null }), product({ price: '60' }), product({ price: -1 }),
    product({ price: NaN }), product({ price: Infinity }), product({ aromas: null }),
    product({ aromas: ['herbal', 1] }), product({ inStock: 'false' })]) {
    assert.throws(() => mapCatalogPage(payload([invalid]), input), isCatalogError('invalid-response'));
  }
});

test('catalog validates metadata against the requested page and limit and never silently truncates products', () => {
  for (const body of [null, [], {}, payload(undefined, { items: null }),
    payload(undefined, { total: '1' }), payload(undefined, { total: -1 }),
    payload(undefined, { total: 1.5 }), payload(undefined, { total: Number.MAX_SAFE_INTEGER + 1 }),
    payload(undefined, { page: '1' }), payload(undefined, { page: 2 }),
    payload(undefined, { limit: '20' }), payload(undefined, { limit: 10 }),
    payload(undefined, { totalPages: 0 }), payload(undefined, { totalPages: '1' }),
    payload(undefined, { totalPages: 2 }), payload(undefined, { total: 2 })]) {
    assert.throws(() => mapCatalogPage(body, input), isCatalogError('invalid-response'));
  }
  const excessive = Array.from({ length: 21 }, (_, index) => product({ _id: `id-${index}` }));
  assert.throws(() => mapCatalogPage(payload(excessive, { totalPages: 2 }), input), isCatalogError('invalid-response'));
});

test('catalog rejects duplicate product identifiers within one page', () => {
  assert.throws(() => mapCatalogPage(payload([product(), product()]), input), isCatalogError('invalid-response'));
});

test('catalog accepts empty catalogs and an empty page beyond the available range without hiding the total', async () => {
  const empty = await repository(async () => jsonResponse(payload([]))).list(input);
  assert.deepEqual(empty, { items: [], total: 0, page: 1, limit: 20, totalPages: 1 });
  const outside = await repository(async () => jsonResponse(payload([], { total: 2, page: 4 })))
    .list({ page: 4, limit: 20 });
  assert.deepEqual(outside, { items: [], total: 2, page: 4, limit: 20, totalPages: 1 });
});

test('catalog accepts a partial final page with consistent pagination metadata', async () => {
  const last = await repository(async () => jsonResponse(payload([product()], { total: 3, page: 2, limit: 2, totalPages: 2 })))
    .list({ page: 2, limit: 2 });
  assert.equal(last.items.length, 1);
  assert.equal(last.total, 3);
  assert.equal(last.totalPages, 2);
});

test('catalog applies only a boolean active discount, preserving the original price and honoring a valid future expiry', () => {
  for (const promoEndsAt of [undefined, null, '2026-10-18T12:00:00.000Z']) {
    const item = mapCatalogPage(payload([product({ promoActive: true, promoPrice: 40, promoEndsAt })]), input, now).items[0];
    assert.equal(item.price, 40);
    assert.equal(item.originalPrice, 60);
  }
});

test('catalog ignores expired, malformed or coercible promotions instead of inventing a discount', () => {
  const invalidPromotions = [
    { promoActive: 'true', promoPrice: 40 }, { promoActive: 1, promoPrice: 40 },
    { promoActive: false, promoPrice: 40 }, { promoActive: true, promoPrice: '40' },
    { promoActive: true, promoPrice: 0 },
    { promoActive: true, promoPrice: -1 }, { promoActive: true, promoPrice: Infinity },
    { promoActive: true, promoPrice: NaN }, { promoActive: true, promoPrice: 60 },
    { promoActive: true, promoPrice: 61 }, { promoActive: true },
    ...['2026-10-16T12:00:00.000Z', '2026-10-17T12:00:00.000Z', 'not-a-date',
      '2030-02-30T12:00:00.000Z', '', true, 123].map((promoEndsAt) => ({ promoActive: true, promoPrice: 40, promoEndsAt })),
  ];
  for (const promotion of invalidPromotions) {
    const item = mapCatalogPage(payload([product(promotion)]), input, now).items[0];
    assert.equal(item.price, 60);
    assert.equal(item.originalPrice, null);
  }
});

test('catalog images allow safe HTTPS and frontend paths without resolving relative assets against the API origin', () => {
  for (const image of ['https://images.example/product.jpg?width=200', '/products/eucalipto.jpg', '/products/can%C3%A9la.jpg']) {
    assert.equal(mapCatalogPage(payload([product({ image })]), input).items[0].image, image);
  }
  for (const image of [null, undefined, 123, {}, '', 'http://images.example/product.jpg',
    'javascript:alert(1)', 'data:image/png;base64,abc', '//images.example/product.jpg',
    'products/eucalipto.jpg', '/products/../private.jpg', '/products/%2e%2e/private.jpg',
    '/products/%252e%252e/private.jpg', '/%2fimages.example/product.jpg',
    '/products/a%0A.jpg', '/products/a\\b.jpg', '/products/a.jpg?version=2',
    'https://user:password@images.example/a.jpg', 'https://user@images.example/a.jpg',
    'https://images.example/a.jpg\n', 'https://images.example/a%0D%0A.jpg']) {
    const page = mapCatalogPage(payload([product({ image })]), input);
    assert.equal(page.items[0].image, null);
    assert.equal(page.items[0].name, 'Eucalipto');
  }
});

test('catalog translates HTTP failures without leaking server messages or creating an authentication requirement', async () => {
  for (const [status, kind] of [[400, 'unknown'], [401, 'unknown'], [403, 'unknown'],
    [429, 'unknown'], [500, 'server'], [503, 'server']]) {
    const repo = repository(async () => jsonResponse({ message: 'private server credentials and diagnostics' }, status));
    await assert.rejects(repo.list(input), (error) => {
      isCatalogError(kind)(error);
      assert.ok(!error.message.includes('private'));
      assert.ok(!error.message.includes('Inicia sesión'));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test('catalog rejects successful responses without valid JSON data, including 204', async () => {
  for (const [body, contentType] of [['<html/>', 'text/html'], ['{', 'application/json']]) {
    await assert.rejects(repository(async () => new Response(body, { headers: { 'content-type': contentType } })).list(input),
      isCatalogError('invalid-response'));
  }
  await assert.rejects(repository(async () => new Response(null, { status: 204 })).list(input), isCatalogError('invalid-response'));
});

test('catalog network errors remain domain errors and do not retry automatically', async () => {
  let attempts = 0;
  const repo = repository(async () => { attempts++; throw new TypeError('private network diagnostic'); });
  await assert.rejects(repo.list(input), isCatalogError('network'));
  assert.equal(attempts, 1);
});

test('catalog timeout aborts the request and does not retry automatically', async () => {
  let attempts = 0;
  let requestSignal;
  const repo = repository((_url, options) => {
    attempts++;
    requestSignal = options.signal;
    return new Promise(() => {});
  }, { requestTimeoutMs: 15 });
  await assert.rejects(repo.list(input), isCatalogError('timeout'));
  assert.equal(attempts, 1);
  assert.equal(requestSignal.aborted, true);
});

test('catalog cancellation reaches the transport and pre-cancelled requests do not fetch', async () => {
  const controller = new AbortController();
  let attempts = 0;
  let requestSignal;
  const repo = repository((_url, options) => {
    attempts++;
    requestSignal = options.signal;
    return new Promise(() => {});
  });
  const pending = repo.list(input, { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, isCatalogError('cancelled'));
  assert.equal(requestSignal.aborted, true);
  await assert.rejects(repo.list(input, { signal: controller.signal }), isCatalogError('cancelled'));
  assert.equal(attempts, 1);
});

test('catalog cross-origin results remain invalid responses instead of becoming products', async () => {
  const repo = repository(async () => {
    const response = jsonResponse(payload());
    Object.defineProperty(response, 'url', { value: 'https://unexpected.example/api/products' });
    return response;
  });
  await assert.rejects(repo.list(input), isCatalogError('invalid-response'));
});

test('catalog hides unexpected client errors and maps invalid requests to product-level configuration errors', async () => {
  for (const [failure, kind] of [
    [new ApiError('private invalid request', 'invalid-request'), 'configuration'],
    [new Error('private infrastructure diagnostic'), 'unknown'],
  ]) {
    const repo = new ApiCatalogRepository({ request: async () => { throw failure; } });
    await assert.rejects(repo.list(input), (error) => {
      isCatalogError(kind)(error);
      assert.ok(!error.message.includes('private'));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});
