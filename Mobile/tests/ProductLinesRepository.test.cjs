const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiError } = require('../src/core/network/ApiError.ts');
const { ProductLinesError } = require('../src/features/productLines/domain/errors/ProductLinesError.ts');
const { ApiProductLinesRepository } = require('../src/features/productLines/data/repositories/ApiProductLinesRepository.ts');
const { mapProductLines } = require('../src/features/productLines/data/mappers/mapProductLines.ts');
const { createListProductLines } = require('../src/features/productLines/domain/useCases/listProductLines.ts');

const line = (overrides = {}) => ({ id: 'linea-verde', name: 'Línea verde', count: 3, ...overrides });
const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});
const repository = (fetch, options = {}) => new ApiProductLinesRepository(new HttpClient({
  baseUrl: 'https://api.example/api', fetch, ...options,
}));
const isLinesError = (kind) => (error) => {
  assert.ok(error instanceof ProductLinesError);
  assert.equal(error.kind, kind);
  return true;
};

test('product lines use public GET categories without bearer, cookies or body and return only id/name/count', async () => {
  let call;
  const repo = repository(async (url, options) => {
    call = { url, options };
    return jsonResponse([line({ _id: 'internal-id', isActive: true, description: 'private internal copy', sortOrder: 2 })]);
  }, { getAccessToken: () => { throw new Error('A public category list must not read the session'); } });
  assert.deepEqual(await repo.list(), [line()]);
  assert.equal(call.url, 'https://api.example/api/products/categories');
  assert.equal(call.options.method, 'GET');
  assert.equal(call.options.body, undefined);
  assert.equal(call.options.headers.Authorization, undefined);
  assert.equal(call.options.credentials, 'omit');
});

test('product lines preserve dynamic names and server ordering, zero counts and more than five categories', async () => {
  const data = [
    line({ id: 'coleccion-nueva', name: 'Colección personalizada', count: 0 }),
    ...Array.from({ length: 6 }, (_, index) => line({ id: `categoria-${index}`, name: `Categoría ${index}`, count: index + 1 })),
  ];
  const result = await repository(async () => jsonResponse(data)).list();
  assert.deepEqual(result, data);
  assert.equal(result.length, 7);
  assert.equal(result[0].count, 0);
});

test('product lines accept an empty successful array without injecting preview taxonomy', async () => {
  assert.deepEqual(await repository(async () => jsonResponse([])).list(), []);
});

test('product lines reject nonarrays, wrapped data and malformed records without coercion', () => {
  for (const payload of [null, {}, { items: [line()] }, 'lines', 1, [null], [[]], [{}],
    [line({ id: '' })], [line({ id: ' ' })], [line({ id: 1 })], [line({ id: 'LINEA-VERDE' })],
    [line({ id: 'linea_verde' })], [line({ id: '../private' })], [line({ id: 'línea-verde' })],
    [line({ name: '' })], [line({ name: '   ' })], [line({ name: 7 })], [line({ name: null })],
    [line({ count: '3' })], [line({ count: false })], [line({ count: null })], [line({ count: undefined })],
    [line({ count: -1 })], [line({ count: 0.5 })], [line({ count: NaN })], [line({ count: Infinity })],
    [line({ count: Number.MAX_SAFE_INTEGER + 1 })]]) {
    assert.throws(() => mapProductLines(payload), isLinesError('invalid-response'));
  }
});

test('product lines reject duplicate IDs and copy fields without mutating the supplied array', () => {
  assert.throws(() => mapProductLines([line(), line({ name: 'Duplicate ID' })]), isLinesError('invalid-response'));
  const item = Object.freeze(line({ ignored: Object.freeze({ private: true }) }));
  const payload = Object.freeze([item]);
  const result = mapProductLines(payload);
  assert.deepEqual(result, [line()]);
  assert.notEqual(result, payload);
  assert.notEqual(result[0], item);
  assert.equal(Object.hasOwn(result[0], 'ignored'), false);
});

test('product lines retain edge hyphens accepted by the backend slug builder', () => {
  for (const id of ['nueva-linea', 'linea-2026', '-nueva-linea', 'nueva-linea-', '-']) {
    assert.equal(mapProductLines([line({ id })])[0].id, id);
  }
});

