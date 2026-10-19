const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiError } = require('../src/core/network/ApiError.ts');
const { ProfileError } = require('../src/features/profile/domain/errors/ProfileError.ts');
const { ApiProfileRepository } = require('../src/features/profile/data/repositories/ApiProfileRepository.ts');

const id = '507f1f77bcf86cd799439011';
const draft = { firstName: 'María José', lastName: "D'Ávila", phone: '7712345678' };
const dto = (overrides = {}) => ({ _id: id, name: "María José D'Ávila", ...draft,
  email: 'maria@example.test', ...overrides });
const jsonResponse = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});
const repository = (fetch, options = {}) => new ApiProfileRepository(new HttpClient({
  baseUrl: 'https://api.example/api', fetch, getAccessToken: () => 'private.jwt.token', ...options,
}));
const isProfileError = (kind) => (error) => {
  assert.ok(error instanceof ProfileError);
  assert.equal(error.kind, kind);
  return true;
};
const call = (repo, method, options) => method === 'get' ? repo.get(options) : repo.update(draft, options);

test('profile GET authenticates without body, user identifiers or cookies and exposes only public profile fields', async () => {
  let call;
  const repo = repository(async (url, options) => {
    call = { url, options };
    return jsonResponse(dto({ _id: id.toUpperCase(), role: 'admin', status: 'active', accessToken: 'private response token',
      passwordHash: 'private password', shippingAddresses: [{ street: 'private street' }], cartItems: ['private cart'] }));
  });
  const profile = await repo.get();
  assert.equal(call.url, 'https://api.example/api/auth/me');
  assert.equal(call.options.method, 'GET');
  assert.equal(call.options.headers.Authorization, 'Bearer private.jwt.token');
  assert.equal(call.options.credentials, 'omit');
  assert.equal(call.options.body, undefined);
  assert.deepEqual(profile, { id, ...draft, email: 'maria@example.test' });
  assert.equal(JSON.stringify(profile).includes('private'), false);
  assert.equal(Object.isFrozen(profile), true);
});

test('profile reads legacy nonempty strings for display while new edit rules remain strict', async () => {
  const profile = await repository(async () => jsonResponse(dto({ firstName: 'A', lastName: '--', phone: '1' }))).get();
  assert.equal(profile.firstName, 'A');
  assert.equal(profile.lastName, '--');
  assert.equal(profile.phone, '1');
});

test('profile requires a flat response, a full ObjectId and nonempty string fields', async () => {
  for (const value of [null, [], {}, { user: dto() }, { data: dto() }, dto({ _id: undefined }), dto({ _id: 'account' }),
    dto({ _id: `${id}\n` }), dto({ _id: id.slice(1) }), dto({ _id: { $oid: id } }), dto({ firstName: '' }),
    dto({ lastName: '  ' }), dto({ email: null }), dto({ phone: 7712345678 })]) {
    await assert.rejects(repository(async () => jsonResponse(value)).get(), (error) => {
      isProfileError('invalid-response')(error);
      assert.equal(error.cause, undefined);
      return true;
    });
  }
});

test('profile PATCH sends only normalized editable fields and returns the confirmed public profile', async () => {
  let call;
  const repo = repository(async (url, options) => {
    call = { url, options };
    return jsonResponse(dto({ passwordHash: 'private', role: 'admin' }));
  });
  const input = Object.freeze({ firstName: '  María   José  ', lastName: " D'Ávila ", phone: ' 7712345678 ',
    _id: 'another-user', userId: 'another-user', email: 'other@example.test', role: 'admin', password: 'private', accessToken: 'private' });
  const profile = await repo.update(input);
  assert.equal(call.url, 'https://api.example/api/auth/me');
  assert.equal(call.options.method, 'PATCH');
  assert.equal(call.options.headers.Authorization, 'Bearer private.jwt.token');
  assert.equal(call.options.headers['Content-Type'], 'application/json');
  assert.equal(call.options.credentials, 'omit');
  assert.deepEqual(JSON.parse(call.options.body), draft);
  assert.deepEqual(profile, { id, ...draft, email: 'maria@example.test' });
  assert.equal(input.firstName, '  María   José  ');
});

test('profile invalid edits never read a token or reach transport even when the adapter is called directly', async () => {
  let requests = 0, tokenReads = 0;
  const repo = repository(async () => { requests++; return jsonResponse(dto()); },
    { getAccessToken: () => { tokenReads++; return 'private.jwt.token'; } });
  for (const value of [null, {}, { ...draft, firstName: 'A' }, { ...draft, lastName: '--' },
    { ...draft, phone: '+52 7712345678' }, { ...draft, firstName: 'A'.repeat(50), lastName: 'B'.repeat(50) }]) {
    await assert.rejects(repo.update(value), (error) => {
      isProfileError('validation')(error);
      assert.ok(Object.keys(error.fieldErrors).length > 0);
      return true;
    });
  }
  assert.equal(requests, 0);
  assert.equal(tokenReads, 0);
});

