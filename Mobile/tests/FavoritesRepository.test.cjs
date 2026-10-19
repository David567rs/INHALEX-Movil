const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiError } = require('../src/core/network/ApiError.ts');
const { FavoritesError } = require('../src/features/favorites/domain/errors/FavoritesError.ts');
const { ApiFavoritesRepository } = require('../src/features/favorites/data/repositories/ApiFavoritesRepository.ts');

const id = '507f1f77bcf86cd799439011';
const secondId = '507f1f77bcf86cd799439012';
const product = (overrides = {}) => ({
  _id: id, name: 'Lavanda', description: 'Un aroma floral y relajante.',
  price: 60, currency: 'MXN', image: '/products/lavanda.jpg',
  aromas: ['lavanda', 'floral'], inStock: true, ...overrides,
});
const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});
const repository = (fetch, options = {}) => new ApiFavoritesRepository(new HttpClient({
  baseUrl: 'https://api.example/api', fetch, getAccessToken: () => 'private.jwt.token', ...options,
}));
const isFavoritesError = (kind) => (error) => {
  assert.ok(error instanceof FavoritesError);
  assert.equal(error.kind, kind);
  return true;
};
function operation(repo, method, options) {
  return method === 'list' ? repo.list(options) : repo[method](id, options);
}

test('favorites list uses authenticated GET, preserves API order and exposes only public catalog fields', async () => {
  let call;
  const repo = repository(async (url, options) => {
    call = { url, options };
    return jsonResponse([product({ _id: secondId, name: 'Menta', inStock: false,
      rawMaterialName: 'private inventory', stockReserved: 9 }), product()]);
  });
  const result = await repo.list();
  assert.equal(call.url, 'https://api.example/api/favorites');
  assert.equal(call.options.method, 'GET');
  assert.equal(call.options.headers.Authorization, 'Bearer private.jwt.token');
  assert.equal(call.options.credentials, 'omit');
  assert.equal(call.options.body, undefined);
  assert.deepEqual(result.map((value) => value.id), [secondId, id]);
  assert.equal(result[0].inStock, false);
  assert.deepEqual(result[1], { id, name: 'Lavanda', description: 'Un aroma floral y relajante.',
    price: 60, currency: 'MXN', image: '/products/lavanda.jpg', aromas: ['lavanda', 'floral'],
    inStock: true, originalPrice: null });
  assert.ok(!JSON.stringify(result).includes('private'));
  assert.equal(Object.hasOwn(result[0], 'stockReserved'), false);
});

test('favorites list accepts the bare empty array without inventing samples', async () => {
  assert.deepEqual(await repository(async () => jsonResponse([])).list(), []);
});

test('favorites reuse current catalog promotions and safe image handling', async () => {
  const result = await repository(async () => jsonResponse([product({
    promoActive: true, promoPrice: 40, promoEndsAt: '2999-01-01T00:00:00.000Z',
    image: 'javascript:private',
  })])).list();
  assert.equal(result[0].price, 40);
  assert.equal(result[0].originalPrice, 60);
  assert.equal(result[0].image, null);
});