test('product line HTTP failures stay safe domain errors without server diagnostics or authentication prompts', async () => {
  for (const [status, kind] of [[400, 'unknown'], [401, 'unknown'], [403, 'unknown'],
    [429, 'unknown'], [500, 'server'], [503, 'server']]) {
    await assert.rejects(repository(async () => jsonResponse({ message: 'private stack credentials database' }, status)).list(), (error) => {
      isLinesError(kind)(error);
      assert.ok(!error.message.includes('private'));
      assert.ok(!error.message.includes('Inicia sesión'));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test('product lines reject HTML, malformed JSON and 204 instead of showing an empty success', async () => {
  for (const [body, contentType] of [['<html/>', 'text/html'], ['{', 'application/json']]) {
    await assert.rejects(repository(async () => new Response(body, { headers: { 'content-type': contentType } })).list(),
      isLinesError('invalid-response'));
  }
  await assert.rejects(repository(async () => new Response(null, { status: 204 })).list(), isLinesError('invalid-response'));
});

test('product line network failure does not retry automatically and a new call can recover', async () => {
  let attempts = 0;
  const repo = repository(async () => {
    if (++attempts === 1) throw new TypeError('private transport failure');
    return jsonResponse([line()]);
  });
  await assert.rejects(repo.list(), isLinesError('network'));
  assert.equal(attempts, 1);
  assert.deepEqual(await repo.list(), [line()]);
  assert.equal(attempts, 2);
});

test('product line timeout aborts a nonresponding transport without automatically retrying', async () => {
  let calls = 0;
  let signal;
  const repo = repository((_url, options) => {
    calls++;
    signal = options.signal;
    return new Promise(() => {});
  }, { requestTimeoutMs: 15 });
  await assert.rejects(repo.list(), isLinesError('timeout'));
  assert.equal(calls, 1);
  assert.equal(signal.aborted, true);
});

test('product line cancellation reaches HTTP and an already cancelled call never fetches', async () => {
  const controller = new AbortController();
  let calls = 0;
  let signal;
  const repo = repository((_url, options) => {
    calls++; signal = options.signal;
    return new Promise(() => {});
  });
  const pending = repo.list({ signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, isLinesError('cancelled'));
  assert.equal(signal.aborted, true);
  await assert.rejects(repo.list({ signal: controller.signal }), isLinesError('cancelled'));
  assert.equal(calls, 1);
});

test('product lines reject unexpected response origins before publishing category data', async () => {
  const repo = repository(async () => {
    const response = jsonResponse([line()]);
    Object.defineProperty(response, 'url', { value: 'https://other.example/api/products/categories' });
    return response;
  });
  await assert.rejects(repo.list(), isLinesError('invalid-response'));
});

test('product lines map client configuration errors and hide unexpected infrastructure errors', async () => {
  for (const [failure, kind] of [
    [new ApiError('private configuration detail', 'invalid-request'), 'configuration'],
    [new Error('private infrastructure detail'), 'unknown'],
  ]) {
    const repo = new ApiProductLinesRepository({ request: async () => { throw failure; } });
    await assert.rejects(repo.list(), (error) => {
      isLinesError(kind)(error);
      assert.ok(!error.message.includes('private'));
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test('product line use case forwards cancellation options and never calls an already cancelled repository', async () => {
  let calls = 0;
  let sentOptions;
  const data = [line()];
  const list = createListProductLines({ list: async (options) => { calls++; sentOptions = options; return data; } });
  const controller = new AbortController();
  const options = { signal: controller.signal };
  assert.equal(await list(options), data);
  assert.equal(sentOptions, options);
  controller.abort();
  await assert.rejects(list(options), isLinesError('cancelled'));
  assert.equal(calls, 1);
});

test('product line use case discards late success and failure when the repository ignores cancellation', async () => {
  for (const failure of [false, true]) {
    let finish;
    const list = createListProductLines({ list: () => new Promise((resolve, reject) => {
      finish = () => failure ? reject(new Error('private late failure')) : resolve([line()]);
    }) });
    const controller = new AbortController();
    const pending = list({ signal: controller.signal });
    controller.abort(); finish();
    await assert.rejects(pending, isLinesError('cancelled'));
  }
});

test('product line use case preserves domain errors and allows explicit retry without automatic retries', async () => {
  for (const kind of ['network', 'timeout', 'cancelled', 'server', 'invalid-response', 'configuration', 'unknown']) {
    let calls = 0;
    const failure = new ProductLinesError('Safe public message', kind);
    const list = createListProductLines({ list: async () => {
      if (++calls === 1) throw failure;
      return [];
    } });
    await assert.rejects(list(), (error) => error === failure);
    assert.equal(calls, 1);
    assert.deepEqual(await list(), []);
    assert.equal(calls, 2);
  }
});

test('product line use case hides unexpected repository internals without retaining their cause', async () => {
  const list = createListProductLines({ list: async () => { throw new Error('private repository detail'); } });
  await assert.rejects(list(), (error) => {
    isLinesError('unknown')(error);
    assert.ok(!error.message.includes('private'));
    assert.equal(error.cause, undefined);
    return true;
  });
});
