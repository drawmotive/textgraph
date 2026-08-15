import assert from 'node:assert/strict';
import test from 'node:test';

import { DrawMotiveError, initializeTextGraph } from '../src/index.js';

const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};

const runtime = (overrides = {}) => ({ abiVersion: '1.0.0', dispose: async () => undefined, ...overrides });

test('TextGraph rejects ABI mismatch with a stable structured error', async () => {
  await assert.rejects(
    initializeTextGraph({ loadRuntime: async () => runtime({ abiVersion: '2.0.0' }) }),
    (error) => error instanceof DrawMotiveError && error.code === 'ABI_MISMATCH' && error.details.actual === '2.0.0',
  );
});

test('TextGraph honors cancellation before and during initialization and releases a late runtime', async () => {
  const before = new AbortController();
  before.abort();
  let called = false;
  await assert.rejects(initializeTextGraph({ signal: before.signal, loadRuntime: async () => { called = true; } }), { name: 'AbortError' });
  assert.equal(called, false);

  const during = new AbortController();
  const loaded = deferred();
  let disposed = 0;
  const initializing = initializeTextGraph({ signal: during.signal, loadRuntime: () => loaded.promise });
  during.abort();
  await assert.rejects(initializing, { name: 'AbortError' });
  loaded.resolve(runtime({ dispose: async () => { disposed += 1; } }));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(disposed, 1);
});

test('TextGraph runs reads in parallel, serializes mutations, and disposes idempotently', async () => {
  let runtimeDisposals = 0;
  const instance = await initializeTextGraph({ loadRuntime: async () => runtime({ dispose: async () => { runtimeDisposals += 1; } }) });
  const gate = deferred();
  let activeReads = 0;
  let maxReads = 0;
  const read = () => instance.readonly(async () => { activeReads += 1; maxReads = Math.max(maxReads, activeReads); await gate.promise; activeReads -= 1; });
  const reads = [read(), read()];
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(maxReads, 2);
  gate.resolve();
  await Promise.all(reads);

  const order = [];
  await Promise.all([
    instance.mutate(async () => { order.push('a:start'); await new Promise((resolve) => setImmediate(resolve)); order.push('a:end'); }),
    instance.mutate(async () => { order.push('b'); }),
  ]);
  assert.deepEqual(order, ['a:start', 'a:end', 'b']);
  await Promise.all([instance.dispose(), instance.dispose()]);
  assert.equal(instance.state, 'disposed');
  assert.equal(runtimeDisposals, 1);
  await assert.rejects(instance.readonly(() => 1), (error) => error.code === 'INSTANCE_DISPOSED');
});

test('TextGraph instances do not share operation queues', async () => {
  const first = await initializeTextGraph({ loadRuntime: async () => runtime() });
  const second = await initializeTextGraph({ loadRuntime: async () => runtime() });
  const gate = deferred();
  const blocked = first.mutate(() => gate.promise);
  assert.equal(await second.mutate(() => 'independent'), 'independent');
  gate.resolve();
  await blocked;
});
