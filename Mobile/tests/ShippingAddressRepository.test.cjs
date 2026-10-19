const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiError } = require('../src/core/network/ApiError.ts');
const { ShippingAddressError } = require('../src/features/shippingAddresses/domain/errors/ShippingAddressError.ts');
const { ApiShippingAddressRepository } = require('../src/features/shippingAddresses/data/repositories/ApiShippingAddressRepository.ts');

const id = '507f1f77bcf86cd799439011';
const otherId = '507f1f77bcf86cd799439012';
const draft = { label: 'Casa', recipientName: 'María López', phone: '7712345678', street: 'Calle Principal',
  exteriorNumber: '10', interiorNumber: '', neighborhood: 'Centro', municipality: 'Pachuca',
  state: 'Hidalgo', postalCode: '06000', references: '', isDefault: false };
const address = (overrides = {}) => ({ id, ...draft, isDefault: true, ...overrides });
const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});
const repository = (fetch, options = {}) => new ApiShippingAddressRepository(new HttpClient({
  baseUrl: 'https://api.example/api', fetch, getAccessToken: () => 'private.jwt.token', ...options,
}));
const isAddressError = (kind) => (error) => {
  assert.ok(error instanceof ShippingAddressError);
  assert.equal(error.kind, kind);
  return true;
};
const methods = ['list', 'create', 'update', 'select', 'remove'];
function call(repo, method, options) {
  if (method === 'list') return repo.list(options);
  if (method === 'create') return repo.create(draft, options);
  if (method === 'update') return repo.update(id, draft, options);
  return repo[method](id, options);
}

test('shipping GET authenticates, preserves order, normalizes IDs and projects only address fields', async () => {
  let received;
  const repo = repository(async (url, options) => {
    received = { url, options };
    return jsonResponse([address({ id: otherId, isDefault: false, userId: 'private account', accessToken: 'private' }),
      address({ id: id.toUpperCase(), passwordHash: 'private password' })]);
  });
  const result = await repo.list();
  assert.equal(received.url, 'https://api.example/api/addresses');
  assert.equal(received.options.method, 'GET');
  assert.equal(received.options.headers.Authorization, 'Bearer private.jwt.token');
  assert.equal(received.options.credentials, 'omit');
  assert.equal(received.options.body, undefined);
  assert.deepEqual(result, [address({ id: otherId, isDefault: false }), address()]);
  assert.equal(JSON.stringify(result).includes('private'), false);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result[0]), true);
});

test('shipping accepts empty lists, up to five plausible addresses and omitted optional text', async () => {
  assert.deepEqual(await repository(async () => jsonResponse([])).list(), []);
  const five = Array.from({ length: 5 }, (_, index) => address({ id: `507f1f77bcf86cd79943901${index}`,
    isDefault: false, interiorNumber: undefined, references: undefined }));
  const result = await repository(async () => jsonResponse(five)).list();
  assert.equal(result.length, 5);
  assert.equal(result[0].interiorNumber, '');
  assert.equal(result[0].references, '');
  assert.equal(result.some((entry) => entry.isDefault), false, 'legacy lists with no default remain displayable');
});

test('shipping rejects malformed envelopes, incomplete addresses, duplicate IDs, excess addresses and multiple defaults', async () => {
  const malformed = [null, {}, { items: [] }, { addresses: [] }, [null], [address({ id: undefined })],
    [address({ id: 'preview-home' })], [address({ id: `${id}\n` })], [address({ id: id.slice(1) })],
    [address({ isDefault: undefined })], [address({ isDefault: 'true' })], [address({ phone: 'invalid' })],
    [address({ postalCode: '123456' })], [address({ label: 'A' })], [address({ street: ' Calle Principal ' })],
    [address({ interiorNumber: null })], [address({ references: 'x'.repeat(301) })],
    [address(), address({ id: id.toUpperCase(), isDefault: false })], [address(), address({ id: otherId })],
    Array.from({ length: 6 }, (_, index) => address({ id: `507f1f77bcf86cd79943901${index}`, isDefault: false }))];
  for (const payload of malformed) {
    await assert.rejects(repository(async () => jsonResponse(payload)).list(), (error) => {
      isAddressError('invalid-response')(error);
      assert.equal(error.cause, undefined);
      return true;
    });
  }
  for (const field of ['recipientName', 'phone', 'street', 'exteriorNumber', 'neighborhood', 'municipality', 'state', 'postalCode']) {
    await assert.rejects(repository(async () => jsonResponse([address({ [field]: undefined })])).list(), isAddressError('invalid-response'));
  }
});

test('shipping POST sends only normalized address fields and accepts the first address becoming default', async () => {
  let received;
  const repo = repository(async (url, options) => { received = { url, options }; return jsonResponse([address()], 201); });
  const input = Object.freeze({ ...draft, label: ' Casa ', street: ' Calle Principal ', postalCode: ' 06000 ',
    id: 'another-address', userId: 'private account', accessToken: 'private', role: 'admin', $set: { email: 'private' } });
  assert.deepEqual(await repo.create(input), [address()]);
  assert.equal(received.url, 'https://api.example/api/addresses');
  assert.equal(received.options.method, 'POST');
  assert.equal(received.options.headers.Authorization, 'Bearer private.jwt.token');
  assert.equal(received.options.credentials, 'omit');
  assert.deepEqual(JSON.parse(received.options.body), draft);
  assert.equal(input.label, ' Casa ');
});

