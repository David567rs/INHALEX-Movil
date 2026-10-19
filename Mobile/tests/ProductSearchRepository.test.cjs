const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiError } = require('../src/core/network/ApiError.ts');
const { ProductSearchError } = require('../src/features/productSearch/domain/errors/ProductSearchError.ts');
const { ApiProductSearchRepository } = require('../src/features/productSearch/data/repositories/ApiProductSearchRepository.ts');

const input = { term: 'Eucalipto', page: 1, limit: 20 };
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
const repository = (fetch, options = {}) => new ApiProductSearchRepository(new HttpClient({
  baseUrl: 'https://api.example/api', fetch, ...options,
}));
const isSearchError = (kind) => (error) => {
  assert.ok(error instanceof ProductSearchError);
  assert.equal(error.kind, kind);
  return true;
};

test('search sends public paginated GET requests without session, cookies or body and exposes only catalog fields', async () => {
  let call;
  const repo = repository(async (url, options) => {
    call = { url, options };
    return jsonResponse(payload([product({ rawMaterialName: 'private', cost: 2, stockReserved: 9 })], { secret: 'private' }));
  }, { getAccessToken: () => { throw new Error('A public search must not read a session'); } });
  const result = await repo.search(input);
  assert.equal(call.url, 'https://api.example/api/products?page=1&limit=20&search=Eucalipto');
  assert.equal(call.options.method, 'GET');
  assert.equal(call.options.body, undefined);
  assert.equal(call.options.credentials, 'omit');
  assert.equal(call.options.headers.Authorization, undefined);
  assert.deepEqual(result, {
    items: [{ id: '507f1f77bcf86cd799439011', name: 'Eucalipto', description: 'Un aroma fresco y herbal.',
      aromas: ['eucalipto', 'herbal'], price: 60, currency: 'MXN', image: '/products/eucalipto.jpg',
      inStock: true, originalPrice: null }], total: 1, page: 1, limit: 20, totalPages: 1,
  });
  assert.ok(!JSON.stringify(result).includes('private'));
  assert.equal(Object.hasOwn(result.items[0], 'cost'), false);
  assert.equal(Object.hasOwn(result.items[0], 'stockReserved'), false);
});

test('search escapes regexp syntax before encoding URL values, preserving brackets, punctuation, ampersand, hash and Unicode literally', async () => {
  const term = '[aroma].* & # Té';
  let sentUrl;
  const repo = repository(async (url) => { sentUrl = url; return jsonResponse(payload([])); });
  await repo.search({ ...input, term });
  const url = new URL(sentUrl);
  assert.equal(url.pathname, '/api/products');
  assert.deepEqual([...url.searchParams.keys()], ['page', 'limit', 'search']);
  assert.equal(url.searchParams.get('search'), String.raw`\[aroma\]\.\* & # Té`);
  assert.equal(url.hash, '');
  assert.ok(sentUrl.includes('%26') && sentUrl.includes('%23') && sentUrl.includes('%C3%A9'));
  const serverPattern = new RegExp(url.searchParams.get('search'), 'i');
  assert.equal(serverPattern.test(term), true);
  assert.equal(serverPattern.test('aroma with unrelated products'), false);
});

test('all regular-expression metacharacters are literal while ordinary words and internal spaces remain unchanged', async () => {
  const terms = ['.*', '(', ')', '[', ']', '{', '}', '^', '$', '+', '?', '|', '\\', 'eucalipto  limón'];
  for (const term of terms) {
    let query;
    const repo = repository(async (url) => { query = new URL(url).searchParams.get('search'); return jsonResponse(payload([])); });
    await repo.search({ ...input, term });
    const exactPattern = new RegExp(`^(?:${query})$`, 'i');
    assert.equal(exactPattern.test(term), true, term);
    assert.equal(exactPattern.test('unrelated-product'), false, term);
    if (term === 'eucalipto  limón') assert.equal(query, term);
  }
});

test('search forwards the same term on later pages and validates metadata against requested pagination', async () => {
  const calls = [];
  const repo = repository(async (url) => {
    calls.push(url);
    return jsonResponse(payload([product()], { total: 3, page: 2, limit: 2, totalPages: 2 }));
  });
  const result = await repo.search({ term: 'Eucalipto', page: 2, limit: 2 });
  assert.equal(calls[0], 'https://api.example/api/products?page=2&limit=2&search=Eucalipto');
  assert.equal(result.page, 2);
  assert.equal(result.total, 3);
  assert.equal(result.items.length, 1);
});

