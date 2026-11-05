const assert = require('node:assert/strict');
const { test } = require('node:test');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiLoginRepository } = require('../src/features/auth/data/repositories/ApiLoginRepository.ts');
const { ApiSessionRepository } = require('../src/features/auth/data/repositories/ApiSessionRepository.ts');
const { ApiProfileRepository } = require('../src/features/profile/data/repositories/ApiProfileRepository.ts');
const { createLoginUser } = require('../src/features/auth/domain/useCases/loginUser.ts');
const { createVerifySession } = require('../src/features/auth/domain/useCases/verifySession.ts');
const { createAuthSession } = require('../src/features/auth/domain/session/createAuthSession.ts');
const { createProfileActions } = require('../src/features/profile/domain/useCases/profileActions.ts');
const { createProfileController } = require('../src/features/profile/presentation/state/createProfileController.ts');

const ID = '507f1f77bcf86cd799439011';
const TOKEN = 'test.session.signature';
const credentials = { email: 'legacy@example.test', password: 'test password' };
const legacy = () => ({ _id: ID, name: 'María José de la Cruz', email: credentials.email });
const publicLegacy = () => ({ id: ID, firstName: '', lastName: '', phone: '',
  email: credentials.email, displayName: 'María José de la Cruz' });
const completed = { firstName: 'María José', lastName: 'de la Cruz', phone: '5512345678' };
const json = (body) => new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } });
const client = (fetch, getAccessToken = () => TOKEN) => new HttpClient({
  baseUrl: 'https://api.example/api', fetch, getAccessToken,
});
const tick = () => new Promise((resolve) => setImmediate(resolve));

test('legacy account can log in without inventing split names or a phone, and private fields stay excluded', async () => {
  const repo = new ApiLoginRepository(client(async (_url, options) => {
    assert.equal(options.headers.Authorization, undefined);
    assert.deepEqual(JSON.parse(options.body), credentials);
    return json({ accessToken: TOKEN, user: { ...legacy(), passwordHash: 'private-hash', role: 'admin', internal: 'private' } });
  }));
  const session = await repo.login(credentials);
  assert.deepEqual(session, { accessToken: TOKEN, user: publicLegacy() });
  assert.equal(JSON.stringify(session.user).includes('private'), false);
  assert.equal(Object.hasOwn(session.user, 'role'), false);
});

test('legacy session verification and profile GET accept the same public shape with bearer authentication', async () => {
  const fetch = async (url, options) => {
    assert.equal(url, 'https://api.example/api/auth/me');
    assert.equal(options.method, 'GET');
    assert.equal(options.headers.Authorization, `Bearer ${TOKEN}`);
    return json({ ...legacy(), passwordHash: 'private-hash', accessToken: 'private-token' });
  };
  const sessionRepo = new ApiSessionRepository((candidate) => client(fetch, () => candidate));
  assert.deepEqual(await sessionRepo.verify(TOKEN), publicLegacy());
  const profile = await new ApiProfileRepository(client(fetch)).get();
  assert.deepEqual(profile, publicLegacy());
  assert.equal(Object.isFrozen(profile), true);
});

test('current complete accounts keep their original model and do not retain a stale legacy display name', async () => {
  const dto = { ...legacy(), name: 'Former account name', ...completed };
  const expected = { id: ID, email: credentials.email, ...completed };
  const login = await new ApiLoginRepository(client(async () => json({ accessToken: TOKEN, user: dto }))).login(credentials);
  const restored = await new ApiSessionRepository(() => client(async () => json(dto))).verify(TOKEN);
  const profile = await new ApiProfileRepository(client(async () => json(dto))).get();
  for (const user of [login.user, restored, profile]) assert.deepEqual(user, expected);
});

