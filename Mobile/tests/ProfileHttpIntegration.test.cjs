const assert = require('node:assert/strict');
const http = require('node:http');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { createAuthSession } = require('../src/features/auth/domain/session/createAuthSession.ts');
const { ApiProfileRepository } = require('../src/features/profile/data/repositories/ApiProfileRepository.ts');
const { createProfileActions } = require('../src/features/profile/domain/useCases/profileActions.ts');
const { createProfileController } = require('../src/features/profile/presentation/state/createProfileController.ts');

function waitFor(controller, predicate) {
  if (predicate(controller.getSnapshot())) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { unsubscribe(); reject(new Error('Profile state did not settle')); }, 3000);
    const unsubscribe = controller.subscribe(() => {
      if (predicate(controller.getSnapshot())) { clearTimeout(timer); unsubscribe(); resolve(); }
    });
  });
}

test('profile crosses real HTTP with private Bearer, confirmed updates, ambiguous-write recovery and account isolation (simulated API/store)', async () => {
  const first = '507f1f77bcf86cd799439011';
  const second = '507f1f77bcf86cd799439012';
  const users = new Map([
    [first, { _id: first, firstName: 'Ana', lastName: 'Pérez', phone: '5512345678', email: 'ana@example.test' }],
    [second, { _id: second, firstName: 'Eva', lastName: 'Flores', phone: '5512345679', email: 'eva@example.test' }],
  ]);
  const requests = [];
  let failRead = false;
  let ambiguousWrite = false;
  let unauthorized = false;
  const server = http.createServer(async (request, response) => {
    response.setHeader('Content-Type', 'application/json');
    const send = (status, value) => { response.statusCode = status; response.end(JSON.stringify(value)); };
    try {
      const account = new Map([['Bearer test.first.signature', first], ['Bearer test.second.signature', second]]).get(request.headers.authorization);
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : undefined;
      requests.push({ method: request.method, path: request.url, account, body, cookie: request.headers.cookie });
      if (!account || unauthorized) return send(401, { message: 'private backend diagnostic' });
      if (request.url !== '/api/auth/me') return send(404, {});
      if (request.method === 'GET' && failRead) return send(503, { message: 'private backend diagnostic' });
      if (request.method === 'PATCH') {
        assert.deepEqual(Object.keys(body).sort(), ['firstName', 'lastName', 'phone']);
        users.set(account, { ...users.get(account), ...body });
        if (ambiguousWrite) { response.destroy(); return; }
      }
      return send(200, { ...users.get(account), role: 'admin', passwordHash: 'private hash', accessToken: 'private token' });
    } catch { if (!response.destroyed) send(500, { message: 'private backend diagnostic' }); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  let nextAccount = first;
  const publicUser = (id) => { const user = users.get(id); return { id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone }; };
  const runtime = createAuthSession(async () => ({ accessToken: nextAccount === first ? 'test.first.signature' : 'test.second.signature', user: publicUser(nextAccount) }),
    { get: async () => null, set: async () => {}, clear: async () => {} }, async () => publicUser(nextAccount));
  const repository = new ApiProfileRepository(new HttpClient({ baseUrl: `http://127.0.0.1:${server.address().port}/api`, isDevelopment: true,
    getAccessToken: runtime.getAccessToken, requestTimeoutMs: 1000 }));
  const controller = createProfileController(runtime.session, createProfileActions(repository), runtime.updatePublicUser);
  try {
    controller.start();
    await runtime.session.restore();
    assert.equal(requests.length, 0, 'anonymous preview never requests a private endpoint');
    await runtime.session.signIn({ email: 'ana@example.test', password: 'test-only' });
    await waitFor(controller, (state) => state.profile?.id === first);
    assert.deepEqual(Object.keys(controller.getSnapshot().profile).sort(), ['email', 'firstName', 'id', 'lastName', 'phone']);
    controller.beginEdit();
    controller.updateField('firstName', '  Ana   María  ');
    await controller.save();
    assert.equal(controller.getSnapshot().notice, 'Tus datos se guardaron correctamente.');
    assert.equal(controller.getSnapshot().profile.firstName, 'Ana María');
    assert.equal(runtime.session.getSnapshot().user.firstName, 'Ana María');
    assert.equal(runtime.getAccessToken(), 'test.first.signature');
    const reads = requests.filter((request) => request.method === 'GET').length;
    assert.equal(reads, 1, 'session publication after PATCH does not cause a recursive profile read');
    assert.deepEqual(requests[1].body, { firstName: 'Ana María', lastName: 'Pérez', phone: '5512345678' });
    assert.ok(requests.every((request) => request.cookie === undefined));

    failRead = true;
    await controller.refresh();
    assert.equal(controller.getSnapshot().profile.firstName, 'Ana María');
    assert.ok(!controller.getSnapshot().error.includes('private'));
    failRead = false;
    await controller.refresh();

    controller.beginEdit();
    controller.updateField('phone', '5511112222');
    ambiguousWrite = true;
    await controller.save();
    assert.equal(controller.getSnapshot().requiresRefresh, true);
    assert.equal(controller.getSnapshot().draft.phone, '5511112222');
    assert.equal(controller.getSnapshot().profile.phone, '5512345678');
    const writes = requests.filter((request) => request.method === 'PATCH').length;
    await controller.save();
    assert.equal(requests.filter((request) => request.method === 'PATCH').length, writes);
    ambiguousWrite = false;
    await controller.refresh();
    assert.equal(controller.getSnapshot().requiresRefresh, false);
    assert.equal(controller.getSnapshot().profile.phone, '5511112222', 'GET reconciles a write that committed before the response failed');
    assert.equal(controller.getSnapshot().draft.phone, '5511112222');

    unauthorized = true;
    await controller.refresh();
    assert.equal(controller.getSnapshot().status, 'session-expired');
    assert.equal(controller.getSnapshot().profile, null);
    assert.equal(controller.getSnapshot().draft, null);
    await runtime.session.signOut();
    unauthorized = false;
    nextAccount = second;
    await runtime.session.signIn({ email: 'eva@example.test', password: 'test-only' });
    await waitFor(controller, (state) => state.profile?.id === second);
    assert.equal(controller.getSnapshot().profile.firstName, 'Eva');
    assert.equal(controller.getSnapshot().notice, null);
    assert.equal(users.get(first).phone, '5511112222');
    assert.equal(users.get(second).phone, '5512345679');
    await runtime.session.signOut();
    assert.equal(controller.getSnapshot().profile, null);
    assert.equal(controller.getSnapshot().draft, null);
  } finally {
    controller.stop();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