test('shipping POST verifies every submitted field and requested selection in the returned collection', async () => {
  for (const field of Object.keys(draft).filter((field) => field !== 'isDefault')) {
    const change = field === 'phone' ? '7712345679' : field === 'postalCode' ? '06001' : 'Different';
    await assert.rejects(repository(async () => jsonResponse([address({ [field]: change })])).create(draft),
      isAddressError('invalid-response'));
  }
  await assert.rejects(repository(async () => jsonResponse([])).create(draft), isAddressError('invalid-response'));
  await assert.rejects(repository(async () => jsonResponse([address({ isDefault: false })])).create({ ...draft, isDefault: true }),
    isAddressError('invalid-response'));
  await assert.rejects(repository(async () => jsonResponse([address(), address({ id: otherId, label: 'Trabajo', isDefault: false })])).create(draft),
    isAddressError('invalid-response'));
  const two = [address({ label: 'Trabajo' }), address({ id: otherId, isDefault: false })];
  assert.deepEqual(await repository(async () => jsonResponse(two)).create(draft), two);
});

test('shipping PATCH sends the full allowlisted draft to the normalized ID and permits false default being ignored', async () => {
  let received;
  const repo = repository(async (url, options) => { received = { url, options }; return jsonResponse([address()]); });
  assert.deepEqual(await repo.update(id.toUpperCase(), { ...draft, userId: 'private', label: ' Casa ' }), [address()]);
  assert.equal(received.url, `https://api.example/api/addresses/${id}`);
  assert.equal(received.options.method, 'PATCH');
  assert.equal(received.options.headers.Authorization, 'Bearer private.jwt.token');
  assert.deepEqual(JSON.parse(received.options.body), draft);
  for (const response of [[], [address({ id: otherId })], [address({ label: 'Changed' })], [address({ phone: '7712345679' })]]) {
    await assert.rejects(repository(async () => jsonResponse(response)).update(id, draft), isAddressError('invalid-response'));
  }
  await assert.rejects(repository(async () => jsonResponse([address({ isDefault: false })])).update(id, { ...draft, isDefault: true }),
    isAddressError('invalid-response'));
});

test('shipping select sends only isDefault true and confirms the requested principal address', async () => {
  let received;
  const repo = repository(async (url, options) => { received = { url, options }; return jsonResponse([address()]); });
  assert.deepEqual(await repo.select(id.toUpperCase()), [address()]);
  assert.equal(received.url, `https://api.example/api/addresses/${id}`);
  assert.equal(received.options.method, 'PATCH');
  assert.equal(received.options.headers.Authorization, 'Bearer private.jwt.token');
  assert.deepEqual(JSON.parse(received.options.body), { isDefault: true });
  for (const response of [[], [address({ isDefault: false })], [address({ id: otherId })]]) {
    await assert.rejects(repository(async () => jsonResponse(response)).select(id), isAddressError('invalid-response'));
  }
});

test('shipping DELETE sends no body, confirms absence and accepts backend promotion of another address', async () => {
  let received;
  const remaining = address({ id: otherId, label: 'Trabajo' });
  const repo = repository(async (url, options) => { received = { url, options }; return jsonResponse([remaining]); });
  assert.deepEqual(await repo.remove(id.toUpperCase()), [remaining]);
  assert.equal(received.url, `https://api.example/api/addresses/${id}`);
  assert.equal(received.options.method, 'DELETE');
  assert.equal(received.options.headers.Authorization, 'Bearer private.jwt.token');
  assert.equal(received.options.body, undefined);
  assert.deepEqual(await repository(async () => jsonResponse([])).remove(id), []);
  await assert.rejects(repository(async () => jsonResponse([address()])).remove(id), isAddressError('invalid-response'));
});

test('shipping invalid mutations fail before token reads or fetches even when called directly', async () => {
  let requests = 0, tokenReads = 0;
  const repo = repository(async () => { requests++; return jsonResponse([address()]); },
    { getAccessToken: () => { tokenReads++; return 'private.jwt.token'; } });
  for (const candidate of [null, undefined, 1, [], {}, '', 'preview-home', ` ${id}`, `${id}\n`,
    `${id}/other`, `${id}?userId=other`, 'z'.repeat(24)]) {
    await assert.rejects(repo.update(candidate, draft), isAddressError('validation'));
    await assert.rejects(repo.select(candidate), isAddressError('validation'));
    await assert.rejects(repo.remove(candidate), isAddressError('validation'));
  }
  for (const candidate of [null, {}, { ...draft, phone: '+527712345678' }, { ...draft, references: 'A'.repeat(301) }]) {
    await assert.rejects(repo.create(candidate), isAddressError('validation'));
    await assert.rejects(repo.update(id, candidate), isAddressError('validation'));
  }
  assert.equal(requests, 0);
  assert.equal(tokenReads, 0);
});

