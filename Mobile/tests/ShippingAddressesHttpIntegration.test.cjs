const assert = require('node:assert/strict');
const { Buffer } = require('node:buffer');
const http = require('node:http');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { createAuthSession } = require('../src/features/auth/domain/session/createAuthSession.ts');
const { ApiShippingAddressRepository } = require('../src/features/shippingAddresses/data/repositories/ApiShippingAddressRepository.ts');
const { ShippingAddressError } = require('../src/features/shippingAddresses/domain/errors/ShippingAddressError.ts');
const { createShippingAddressActions } = require('../src/features/shippingAddresses/domain/useCases/shippingAddressActions.ts');
const { createShippingAddressesController } = require('../src/features/shippingAddresses/presentation/state/createShippingAddressesController.ts');

const firstAccount = '507f1f77bcf86cd799439011';
const secondAccount = '507f1f77bcf86cd799439012';
const firstAddress = '507f1f77bcf86cd799439101';
const secondAccountAddress = '507f1f77bcf86cd799439201';
const textFields = ['label', 'recipientName', 'phone', 'street', 'exteriorNumber', 'interiorNumber',
  'neighborhood', 'municipality', 'state', 'postalCode', 'references'];
const publicFields = [...textFields, 'id', 'isDefault'].sort();
const draft = (overrides = {}) => ({
  label: 'Casa de prueba', recipientName: 'Ana Pérez', phone: '5512345678', street: 'Calle Ejemplo',
  exteriorNumber: '10', interiorNumber: '', neighborhood: 'Centro', municipality: 'Villa Ejemplo',
  state: 'Estado Ejemplo', postalCode: '01234', references: '', isDefault: false, ...overrides,
});
const deferred = () => {
  let resolve;
  const promise = new Promise((complete) => { resolve = complete; });
  return { promise, resolve };
};
const listen = (server) => new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(0, '127.0.0.1', () => { server.removeListener('error', reject); resolve(); });
});
async function close(server) {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
const apiUrl = (server) => `http://127.0.0.1:${server.address().port}/api`;
function waitFor(controller, predicate) {
  if (predicate(controller.getSnapshot())) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { unsubscribe(); reject(new Error('Shipping addresses state did not settle')); }, 3000);
    const unsubscribe = controller.subscribe(() => {
      if (predicate(controller.getSnapshot())) { clearTimeout(timer); unsubscribe(); resolve(); }
    });
  });
}
function fillDraft(controller, values) {
  for (const field of textFields) controller.updateField(field, values[field]);
}

