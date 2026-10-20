const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiError } = require('../src/core/network/ApiError.ts');

const jsonResponse = (payload, status = 200) => new Response(JSON.stringify(payload), {
  status, headers: { 'content-type': 'application/json; charset=utf-8' },
});
const client = (options = {}) => new HttpClient({ baseUrl: 'https://api.example/api', ...options });
const isError = (kind, status = null) => (error) => {
  assert.ok(error instanceof ApiError);
  assert.equal(error.kind, kind);
  assert.equal(error.status, status);
  return true;
};

test('idempotency option only adds its bounded transport header to POST', async () => {
  const calls = [];
  const api = client({ fetch: async (_url, options) => { calls.push(options); return jsonResponse({ ok: true }); } });
  const key = 'mobile-order-test-key-123';
  await api.request('/orders/confirm', { method: 'POST', body: { items: [] }, idempotencyKey: key });
  await api.request('/orders/draft/preview', { method: 'POST', body: { items: [] } });
  assert.equal(calls[0].headers['Idempotency-Key'], key);
  assert.equal(calls[1].headers['Idempotency-Key'], undefined);
  assert.equal(calls[0].headers['Content-Type'], 'application/json');
});

test('idempotency option rejects malformed keys and non-POST requests before token or fetch access', async () => {
  let reads = 0; let calls = 0;
  const api = client({ getAccessToken: () => { reads++; return 'token'; }, fetch: async () => { calls++; return jsonResponse({}); } });
  for (const key of ['', 'short', ' key-with-valid-length-123 ', 'bad\r\nHeader: key-123', 'a'.repeat(101), null, 1234]) {
    await assert.rejects(api.request('/orders/confirm', { method: 'POST', idempotencyKey: key }), isError('invalid-request'));
  }
  for (const method of ['GET', 'PUT', 'PATCH', 'DELETE', undefined]) {
    await assert.rejects(api.request('/orders/confirm', { method, idempotencyKey: 'a'.repeat(16) }), isError('invalid-request'));
  }
  assert.equal(reads, 0); assert.equal(calls, 0);
});

test('JSON requests use injected fetch, current bearer token and an adapter parser', async () => {
  let token = 'first-token';
  const calls = [];
  const api = client({ getAccessToken: () => token, fetch: async (url, options) => {
    calls.push({ url, options });
    return jsonResponse({ id: 7 });
  } });
  const result = await api.request('/products', {
    method: 'POST', body: { name: 'INHALEX' }, parse: (payload) => payload.id,
  });
  token = 'second-token';
  await api.request('/products');
  assert.equal(result, 7);
  assert.equal(calls[0].url, 'https://api.example/api/products');
  assert.equal(calls[0].options.headers.Authorization, 'Bearer first-token');
  assert.equal(calls[1].options.headers.Authorization, 'Bearer second-token');
  assert.equal(calls[0].options.headers['Content-Type'], 'application/json');
  assert.equal(calls[0].options.body, JSON.stringify({ name: 'INHALEX' }));
  // This checks the requested option, not its enforcement by a native runtime.
  assert.equal(calls[0].options.redirect, 'error');
  assert.equal(calls[0].options.credentials, 'omit');
});

test('public requests omit authorization and do not invoke the token provider', async () => {
  const api = client({ getAccessToken: () => { throw new Error('Must not be called'); },
    fetch: async (_url, options) => {
      assert.equal(options.headers.Authorization, undefined);
      assert.equal(options.headers['Content-Type'], undefined);
      return jsonResponse([]);
    } });
  assert.deepEqual(await api.request('/products', { authenticated: false }), []);
});

test('a transport that followed a cross-origin redirect has its received result rejected', async () => {
  let requestedAuthorization;
  const response = jsonResponse({ id: 7 });
  Object.defineProperties(response, {
    url: { value: 'https://other.example/products' },
    redirected: { value: true },
  });
  const api = client({ getAccessToken: () => 'test-token', fetch: async (_url, options) => {
    requestedAuthorization = options.headers.Authorization;
    return response;
  } });
  await assert.rejects(api.request('/products'), isError('invalid-response', 200));
  // Rejection is after fetch, so this guard makes no claim about preventing prior token delivery.
  assert.equal(requestedAuthorization, 'Bearer test-token');
});

test('response URL metadata accepts the configured origin and rejects downgrade or malformed origins', async () => {
  const responseFor = (url) => {
    const response = jsonResponse({ id: 7 });
    Object.defineProperty(response, 'url', { value: url });
    return response;
  };
  const sameOrigin = client({ fetch: async () => responseFor('https://api.example/api/products?page=2') });
  assert.deepEqual(await sameOrigin.request('/products'), { id: 7 });
  for (const url of ['http://api.example/api/products', 'https://api.example:8443/api/products', 'not-a-url']) {
    const api = client({ fetch: async () => responseFor(url) });
    await assert.rejects(api.request('/products'), isError('invalid-response', 200));
  }
});