test('search accepts no matches as a successful empty page without fabricating preview products', async () => {
  assert.deepEqual(await repository(async () => jsonResponse(payload([]))).search(input), {
    items: [], total: 0, page: 1, limit: 20, totalPages: 1,
  });
});

test('search maps malformed pages, inconsistent metadata and invalid required products to its own invalid-response error', async () => {
  for (const body of [null, [], {}, payload([], { total: 1 }), payload(undefined, { page: 2 }),
    payload(undefined, { limit: 10 }), payload(undefined, { totalPages: 2 }),
    payload([product({ price: '60' })]), payload([product({ currency: 'ZZZ' })]),
    payload([product({ inStock: 'false' })]), payload([product(), product()])]) {
    await assert.rejects(repository(async () => jsonResponse(body)).search(input), (error) => {
      isSearchError('invalid-response')(error);
      assert.ok(error.message.includes('búsqueda'));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test('search sanitizes HTTP failures without exposing raw server text or requiring login for public products', async () => {
  for (const [status, kind] of [[400, 'unknown'], [401, 'unknown'], [403, 'unknown'],
    [429, 'unknown'], [500, 'server'], [503, 'server']]) {
    const repo = repository(async () => jsonResponse({ message: 'private credentials and diagnostics' }, status));
    await assert.rejects(repo.search(input), (error) => {
      isSearchError(kind)(error);
      assert.ok(!error.message.includes('private'));
      assert.ok(!error.message.includes('Inicia sesión'));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test('search rejects malformed JSON, non-JSON success, empty 204 and unexpected response origins', async () => {
  for (const response of [new Response('{', { headers: { 'content-type': 'application/json' } }),
    new Response('<html/>', { headers: { 'content-type': 'text/html' } }), new Response(null, { status: 204 })]) {
    await assert.rejects(repository(async () => response).search(input), isSearchError('invalid-response'));
  }
  const repo = repository(async () => {
    const response = jsonResponse(payload());
    Object.defineProperty(response, 'url', { value: 'https://unexpected.example/api/products' });
    return response;
  });
  await assert.rejects(repo.search(input), isSearchError('invalid-response'));
});

test('search turns network diagnostics into a safe domain failure and never retries automatically', async () => {
  let attempts = 0;
  const repo = repository(async () => { attempts++; throw new TypeError('private network details'); });
  await assert.rejects(repo.search(input), (error) => {
    isSearchError('network')(error);
    assert.ok(!error.message.includes('private'));
    assert.equal(error.cause, undefined);
    return true;
  });
  assert.equal(attempts, 1);
});

test('search timeout aborts the transport without silently retrying', async () => {
  let attempts = 0;
  let signal;
  const repo = repository((_url, options) => { attempts++; signal = options.signal; return new Promise(() => {}); },
    { requestTimeoutMs: 15 });
  await assert.rejects(repo.search(input), isSearchError('timeout'));
  assert.equal(attempts, 1);
  assert.equal(signal.aborted, true);
});

test('search cancellation reaches an in-flight transport and pre-cancelled requests never fetch', async () => {
  let attempts = 0;
  let signal;
  const controller = new AbortController();
  const repo = repository((_url, options) => { attempts++; signal = options.signal; return new Promise(() => {}); });
  const pending = repo.search(input, { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, isSearchError('cancelled'));
  assert.equal(signal.aborted, true);
  await assert.rejects(repo.search(input, { signal: controller.signal }), isSearchError('cancelled'));
  assert.equal(attempts, 1);
});

test('search sanitizes unexpected client errors and maps invalid request configuration without retaining transport causes', async () => {
  for (const [failure, kind] of [[new ApiError('private bad configuration', 'invalid-request'), 'configuration'],
    [new Error('private internal failure'), 'unknown']]) {
    const repo = new ApiProductSearchRepository({ request: async () => { throw failure; } });
    await assert.rejects(repo.search(input), (error) => {
      isSearchError(kind)(error);
      assert.ok(!error.message.includes('private'));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});
