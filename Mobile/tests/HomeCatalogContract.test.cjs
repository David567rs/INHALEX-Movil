const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiCatalogRepository } = require('../src/features/catalog/data/repositories/ApiCatalogRepository.ts');
const { mapCatalogProduct } = require('../src/features/catalog/data/mappers/mapCatalogPage.ts');
const { createListCatalog } = require('../src/features/catalog/domain/useCases/listCatalog.ts');

const product = (overrides = {}) => ({ _id: 'product-1', name: 'Lavanda', description: 'Aroma floral',
  price: 60, currency: 'MXN', aromas: ['floral'], inStock: true, image: null, ...overrides });
const empty = { items: [], total: 0, page: 1, limit: 6, totalPages: 1 };
const json = (body) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });

test('home catalog combines normalized category and literal search in one public API request', async () => {
  let call;
  const repository = new ApiCatalogRepository(new HttpClient({ baseUrl: 'https://api.example/api',
    getAccessToken: () => { throw new Error('Public home cannot request credentials'); },
    fetch: async (url, options) => { call = { url, options }; return json(empty); } }));
  const input = Object.freeze({ page: 1, limit: 6, category: ' LINEA-FLORAL ', search: ' [Lavanda].* & # Té ' });
  await createListCatalog(repository)(input);
  const url = new URL(call.url);
  assert.equal(url.searchParams.get('category'), 'linea-floral');
  assert.equal(url.searchParams.get('search'), String.raw`\[Lavanda\]\.\* & # Té`);
  assert.equal(url.searchParams.get('limit'), '6');
  assert.equal(url.hash, '');
  assert.equal(call.options.method, 'GET');
  assert.equal(call.options.body, undefined);
  assert.equal(call.options.headers.Authorization, undefined);
  assert.equal(call.options.credentials, 'omit');
  const serverPattern = new RegExp(url.searchParams.get('search'), 'i');
  assert.equal(serverPattern.test('[Lavanda].* & # Té'), true);
  assert.equal(serverPattern.test('unrelated product'), false);
});

test('catalog optional search trims edges, preserves internal spacing, omits blanks and enforces 100 characters before transport', async () => {
  const calls = [];
  const list = createListCatalog({ list: async (input) => { calls.push(input); return empty; } });
  await list({ page: 1, limit: 6, search: '  Lavanda  limón  ' });
  assert.equal(calls.at(-1).search, 'Lavanda  limón');
  await list({ page: 1, limit: 6, search: '   ' });
  assert.deepEqual(calls.at(-1), { page: 1, limit: 6 });
  await list({ page: 1, limit: 6, search: 'a'.repeat(100) });
  const count = calls.length;
  for (const search of [null, 4, [], {}, 'a'.repeat(101)]) {
    await assert.rejects(list({ page: 1, limit: 6, search }), (error) => error.kind === 'configuration');
  }
  assert.equal(calls.length, count);
});

test('catalog API preserves all regexp metacharacters as literal terms with category filtering', async () => {
  for (const term of ['.*', '(', ')', '[', ']', '{', '}', '^', '$', '+', '?', '|', '\\']) {
    let query;
    const repo = new ApiCatalogRepository(new HttpClient({ baseUrl: 'https://api.example/api',
      fetch: async (url) => { query = new URL(url).searchParams; return json(empty); } }));
    await repo.list({ page: 1, limit: 6, category: 'linea-verde', search: term });
    assert.equal(query.get('category'), 'linea-verde');
    const pattern = new RegExp(`^(?:${query.get('search')})$`);
    assert.equal(pattern.test(term), true, term);
    assert.equal(pattern.test('unrelated'), false, term);
  }
});

test('combined search still validates every product belongs to the requested category', async () => {
  const repo = new ApiCatalogRepository(new HttpClient({ baseUrl: 'https://api.example/api',
    fetch: async () => json({ ...empty, items: [product({ category: 'linea-diferente' })], total: 1 }) }));
  await assert.rejects(repo.list({ page: 1, limit: 6, category: 'linea-verde', search: 'Lavanda' }),
    (error) => error.kind === 'invalid-response');
});

test('home category and presentation come only from valid DTO fields without fabricating metadata', () => {
  const base = mapCatalogProduct(product());
  assert.equal(Object.hasOwn(base, 'categoryId'), false);
  assert.equal(Object.hasOwn(base, 'presentation'), false);
  const valid = mapCatalogProduct(product({ category: 'linea-nueva', presentation: '  15 ml  ' }));
  assert.equal(valid.categoryId, 'linea-nueva');
  assert.equal(valid.presentation, '15 ml');
  for (const category of [null, '', 3, {}, 'INVALID', 'linea/x']) {
    assert.equal(Object.hasOwn(mapCatalogProduct(product({ category })), 'categoryId'), false);
  }
  for (const presentation of [null, '', '  ', 3, {}, []]) {
    assert.equal(Object.hasOwn(mapCatalogProduct(product({ presentation })), 'presentation'), false);
  }
});
