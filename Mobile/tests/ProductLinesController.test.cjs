const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createProductLinesController } = require('../src/features/productLines/presentation/state/createProductLinesController.ts');
const { ProductLinesError } = require('../src/features/productLines/domain/errors/ProductLinesError.ts');
const tick = () => new Promise((resolve) => setImmediate(resolve));
const line = (id, count = 0) => ({ id, name: id, count });
const deferred = () => { let resolve, reject; const promise = new Promise((a, b) => { resolve = a; reject = b; }); return { promise, resolve, reject }; };

test('lines begin without preview data, block duplicate loads and accept an empty server response', async () => {
  const pending = deferred(); let calls = 0;
  const vm = createProductLinesController(async () => { calls++; return pending.promise; });
  assert.equal(vm.getSnapshot().status, 'loading');
  assert.deepEqual(vm.getSnapshot().lines, []);
  vm.start(); vm.start(); await vm.refresh();
  assert.equal(calls, 1);
  pending.resolve([]); await tick();
  assert.equal(vm.getSnapshot().status, 'ready');
  assert.deepEqual(vm.getSnapshot().lines, []);
  vm.stop();
});

test('unknown selections are ignored while zero-count and custom server categories can be selected', async () => {
  const vm = createProductLinesController(async () => [line('personalizada', 4), line('vacia')]);
  vm.start(); await tick();
  vm.selectLine('inventada');
  assert.equal(vm.getSnapshot().selectedId, null);
  vm.selectLine('personalizada');
  assert.equal(vm.getSnapshot().selectedId, 'personalizada');
  vm.selectLine('vacia');
  assert.equal(vm.getSnapshot().selectedId, 'vacia');
  vm.stop();
});

test('initial failure is safe and explicit retry recovers the actual server lines', async () => {
  let calls = 0;
  const vm = createProductLinesController(async () => {
    if (++calls === 1) throw new Error('private trace');
    return [line('real')];
  });
  vm.start(); await tick();
  assert.equal(vm.getSnapshot().status, 'error');
  assert.equal(calls, 1);
  assert.ok(!vm.getSnapshot().error.includes('private'));
  await vm.refresh();
  assert.equal(vm.getSnapshot().status, 'ready');
  assert.equal(vm.getSnapshot().lines[0].id, 'real');
  vm.stop();
});

test('failed refresh preserves selection, count and loaded lines, then a successful refresh replaces them', async () => {
  let mode = 'first';
  const vm = createProductLinesController(async () => {
    if (mode === 'error') throw new ProductLinesError('Sin conexión.', 'network');
    return mode === 'first' ? [line('a', 3), line('b')] : [{ id: 'a', name: 'Nombre actualizado', count: 7 }];
  });
  vm.start(); await tick(); vm.selectLine('a');
  mode = 'error'; await vm.refresh();
  assert.equal(vm.getSnapshot().status, 'ready');
  assert.equal(vm.getSnapshot().selectedId, 'a');
  assert.equal(vm.getSnapshot().lines[0].count, 3);
  assert.equal(vm.getSnapshot().error, 'Sin conexión.');
  mode = 'next'; await vm.refresh();
  assert.equal(vm.getSnapshot().selectedId, 'a');
  assert.equal(vm.getSnapshot().lines.length, 1);
  assert.equal(vm.getSnapshot().lines[0].count, 7);
  assert.equal(vm.getSnapshot().error, null);
  vm.stop();
});

test('a removed category or empty refresh clears its selection rather than sending an obsolete filter', async () => {
  let result = [line('removed')];
  const vm = createProductLinesController(async () => result);
  vm.start(); await tick(); vm.selectLine('removed');
  result = [line('new')]; await vm.refresh();
  assert.equal(vm.getSnapshot().selectedId, null);
  vm.selectLine('new'); result = []; await vm.refresh();
  assert.equal(vm.getSnapshot().selectedId, null);
  assert.deepEqual(vm.getSnapshot().lines, []);
  vm.stop();
});

test('unmount aborts transport and late results cannot overwrite a remounted category list', async () => {
  const first = deferred(); let calls = 0, signal;
  const vm = createProductLinesController(async (options) => {
    if (++calls === 1) { signal = options.signal; return first.promise; }
    return [line('fresh')];
  });
  vm.start(); vm.stop(); assert.equal(signal.aborted, true);
  vm.start(); await tick();
  first.resolve([line('stale')]); await tick();
  assert.deepEqual(vm.getSnapshot().lines.map((item) => item.id), ['fresh']);
  vm.stop();
});