test('shipping addresses cross real HTTP for full collections, private Bearer CRUD and uncertain-write recovery (simulated API/store)', async () => {
  const collections = new Map([
    [firstAccount, [{ id: firstAddress, ...draft({ isDefault: true, interiorNumber: '2', references: 'Portón azul' }) }]],
    [secondAccount, [{ id: secondAccountAddress, ...draft({ label: 'Otra cuenta', recipientName: 'Eva Flores', isDefault: true }) }]],
  ]);
  const requests = [];
  const fixtureErrors = [];
  let nextId = 0x102;
  let readStatus = 200;
  let ambiguousPatch = false;
  let unauthorized = false;
  const bearerAccounts = new Map([
    ['Bearer test.first.signature', firstAccount], ['Bearer test.second.signature', secondAccount],
  ]);
  // Match the public backend contract: plain arrays, with empty optional fields omitted.
  const responseAddresses = (account) => collections.get(account).map((address) => {
    const value = { ...address };
    if (!value.interiorNumber) delete value.interiorNumber;
    if (!value.references) delete value.references;
    return value;
  });
  const server = http.createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json');
    const send = (status, value) => { response.statusCode = status; response.end(JSON.stringify(value)); };
    try {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : undefined;
      const account = bearerAccounts.get(request.headers.authorization);
      requests.push({ method: request.method, path: request.url, body, account,
        authorization: request.headers.authorization, cookie: request.headers.cookie });
      if (!account || unauthorized) return send(401, { message: 'private auth diagnostic' });
      const collection = collections.get(account);
      if (request.url === '/api/addresses' && request.method === 'GET') {
        return readStatus === 200 ? send(200, responseAddresses(account))
          : send(readStatus, { message: 'private read diagnostic' });
      }
      if (request.url === '/api/addresses' && request.method === 'POST') {
        assert.deepEqual(Object.keys(body).sort(), [...textFields, 'isDefault'].sort());
        if (collection.length >= 5) return send(400, { message: 'Solo puedes guardar hasta 5 direcciones' });
        const isDefault = body.isDefault || collection.length === 0;
        if (isDefault) collection.forEach((address) => { address.isDefault = false; });
        const id = `507f1f77bcf86cd799439${(nextId++).toString(16).padStart(3, '0')}`;
        collection.push({ id, ...body, isDefault });
        return send(201, responseAddresses(account));
      }
      const match = /^\/api\/addresses\/([a-f\d]{24})$/.exec(request.url);
      if (!match) return send(404, { message: 'private route diagnostic' });
      const address = collection.find((item) => item.id === match[1]);
      if (!address) return send(404, { message: 'private missing address diagnostic' });
      if (request.method === 'PATCH') {
        assert.ok(Object.keys(body).every((key) => [...textFields, 'isDefault'].includes(key)));
        for (const field of textFields) {
          if (typeof body[field] === 'string') address[field] = body[field].trim();
        }
        if (body.isDefault) collection.forEach((item) => { item.isDefault = item.id === address.id; });
        if (ambiguousPatch) { response.destroy(); return; }
        return send(200, responseAddresses(account));
      }
      if (request.method === 'DELETE') {
        const remaining = collection.filter((item) => item.id !== address.id);
        if (address.isDefault && remaining.length && !remaining.some((item) => item.isDefault)) remaining[0].isDefault = true;
        collections.set(account, remaining);
        return send(200, responseAddresses(account));
      }
      return send(404, { message: 'private method diagnostic' });
    } catch (error) {
      fixtureErrors.push(error);
      if (!response.destroyed) send(500, { message: 'private fixture diagnostic' });
    }
  });
  await listen(server);
  let nextAccount = firstAccount;
  const user = (account) => ({ id: account, firstName: account === firstAccount ? 'Ana' : 'Eva',
    lastName: 'Prueba', email: account === firstAccount ? 'ana@example.test' : 'eva@example.test', phone: '5512345678' });
  const runtime = createAuthSession(async () => ({ user: user(nextAccount),
    accessToken: nextAccount === firstAccount ? 'test.first.signature' : 'test.second.signature' }),
  { get: async () => null, set: async () => {}, clear: async () => {} }, async () => user(nextAccount));
  const repository = new ApiShippingAddressRepository(new HttpClient({ baseUrl: apiUrl(server), isDevelopment: true,
    getAccessToken: runtime.getAccessToken, requestTimeoutMs: 1000 }));
  const controller = createShippingAddressesController(runtime.authorizationSession, createShippingAddressActions(repository));
  const countPatches = () => requests.filter((request) => request.method === 'PATCH').length;
  try {
    controller.start();
    await runtime.session.restore();
    assert.equal(controller.getSnapshot().status, 'anonymous');
    assert.equal(requests.length, 0, 'an anonymous session never requests private addresses');
    await runtime.session.signIn({ email: 'ana@example.test', password: 'test-only' });
    await waitFor(controller, (state) => state.addresses?.[0]?.id === firstAddress && !state.loading);
    assert.ok(Array.isArray(controller.getSnapshot().addresses));
    assert.deepEqual(Object.keys(controller.getSnapshot().addresses[0]).sort(), publicFields);

    controller.openCreate();
    const addedDraft = draft({ label: 'Trabajo de prueba' });
    fillDraft(controller, addedDraft);
    await controller.save();
    const addedId = controller.getSnapshot().addresses.find((address) => address.id !== firstAddress).id;
    assert.equal(controller.getSnapshot().addresses.length, 2, 'POST publishes the complete collection, including the existing row');
    assert.equal(controller.getSnapshot().confirmation, 'Tu dirección se guardó correctamente.');
    assert.equal(controller.getSnapshot().addresses.find((address) => address.id === addedId).postalCode, '01234');
    assert.deepEqual(requests.find((request) => request.method === 'POST').body, addedDraft);

    controller.openEdit(firstAddress);
    controller.updateField('phone', '5511112222');
    controller.updateField('interiorNumber', '');
    controller.updateField('references', '');
    await controller.save();
    const edited = controller.getSnapshot().addresses.find((address) => address.id === firstAddress);
    assert.equal(edited.phone, '5511112222');
    assert.equal(edited.interiorNumber, '', 'omitted optional response fields map back to empty form values');
    assert.equal(edited.references, '');
    assert.equal(Object.hasOwn(responseAddresses(firstAccount)[0], 'interiorNumber'), false);
    const editRequest = requests.find((request) => request.method === 'PATCH');
    assert.equal(editRequest.body.interiorNumber, '', 'empty optional edits are sent explicitly so the server can clear them');
    assert.equal(editRequest.body.references, '');

    await controller.select(addedId);
    assert.equal(controller.getSnapshot().addresses.filter((address) => address.isDefault).length, 1);
    assert.equal(controller.getSnapshot().addresses.find((address) => address.id === addedId).isDefault, true);
    assert.deepEqual(requests.at(-1).body, { isDefault: true });
    await controller.remove(addedId);
    assert.deepEqual(controller.getSnapshot().addresses.map((address) => address.id), [firstAddress]);
    assert.equal(controller.getSnapshot().addresses[0].isDefault, true, 'DELETE adopts the principal returned by the server');

    controller.openEdit(firstAddress);
    controller.updateField('label', 'Casa confirmada tras el corte');
    const beforeFailure = controller.getSnapshot().addresses;
    const patchesBeforeFailure = countPatches();
    ambiguousPatch = true;
    await controller.save();
    assert.equal(countPatches(), patchesBeforeFailure + 1);
    assert.equal(collections.get(firstAccount)[0].label, 'Casa confirmada tras el corte', 'simulated PATCH committed before destroying its response');
    assert.equal(controller.getSnapshot().addresses, beforeFailure);
    assert.equal(controller.getSnapshot().draft.label, 'Casa confirmada tras el corte');
    assert.equal(controller.getSnapshot().requiresRefresh, true);
    assert.ok(!controller.getSnapshot().message.includes('private'));
    const requestsAfterFailure = requests.length;
    await controller.save();
    assert.equal(requests.length, requestsAfterFailure, 'uncertain PATCH cannot be resubmitted before an explicit GET');

    controller.updateField('label', 'Borrador para revisar después');
    const retainedDraft = controller.getSnapshot().draft;
    ambiguousPatch = false;
    readStatus = 503;
    await controller.refresh();
    assert.equal(controller.getSnapshot().requiresRefresh, true);
    assert.equal(controller.getSnapshot().addresses, beforeFailure);
    assert.equal(controller.getSnapshot().draft, retainedDraft);
    readStatus = 200;
    await controller.refresh();
    assert.equal(controller.getSnapshot().requiresRefresh, false);
    assert.equal(controller.getSnapshot().addresses[0].label, 'Casa confirmada tras el corte');
    assert.equal(controller.getSnapshot().draft, retainedDraft, 'successful GET reconciles the list without replacing the draft under review');
    assert.equal(controller.getSnapshot().mode, 'edit');
    assert.equal(countPatches(), patchesBeforeFailure + 1, 'recovery never repeats PATCH automatically');
    controller.cancelForm();

    const beforeLogout = requests.length;
    const signingOut = runtime.session.signOut();
    assert.equal(controller.getSnapshot().status, 'anonymous');
    assert.equal(controller.getSnapshot().addresses, null, 'logout clears personal rows synchronously');
    assert.equal(controller.getSnapshot().draft, null);
    assert.equal(runtime.getAccessToken(), undefined);
    await signingOut;
    assert.equal(requests.length, beforeLogout, 'logout does not trigger a private HTTP request');

    nextAccount = secondAccount;
    await runtime.session.signIn({ email: 'eva@example.test', password: 'test-only' });
    await waitFor(controller, (state) => state.addresses?.[0]?.id === secondAccountAddress && !state.loading);
    assert.deepEqual(controller.getSnapshot().addresses.map((address) => address.id), [secondAccountAddress]);
    assert.equal(controller.getSnapshot().addresses[0].interiorNumber, '');
    assert.equal(collections.get(firstAccount)[0].label, 'Casa confirmada tras el corte');
    controller.openEdit(secondAccountAddress);
    controller.updateField('label', 'Borrador de otra cuenta');
    unauthorized = true;
    await controller.refresh();
    assert.equal(controller.getSnapshot().status, 'expired');
    assert.equal(controller.getSnapshot().addresses, null);
    assert.equal(controller.getSnapshot().draft, null);
    const requestsAfter401 = requests.length;
    unauthorized = false;
    await controller.refresh();
    await controller.save();
    assert.equal(requests.length, requestsAfter401, '401 blocks further reads and writes until a new login');
    await runtime.session.signIn({ email: 'eva@example.test', password: 'test-only' });
    await waitFor(controller, (state) => state.addresses?.[0]?.id === secondAccountAddress && !state.loading);
    assert.equal(requests.length, requestsAfter401 + 1, 'a new authenticated session enables a new private GET');

    assert.ok(requests.every((request) => request.cookie === undefined));
    assert.ok(requests.every((request) => request.authorization ===
      (request.account === firstAccount ? 'Bearer test.first.signature' : 'Bearer test.second.signature')));
    assert.ok(requests.every((request) => /^\/api\/addresses(?:\/[a-f\d]{24})?$/.test(request.path)));
    assert.ok(requests.filter((request) => ['GET', 'DELETE'].includes(request.method)).every((request) => request.body === undefined));
    assert.ok(requests.filter((request) => request.body).every((request) =>
      Object.keys(request.body).every((key) => [...textFields, 'isDefault'].includes(key))), 'no user ID, address ID or token is sent in payloads');
    assert.ok(!JSON.stringify(controller.getSnapshot()).includes('test.second.signature'));
    assert.ok(!JSON.stringify(runtime.session.getSnapshot()).includes('test.second.signature'));
    assert.deepEqual(fixtureErrors, []);
  } finally {
    controller.stop();
    await close(server);
  }
});

