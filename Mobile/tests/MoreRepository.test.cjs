/* global __dirname */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { HttpClient } = require('../src/core/network/HttpClient.ts');
const { ApiMoreRepository } = require('../src/features/more/data/repositories/ApiMoreRepository.ts');
const { mapMoreContent } = require('../src/features/more/data/mappers/mapMoreContent.ts');
const { moreContent } = require('../src/features/more/data/content/moreContent.ts');
const { MORE_CONTENT_REVISION } = require('../src/features/more/data/content/moreContentVersion.ts');
const { createLoadMoreContent } = require('../src/features/more/domain/useCases/loadMoreContent.ts');
const envelope = () => ({ schemaVersion: 1, revision: MORE_CONTENT_REVISION, content: structuredClone(moreContent) });
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
function repository(fetch, timeout = 1_000) {
  const client = new HttpClient({ baseUrl: 'https://api.example/api', requestTimeoutMs: timeout, fetch,
    getAccessToken: () => { throw new Error('Public information must not read the session'); } });
  return new ApiMoreRepository(() => client);
}

test('More obtains versioned public data without credentials and preserves reviewed sections', async () => {
  let request;
  const repo = repository(async (url, options) => { request = { url, options }; return json(envelope()); });
  const result = await createLoadMoreContent(repo)();
  assert.equal(request.url, 'https://api.example/api/company-content/mobile');
  assert.equal(request.options.method, 'GET');
  assert.equal(request.options.headers.Authorization, undefined);
  assert.equal(request.options.credentials, 'omit');
  assert.equal(request.options.body, undefined);
  assert.equal(result.source, 'remote');
  assert.equal(result.warning, null);
  assert.equal(result.revision, MORE_CONTENT_REVISION);
  assert.deepEqual(result.content, moreContent);
  assert.ok(result.content.company.activity);
  assert.equal(result.content.company.innovation.benefits.length, 3);
  assert.ok(result.content.documents.every((document) => document.statusLabel.includes('revisión')));
});

test('More mapper projects and freezes public fields without leaking unrelated properties', () => {
  const body = envelope();
  body.content.privateData = 'secret';
  body.content.company.internal = 'secret';
  body.content.faqs[0].email = 'secret';
  const mapped = mapMoreContent(body);
  assert.equal(JSON.stringify(mapped).includes('secret'), false);
  assert.ok(Object.isFrozen(mapped.content.company.innovation.benefits[0]));
  assert.ok(Object.isFrozen(mapped.content.documents[0].sections[0].paragraphs));
});

test('More rejects legacy, incomplete, unsafe contact, duplicate and unsupported responses', () => {
  const changes = [
    (data) => { data.schemaVersion = 2; },
    (data) => { data.revision = '2026-11-07.1'; },
    (data) => { data.revision = '2026-13-40.1'; },
    (data) => { data.content.company.activity = ''; },
    (data) => { delete data.content.company.innovation; },
    (data) => { data.content.contact.phoneUri = 'javascript:alert(1)'; },
    (data) => { data.content.contact.phoneUri = 'tel:+521234567890'; },
    (data) => { data.content.contact.email = 'a@example.com?body=inject'; },
    (data) => { data.content.faqs.push(data.content.faqs[0]); },
    (data) => { data.content.documents = [data.content.documents[0]]; },
    (data) => { data.content.documents = [data.content.documents[0], data.content.documents[0]]; },
    (data) => { data.content.documents[0].statusLabel = ''; },
    (data) => { data.content.documents[0].sections[0].paragraphs = []; },
    (data) => { data.content.company.values = null; },
  ];
  for (const change of changes) {
    const data = envelope(); change(data);
    assert.throws(() => mapMoreContent(data));
  }
  for (const data of [null, [], {}, { about: {}, faqs: [], privacyPolicy: {}, termsAndConditions: {} }]) {
    assert.throws(() => mapMoreContent(data));
  }
});

test('first failure exposes the bundled content honestly and explicit retry replaces it', async () => {
  let available = false;
  let calls = 0;
  const repo = repository(async () => { calls++; if (!available) throw new Error('raw internal detail'); return json(envelope()); });
  const failed = await repo.getContent();
  assert.equal(failed.source, 'bundled');
  assert.deepEqual(failed.content, moreContent);
  assert.match(failed.warning, /incluida en la app/);
  assert.equal(failed.warning.includes('raw'), false);
  assert.equal(calls, 1, 'no automatic retry');
  available = true;
  const retry = await repo.getContent();
  assert.equal(retry.source, 'remote');
  assert.equal(retry.warning, null);
  assert.equal(calls, 2);
});

test('failure, malformed data and revision rollback retain the last good remote content', async () => {
  const latest = envelope(); latest.revision = '2026-11-09.1'; latest.content.company.description = 'Nueva información revisada.';
  let response = () => json(latest);
  const repo = repository(async () => response());
  const loaded = await repo.getContent();
  for (const next of [() => { throw new Error('offline'); }, () => json({}), () => json(envelope()), () => json({}, 503)]) {
    response = next;
    const result = await repo.getContent();
    assert.equal(result.source, 'memory');
    assert.strictEqual(result.content, loaded.content);
    assert.equal(result.revision, '2026-11-09.1');
    assert.match(result.warning, /última versión/);
  }
  response = () => json(latest);
  assert.equal((await repo.getContent()).warning, null);
});

test('concurrent readers share a request and later reload makes a fresh public request', async () => {
  let resolve;
  let calls = 0;
  const pending = new Promise((done) => { resolve = done; });
  const repo = repository(async () => { calls++; await pending; return json(envelope()); });
  const first = repo.getContent();
  const second = repo.getContent();
  assert.strictEqual(first, second);
  resolve();
  await Promise.all([first, second]);
  assert.equal(calls, 1);
  await repo.getContent();
  assert.equal(calls, 2);
});

test('bad local configuration and timeout keep the section readable with a retry warning', async () => {
  const invalid = new ApiMoreRepository(() => { throw new Error('bad base URL'); });
  assert.equal((await invalid.getContent()).source, 'bundled');
  const timeout = repository(() => new Promise(() => {}), 5);
  const result = await timeout.getContent();
  assert.equal(result.source, 'bundled');
  assert.ok(result.warning);
});

test('packaged server content cannot drift from the mobile editorial source', () => {
  const script = path.resolve(__dirname, '../../scripts/sync-mobile-company-content.cjs');
  const check = spawnSync(process.execPath, [script, '--check'], { encoding: 'utf8' });
  assert.equal(check.status, 0, check.stdout + check.stderr);
});
