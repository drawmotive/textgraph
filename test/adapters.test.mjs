import assert from 'node:assert/strict';
import test from 'node:test';

import { initializeTextGraph, validateTextGraphAdapters } from '../src/index.js';

const runtime = { abiVersion: '1.0.0' };

test('TextGraph validates adapter methods and freezes a host snapshot', () => {
  assert.throws(() => validateTextGraphAdapters({ files: { open() {} } }), (error) => error.code === 'INVALID_ADAPTER' && error.details.adapter === 'files');
  const adapters = {
    files: { open: async () => new Uint8Array(), save: async () => undefined },
    network: { fetch: async () => new Response() },
  };
  const snapshot = validateTextGraphAdapters(adapters);
  assert.ok(Object.isFrozen(snapshot));
  assert.ok(Object.isFrozen(snapshot.files));
  adapters.files.open = async () => { throw new Error('mutated'); };
  assert.notEqual(snapshot.files.open, adapters.files.open);
});

test('TextGraph passes adapters and the initialization signal to the runtime', async () => {
  const controller = new AbortController();
  let received;
  await initializeTextGraph({
    signal: controller.signal,
    adapters: { network: { fetch: async () => new Response() } },
    loadRuntime: async (options) => { received = options; return runtime; },
  });
  assert.equal(received.signal, controller.signal);
  assert.equal(typeof received.adapters.network.fetch, 'function');
});