test('shipping maps HTTP errors to safe domain failures and recognizes the exact backend five-address limit', async () => {
  for (const [status, kind] of [[400, 'validation'], [401, 'unauthorized'], [403, 'server'], [404, 'not-found'],
    [422, 'validation'], [429, 'server'], [500, 'server'], [503, 'server']]) {
    for (const method of methods) {
      let attempts = 0;
      const repo = repository(async () => { attempts++; return jsonResponse({
        message: ['private address and phone', 'Authorization: Bearer private'], fieldErrors: { street: 'private' },
      }, status); });
      await assert.rejects(call(repo, method), (error) => {
        isAddressError(kind)(error);
        assert.equal(error.cause, undefined);
        assert.equal(error.fieldErrors, undefined);
        assert.equal(error.message.includes('private'), false);
        return true;
      });
      assert.equal(attempts, 1);
    }
  }
  await assert.rejects(repository(async () => jsonResponse({ message: 'Solo puedes guardar hasta 5 direcciones' }, 400)).create(draft),
    isAddressError('limit'));
  await assert.rejects(repository(async () => jsonResponse({ message: 'Solo puedes guardar hasta 5 direcciones private street' }, 400)).create(draft),
    isAddressError('validation'));
});

test('shipping rejects malformed JSON, non-JSON, empty 204 and unexpected response origins for every operation', async () => {
  for (const method of methods) {
    for (const response of [new Response('{', { headers: { 'content-type': 'application/json' } }),
      new Response('<html/>', { headers: { 'content-type': 'text/html' } }), new Response(null, { status: 204 })]) {
      await assert.rejects(call(repository(async () => response), method), isAddressError('invalid-response'));
    }
    const repo = repository(async () => {
      const response = jsonResponse(method === 'remove' ? [] : [address()]);
      Object.defineProperty(response, 'url', { value: 'https://unexpected.example/api/addresses' });
      return response;
    });
    await assert.rejects(call(repo, method), isAddressError('invalid-response'));
  }
});

test('shipping network failures never expose private diagnostics or retry uncertain writes', async () => {
  for (const method of methods) {
    let attempts = 0;
    const repo = repository(async () => { attempts++; throw new Error('private postal address diagnostic'); });
    await assert.rejects(call(repo, method), (error) => {
      isAddressError('network')(error);
      assert.equal(error.cause, undefined);
      assert.equal(error.message.includes('private'), false);
      return true;
    });
    assert.equal(attempts, 1);
  }
});

test('shipping timeout aborts all five operations without automatic retries', async () => {
  for (const method of methods) {
    let attempts = 0, signal;
    const repo = repository((_url, options) => { attempts++; signal = options.signal; return new Promise(() => {}); },
      { requestTimeoutMs: 15 });
    await assert.rejects(call(repo, method), isAddressError('timeout'));
    assert.equal(signal.aborted, true);
    assert.equal(attempts, 1);
  }
});

test('shipping cancellation reaches in-flight HTTP and pre-cancelled calls never fetch', async () => {
  for (const method of methods) {
    let started, attempts = 0, signal;
    const ready = new Promise((resolve) => { started = resolve; });
    const repo = repository((_url, options) => { attempts++; signal = options.signal; started(); return new Promise(() => {}); });
    const controller = new AbortController();
    const pending = call(repo, method, { signal: controller.signal });
    await ready;
    controller.abort();
    await assert.rejects(pending, isAddressError('cancelled'));
    assert.equal(signal.aborted, true);
    await assert.rejects(call(repo, method, { signal: controller.signal }), isAddressError('cancelled'));
    assert.equal(attempts, 1);
  }
});

test('shipping discards late injected client successes and failures after cancellation', async () => {
  for (const method of methods) {
    for (const shouldFail of [false, true]) {
      let finish, fail;
      const repo = new ApiShippingAddressRepository({ request: () => new Promise((resolve, reject) => { finish = resolve; fail = reject; }) });
      const controller = new AbortController();
      const pending = call(repo, method, { signal: controller.signal });
      controller.abort();
      if (shouldFail) fail(new Error('private late diagnostics'));
      else finish(method === 'remove' ? [] : [address()]);
      await assert.rejects(pending, isAddressError('cancelled'));
    }
  }
});

test('shipping maps configuration and unknown failures safely while preserving existing domain errors', async () => {
  for (const [failure, kind] of [[new ApiError('private configuration', 'invalid-request'), 'configuration'],
    [new Error('private implementation diagnostics'), 'unknown'], [null, 'unknown']]) {
    for (const method of methods) {
      const repo = new ApiShippingAddressRepository({ request: async () => { throw failure; } });
      await assert.rejects(call(repo, method), (error) => {
        isAddressError(kind)(error);
        assert.equal(error.cause, undefined);
        assert.equal(error.message.includes('private'), false);
        return true;
      });
    }
  }
  const failure = new ShippingAddressError('Aviso seguro.', 'limit');
  const repo = new ApiShippingAddressRepository({ request: async () => { throw failure; } });
  await assert.rejects(repo.create(draft), (error) => error === failure);
});