test('shipping address cancellation aborts real sockets for every action without retrying (simulated API)', async () => {
  let expectedRequest;
  let requestCount = 0;
  const server = http.createServer((request, response) => {
    const pending = expectedRequest;
    requestCount++;
    request.resume();
    response.once('close', pending.closed.resolve);
    pending.started.resolve();
    // Deliberately withhold the response; there is no backend or persistent store here.
  });
  await listen(server);
  const repository = new ApiShippingAddressRepository(new HttpClient({ baseUrl: apiUrl(server), isDevelopment: true,
    getAccessToken: () => 'test.first.signature', requestTimeoutMs: 1000 }));
  const actions = createShippingAddressActions(repository);
  try {
    for (const [index, action] of ['list', 'create', 'update', 'select', 'remove'].entries()) {
      expectedRequest = { started: deferred(), closed: deferred() };
      const signal = new AbortController();
      const options = { signal: signal.signal };
      const pending = action === 'list' ? actions.list(options)
        : action === 'create' ? actions.create(draft(), options)
          : action === 'update' ? actions.update(firstAddress, draft(), options)
            : actions[action](firstAddress, options);
      await Promise.all([
        assert.rejects(pending, (error) => {
          assert.ok(error instanceof ShippingAddressError);
          assert.equal(error.kind, 'cancelled');
          assert.ok(!error.message.includes('private'));
          return true;
        }),
        expectedRequest.started.promise.then(() => signal.abort()),
      ]);
      await expectedRequest.closed.promise;
      assert.equal(requestCount, index + 1, `${action} creates one request and never retries it`);
    }
  } finally {
    await close(server);
  }
});