test('legacy compatibility still rejects missing identity, malformed fields, and incomplete accounts without a legacy name', async () => {
  const invalid = [
    {}, { ...legacy(), _id: '' }, { ...legacy(), _id: 12 }, { ...legacy(), _id: 'not-an-objectid' },
    { ...legacy(), email: '' }, { ...legacy(), email: null },
    { ...legacy(), name: undefined }, { ...legacy(), name: '  ' }, { ...legacy(), name: 12 },
  ];
  for (const field of ['firstName', 'lastName', 'phone']) {
    for (const value of [null, 12, '', ' \t ']) invalid.push({ ...legacy(), [field]: value });
  }
  for (const dto of invalid) {
    const failure = (error) => error.kind === 'invalid-response' && error.cause === undefined;
    await assert.rejects(new ApiLoginRepository(client(async () => json({ accessToken: TOKEN, user: dto }))).login(credentials), failure);
    await assert.rejects(new ApiSessionRepository(() => client(async () => json(dto))).verify(TOKEN), failure);
    await assert.rejects(new ApiProfileRepository(client(async () => json(dto))).get(), failure);
  }
});

test('legacy name never bypasses token validation or profile edit validation', async () => {
  for (const accessToken of ['', 'not-a-token', 'a.b', `${TOKEN}\r\nInjected: value`]) {
    await assert.rejects(new ApiLoginRepository(client(async () => json({ accessToken, user: legacy() }))).login(credentials),
      (error) => error.kind === 'invalid-response');
  }
  let writes = 0;
  const profile = new ApiProfileRepository(client(async () => { writes++; return json(legacy()); }));
  await assert.rejects(profile.update({ firstName: '', lastName: '', phone: '' }),
    (error) => error.kind === 'validation' && Object.keys(error.fieldErrors).length === 3);
  assert.equal(writes, 0);
});

test('legacy account survives reopening, can complete its profile, updates public account data, and signs out cleanly', async () => {
  let dto = legacy(), stored = null, writes = 0;
  const fetch = async (url, options) => {
    if (url.endsWith('/auth/login')) return json({ accessToken: TOKEN, user: dto });
    assert.equal(url, 'https://api.example/api/auth/me');
    assert.equal(options.headers.Authorization, `Bearer ${TOKEN}`);
    if (options.method === 'PATCH') {
      writes++;
      assert.deepEqual(JSON.parse(options.body), completed);
      dto = { ...legacy(), ...completed, name: `${completed.firstName} ${completed.lastName}` };
    }
    return json(dto);
  };
  const store = { get: async () => stored, set: async (value) => { stored = value; }, clear: async () => { stored = null; } };
  const makeRuntime = () => createAuthSession(
    createLoginUser(new ApiLoginRepository(client(fetch))), store,
    createVerifySession(new ApiSessionRepository((candidate) => client(fetch, () => candidate))),
  );
  const first = makeRuntime();
  await first.session.signIn(credentials);
  assert.deepEqual(first.session.getSnapshot().user, publicLegacy());
  assert.equal(stored, TOKEN);
  const reopened = makeRuntime();
  await reopened.session.restore();
  assert.equal(reopened.session.getSnapshot().status, 'authenticated');
  assert.deepEqual(reopened.session.getSnapshot().user, publicLegacy());
  assert.equal(JSON.stringify(reopened.session.getSnapshot()).includes(TOKEN), false);

  const profile = createProfileController(reopened.session,
    createProfileActions(new ApiProfileRepository(client(fetch, reopened.getAccessToken))), reopened.updatePublicUser);
  profile.start();
  try {
    await tick();
    assert.equal(profile.getSnapshot().status, 'ready');
    assert.deepEqual(profile.getSnapshot().profile, publicLegacy());
    profile.beginEdit();
    assert.deepEqual(profile.getSnapshot().draft, { firstName: '', lastName: '', phone: '' });
    await profile.save();
    assert.equal(writes, 0);
    assert.equal(Object.keys(profile.getSnapshot().fieldErrors).length, 3);
    for (const [field, value] of Object.entries(completed)) profile.updateField(field, value);
    await profile.save();
    await tick();
    assert.equal(writes, 1);
    const expected = { id: ID, email: credentials.email, ...completed };
    assert.deepEqual(profile.getSnapshot().profile, expected);
    assert.deepEqual(reopened.session.getSnapshot().user, expected);
    assert.equal(profile.getSnapshot().mode, 'summary');
    assert.equal(reopened.getAccessToken(), TOKEN);
    await profile.refresh();
    assert.deepEqual(profile.getSnapshot().profile, expected);
    await reopened.session.signOut();
    assert.equal(stored, null);
    assert.equal(reopened.session.getSnapshot().user, null);
    assert.equal(profile.getSnapshot().profile, null);
  } finally { profile.stop(); }
});