test('absolute or traversing request paths are rejected before reading a token or making a request', async () => {
  let calls = 0;
  const api = client({ getAccessToken: () => { calls++; return 'token'; }, fetch: async () => {
    calls++; return jsonResponse({});
  } });
  for (const path of ['https://evil.example', '//evil.example/products', '/../outside',
    '/%2e%2e/outside', '/%2f%2fevil.example', '/products\\evil', '/products#fragment']) {
    await assert.rejects(api.request(path), isError('invalid-request'));
  }
  assert.equal(calls, 0);
});

test('401, 403 and 500 preserve status and provide readable messages even with an HTML response', async () => {
  const expected = new Map([[401, /sesión/], [403, /permiso/], [500, /más tarde/]]);
  for (const [status, message] of expected) {
    const api = client({ fetch: async () => new Response('<html>error</html>', {
      status, headers: { 'content-type': 'text/html' },
    }) });
    await assert.rejects(api.request('/products'), (error) => {
      isError('http', status)(error);
      assert.match(error.message, message);
      assert.equal(error.isUnauthorized, status === 401);
      assert.equal(error.isForbidden, status === 403);
      return true;
    });
  }
});

test('validation errors retain useful API messages and malformed error JSON still retains its status', async () => {
  const api = client({ fetch: async () => jsonResponse({ message: ['Nombre requerido', 'Precio inválido'] }, 400) });
  await assert.rejects(api.request('/products'), (error) => {
    isError('http', 400)(error);
    assert.equal(error.message, 'Nombre requerido. Precio inválido');
    return true;
  });
  const invalid = client({ fetch: async () => new Response('{', {
    status: 403, headers: { 'content-type': 'application/json' },
  }) });
  await assert.rejects(invalid.request('/products'), isError('http', 403));
});

test('successful non-JSON, malformed JSON and DTO validation failures are classified as invalid responses', async () => {
  for (const [body, contentType] of [['<html/>', 'text/html'], ['{', 'application/json']]) {
    const api = client({ fetch: async () => new Response(body, { headers: { 'content-type': contentType } }) });
    await assert.rejects(api.request('/products'), isError('invalid-response', 200));
  }
  const api = client({ fetch: async () => jsonResponse({ wrong: true }) });
  await assert.rejects(api.request('/products', { parse: () => { throw new Error('Invalid DTO'); } }),
    isError('invalid-response', 200));
});

test('204 has no JSON body and network failures are distinct from HTTP failures', async () => {
  assert.equal(await client({ fetch: async () => new Response(null, { status: 204 }) }).request('/products'), undefined);
  await assert.rejects(client({ fetch: async () => { throw new TypeError('Network error'); } }).request('/products'),
    isError('network'));
});

test('timeout aborts even if an injected transport does not implement cancellation', async () => {
  let signal;
  const api = client({ requestTimeoutMs: 15, fetch: (_url, options) => {
    signal = options.signal;
    return new Promise(() => {});
  } });
  await assert.rejects(api.request('/products'), isError('timeout'));
  assert.equal(signal.aborted, true);
});

test('timeout also bounds an asynchronous token provider', async () => {
  let fetched = false;
  const api = client({ requestTimeoutMs: 15, getAccessToken: () => new Promise(() => {}),
    fetch: async () => { fetched = true; return jsonResponse({}); } });
  await assert.rejects(api.request('/products'), isError('timeout'));
  assert.equal(fetched, false);
});

test('timeout remains active while reading the response body', async () => {
  const response = jsonResponse({});
  response.json = () => new Promise(() => {});
  const api = client({ requestTimeoutMs: 15, fetch: async () => response });
  await assert.rejects(api.request('/products'), isError('timeout'));
});

test('caller cancellation aborts in-flight requests and pre-cancelled requests never read tokens', async () => {
  const cancellation = new AbortController();
  const api = client({ fetch: () => new Promise(() => {}) });
  const request = api.request('/products', { signal: cancellation.signal });
  cancellation.abort();
  await assert.rejects(request, isError('cancelled'));
  const preCancelled = client({ getAccessToken: () => { throw new Error('Must not be called'); } });
  await assert.rejects(preCancelled.request('/products', { signal: cancellation.signal }), isError('cancelled'));
});

test('invalid JSON request bodies and header-injection tokens fail without performing fetch', async () => {
  let calls = 0;
  const fetch = async () => { calls++; return jsonResponse({}); };
  await assert.rejects(client({ fetch }).request('/products', { method: 'POST', body: 1n }), isError('invalid-request'));
  await assert.rejects(client({ fetch }).request('/products', { body: {} }), isError('invalid-request'));
  await assert.rejects(client({ fetch, getAccessToken: () => 'token\r\nInjected: value' }).request('/products'),
    isError('invalid-request'));
  assert.equal(calls, 0);
});