test('favorites reject envelopes, malformed products, invalid ObjectIds and duplicate product identities', async () => {
  for (const payload of [null, {}, { items: [] }, 'private', [null], [product({ _id: 'lavanda' })],
    [product({ _id: `${id}\n` })], [product({ _id: id.slice(1) })], [product({ price: '60' })],
    [product({ currency: 'ZZZ' })], [product({ aromas: [null] })], [product({ inStock: 'true' })],
    [product(), product()], [product(), product({ _id: id.toUpperCase() })]]) {
    await assert.rejects(repository(async () => jsonResponse(payload)).list(), (error) => {
      isFavoritesError('invalid-response')(error);
      assert.ok(error.message.includes('favoritos'));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test('favorites normalize valid hexadecimal list identities for membership comparisons', async () => {
  const result = await repository(async () => jsonResponse([product({ _id: id.toUpperCase() })])).list();
  assert.equal(result[0].id, id);
});

test('favorites use idempotent authenticated PUT and DELETE without sending user IDs, cookies or body', async () => {
  const calls = [];
  const repo = repository(async (url, options) => {
    calls.push({ url, options });
    return jsonResponse({ productId: id });
  });
  assert.equal(await repo.add(id.toUpperCase()), undefined);
  assert.equal(await repo.remove(id), undefined);
  assert.deepEqual(calls.map((call) => call.options.method), ['PUT', 'DELETE']);
  for (const { url, options } of calls) {
    assert.equal(url, `https://api.example/api/favorites/${id}`);
    assert.equal(options.headers.Authorization, 'Bearer private.jwt.token');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.body, undefined);
  }
});

test('favorites validate acknowledgements against the requested canonical product identity', async () => {
  for (const method of ['add', 'remove']) {
    for (const payload of [null, [], {}, { id }, { productId: secondId },
      { productId: 'lavanda' }, { productId: 1 }, { productId: `${id} ` }]) {
      await assert.rejects(operation(repository(async () => jsonResponse(payload)), method),
        isFavoritesError('invalid-response'));
    }
    const repo = repository(async () => jsonResponse({ productId: id.toUpperCase(), internal: 'private' }));
    assert.equal(await operation(repo, method), undefined);
  }
});

test('favorites reject invalid mutation IDs before reading a token or fetching', async () => {
  let requests = 0;
  let tokenReads = 0;
  const repo = repository(async () => { requests++; return jsonResponse({ productId: id }); },
    { getAccessToken: () => { tokenReads++; return 'private.jwt.token'; } });
  for (const candidate of [null, undefined, {}, [], 1, '', 'lavanda', ` ${id}`, `${id}\n`,
    `${id}/other`, `${id}?userId=other`, 'z'.repeat(24)]) {
    await assert.rejects(repo.add(candidate), isFavoritesError('invalid-request'));
    await assert.rejects(repo.remove(candidate), isFavoritesError('invalid-request'));
  }
  assert.equal(requests, 0);
  assert.equal(tokenReads, 0);
});

test('favorites map HTTP failures into safe domain messages without raw backend text or retrying', async () => {
  for (const [status, kind] of [[400, 'invalid-request'], [401, 'unauthorized'], [403, 'server'],
    [404, 'not-found'], [422, 'invalid-request'], [429, 'server'], [500, 'server'], [503, 'server']]) {
    for (const method of ['list', 'add', 'remove']) {
      let attempts = 0;
      const repo = repository(async () => { attempts++; return jsonResponse({ message: 'private backend diagnostic' }, status); });
      await assert.rejects(operation(repo, method), (error) => {
        isFavoritesError(kind)(error);
        assert.ok(!error.message.includes('private'));
        assert.equal(error.cause, undefined);
        return true;
      });
      assert.equal(attempts, 1);
    }
  }
});

test('favorites reject non-JSON, malformed JSON, 204 responses and unexpected origins for every operation', async () => {
  for (const method of ['list', 'add', 'remove']) {
    for (const response of [new Response('{', { headers: { 'content-type': 'application/json' } }),
      new Response('<html/>', { headers: { 'content-type': 'text/html' } }), new Response(null, { status: 204 })]) {
      await assert.rejects(operation(repository(async () => response), method), isFavoritesError('invalid-response'));
    }
    const repo = repository(async () => {
      const response = jsonResponse(method === 'list' ? [] : { productId: id });
      Object.defineProperty(response, 'url', { value: 'https://unexpected.example/api/favorites' });
      return response;
    });
    await assert.rejects(operation(repo, method), isFavoritesError('invalid-response'));
  }
});

test('favorites hide network diagnostics and never retry an uncertain write automatically', async () => {
  for (const method of ['list', 'add', 'remove']) {
    let attempts = 0;
    const repo = repository(async () => { attempts++; throw new Error('private transport diagnostic'); });
    await assert.rejects(operation(repo, method), (error) => {
      isFavoritesError('network')(error);
      assert.ok(!error.message.includes('private'));
      assert.equal(error.cause, undefined);
      return true;
    });
    assert.equal(attempts, 1);
  }
});

test('favorites timeouts abort each operation and do not retry', async () => {
  for (const method of ['list', 'add', 'remove']) {
    let attempts = 0;
    let signal;
    const repo = repository((_url, options) => { attempts++; signal = options.signal; return new Promise(() => {}); },
      { requestTimeoutMs: 15 });
    await assert.rejects(operation(repo, method), isFavoritesError('timeout'));
    assert.equal(signal.aborted, true);
    assert.equal(attempts, 1);
  }
});

test('favorites cancellation aborts transport while pre-cancelled requests do not fetch', async () => {
  for (const method of ['list', 'add', 'remove']) {
    let attempts = 0;
    let signal;
    let started;
    const ready = new Promise((resolve) => { started = resolve; });
    const repo = repository((_url, options) => {
      attempts++; signal = options.signal; started(); return new Promise(() => {});
    });
    const controller = new AbortController();
    const pending = operation(repo, method, { signal: controller.signal });
    await ready;
    controller.abort();
    await assert.rejects(pending, isFavoritesError('cancelled'));
    assert.equal(signal.aborted, true);
    await assert.rejects(operation(repo, method, { signal: controller.signal }), isFavoritesError('cancelled'));
    assert.equal(attempts, 1);
  }
});

test('favorites discard late client success and failure when an injected transport ignores cancellation', async () => {
  for (const method of ['list', 'add', 'remove']) {
    for (const shouldFail of [false, true]) {
      let finish;
      let fail;
      const repo = new ApiFavoritesRepository({ request: () => new Promise((resolve, reject) => { finish = resolve; fail = reject; }) });
      const controller = new AbortController();
      const pending = operation(repo, method, { signal: controller.signal });
      controller.abort();
      if (shouldFail) fail(new Error('private late diagnostic'));
      else finish(method === 'list' ? [] : { productId: id });
      await assert.rejects(pending, isFavoritesError('cancelled'));
    }
  }
});

test('favorites convert invalid transport configuration and unexpected errors without retaining causes', async () => {
  for (const [failure, kind] of [[new ApiError('private configuration', 'invalid-request'), 'configuration'],
    [new Error('private implementation diagnostic'), 'server'], ['private value', 'server']]) {
    for (const method of ['list', 'add', 'remove']) {
      const repo = new ApiFavoritesRepository({ request: async () => { throw failure; } });
      await assert.rejects(operation(repo, method), (error) => {
        isFavoritesError(kind)(error);
        assert.ok(!error.message.includes('private'));
        assert.equal(error.cause, undefined);
        return true;
      });
    }
  }
});