test('profile PATCH requires all edited fields to match server confirmation and leaves account matching to the controller', async () => {
  for (const overrides of [{ firstName: 'Another' }, { lastName: 'Different' }, { phone: '7712345679' },
    { phone: ' 7712345678 ' }, { firstName: undefined }]) {
    await assert.rejects(repository(async () => jsonResponse(dto(overrides))).update(draft), isProfileError('invalid-response'));
  }
  const anotherId = '507f1f77bcf86cd799439012';
  const profile = await repository(async () => jsonResponse(dto({ _id: anotherId }))).update(draft);
  assert.equal(profile.id, anotherId, 'the session controller receives the identity to check against its authenticated user');
});

test('profile HTTP failures use safe domain errors and never expose backend validation text or retry writes', async () => {
  for (const [status, kind] of [[400, 'validation'], [401, 'unauthorized'], [403, 'server'], [404, 'unknown'],
    [422, 'validation'], [429, 'server'], [500, 'server'], [503, 'server']]) {
    for (const method of ['get', 'update']) {
      let attempts = 0;
      const repo = repository(async () => { attempts++; return jsonResponse({
        message: ['private profile details', 'Authorization: Bearer private'], fieldErrors: { role: 'private' },
      }, status); });
      await assert.rejects(call(repo, method), (error) => {
        isProfileError(kind)(error);
        assert.equal(error.fieldErrors, undefined);
        assert.equal(error.cause, undefined);
        assert.ok(!error.message.includes('private'));
        return true;
      });
      assert.equal(attempts, 1);
    }
  }
});

test('profile rejects malformed JSON, non-JSON, 204 success and responses from unexpected origins', async () => {
  for (const method of ['get', 'update']) {
    for (const response of [new Response('{', { headers: { 'content-type': 'application/json' } }),
      new Response('<html/>', { headers: { 'content-type': 'text/html' } }), new Response(null, { status: 204 })]) {
      await assert.rejects(call(repository(async () => response), method), isProfileError('invalid-response'));
    }
    const repo = repository(async () => {
      const response = jsonResponse(dto());
      Object.defineProperty(response, 'url', { value: 'https://unexpected.example/api/auth/me' });
      return response;
    });
    await assert.rejects(call(repo, method), isProfileError('invalid-response'));
  }
});

test('profile network diagnostics remain private and uncertain edits are not retried automatically', async () => {
  for (const method of ['get', 'update']) {
    let attempts = 0;
    const repo = repository(async () => { attempts++; throw new Error('private transport details'); });
    await assert.rejects(call(repo, method), (error) => {
      isProfileError('network')(error);
      assert.equal(error.cause, undefined);
      assert.ok(!error.message.includes('private'));
      return true;
    });
    assert.equal(attempts, 1);
  }
});

test('profile timeouts abort transport without retrying either operation', async () => {
  for (const method of ['get', 'update']) {
    let signal, attempts = 0;
    const repo = repository((_url, options) => { signal = options.signal; attempts++; return new Promise(() => {}); },
      { requestTimeoutMs: 15 });
    await assert.rejects(call(repo, method), isProfileError('timeout'));
    assert.equal(signal.aborted, true);
    assert.equal(attempts, 1);
  }
});

test('profile cancellation reaches in-flight HTTP and pre-cancelled operations do not fetch', async () => {
  for (const method of ['get', 'update']) {
    let started, signal, attempts = 0;
    const ready = new Promise((resolve) => { started = resolve; });
    const repo = repository((_url, options) => {
      signal = options.signal; attempts++; started(); return new Promise(() => {});
    });
    const controller = new AbortController();
    const pending = call(repo, method, { signal: controller.signal });
    await ready;
    controller.abort();
    await assert.rejects(pending, isProfileError('cancelled'));
    assert.equal(signal.aborted, true);
    await assert.rejects(call(repo, method, { signal: controller.signal }), isProfileError('cancelled'));
    assert.equal(attempts, 1);
  }
});

test('profile discards late injected client successes and failures after cancellation', async () => {
  for (const method of ['get', 'update']) {
    for (const shouldFail of [false, true]) {
      let finish, fail;
      const repo = new ApiProfileRepository({ request: () => new Promise((resolve, reject) => { finish = resolve; fail = reject; }) });
      const controller = new AbortController();
      const pending = call(repo, method, { signal: controller.signal });
      controller.abort();
      if (shouldFail) fail(new Error('private late diagnostic'));
      else finish(dto());
      await assert.rejects(pending, isProfileError('cancelled'));
    }
  }
});

test('profile sanitizes unexpected client and configuration errors without retaining causes', async () => {
  for (const [failure, kind] of [[new ApiError('private configuration', 'invalid-request'), 'configuration'],
    [new Error('private implementation details'), 'unknown'], [null, 'unknown']]) {
    for (const method of ['get', 'update']) {
      const repo = new ApiProfileRepository({ request: async () => { throw failure; } });
      await assert.rejects(call(repo, method), (error) => {
        isProfileError(kind)(error);
        assert.equal(error.cause, undefined);
        assert.ok(!error.message.includes('private'));
        return true;
      });
    }
  }
});
