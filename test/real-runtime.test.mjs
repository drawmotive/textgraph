import assert from 'node:assert/strict';
import test from 'node:test';
import { initializeTextGraph } from '@drawmotive/textgraph/node';
import { Worker } from 'node:worker_threads';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import manifest from '../generated/wasm-manifest.js';

test('installed Node loader starts the real bridge and validates without host setup', async () => {
  const instance = await initializeTextGraph();
  try {
    assert.ok(instance.info.capabilities.includes('textgraph-validate-v1'));
    assert.deepEqual(await instance.validate('A -> B'), { valid: true, diagnostics: [] });
    assert.equal((await instance.validate('A ->')).valid, false);
  } finally { await instance.dispose(); }
});

test('multiple real runtimes remain usable when another instance is disposed', async () => {
  const first = await initializeTextGraph();
  const second = await initializeTextGraph();
  await first.dispose();
  assert.equal((await second.validate('A -> B')).valid, true);
  await second.dispose();
});

test('real Node worker_threads uses the Node loader without a browser shim', async () => {
  const worker = new Worker(new URL('./fixtures/real-worker.mjs', import.meta.url));
  try {
    const [message] = await once(worker, 'message');
    assert.deepEqual(message, { result: { valid: true, diagnostics: [] }, state: 'disposed' });
  } finally { await worker.terminate(); }
});

test('real runtime accepts offline data cache and rejects corrupt assets before startup', async () => {
  const data = new Map();
  for (const asset of manifest.assets.filter(asset => !/[.](mjs|js)$/.test(asset.path))) {
    data.set(asset.path, await readFile(new URL(`../generated/${asset.path}`, import.meta.url)));
  }
  const options = {
    resolveAsset: (asset, url) => data.has(asset.path) ? new URL(asset.path, 'https://offline.invalid/') : url,
    fetch: async url => new Response(data.get(new URL(url).pathname.slice(1))),
  };
  const runtime = await initializeTextGraph(options);
  assert.equal((await runtime.validate('A -> B')).valid, true);
  await runtime.dispose();
  data.set('wasm/Graphics.Core.wasm', new Uint8Array([0]));
  await assert.rejects(initializeTextGraph(options), { code: 'ASSET_INTEGRITY_MISMATCH' });
});

test('real initialization cancellation aborts preflight without entering native startup', async () => {
  const controller = new AbortController();
  await assert.rejects(initializeTextGraph({
    signal: controller.signal,
    resolveAsset: (asset, url) => asset.path.endsWith('.wasm') ? new URL(asset.path, 'https://cancel.invalid/') : url,
    fetch: async () => { controller.abort(); throw new DOMException('cancelled', 'AbortError'); },
  }), { name: 'AbortError' });
});
