import assert from 'node:assert/strict';
import test from 'node:test';
import manifest from '../generated/wasm-manifest.js';
import { loadBrowserRuntime, createTextGraphRuntimeLoader } from '../src/runtime/browser.js';
import { loadNodeRuntime } from '../src/runtime/node.js';
import { isRuntimeAsset } from '../src/runtime/manifest.js';

for (const [environment, loadRuntime] of [['browser and Worker', loadBrowserRuntime], ['Node', loadNodeRuntime]]) {
  test(`${environment} startup requests all runtime data before any response completes`, async () => {
    const gate = Promise.withResolvers();
    const requested = [];
    const startup = loadRuntime({
      resolveAsset: asset => new URL(asset.path, 'https://assets.example/'),
      fetch: async url => {
        requested.push(new URL(url).pathname.slice(1));
        await gate.promise;
        return new Response(new Uint8Array([0]));
      },
    }, manifest);
    // Corrupt responses must still fail preflight before .NET owns error handling.
    const rejected = assert.rejects(startup, { code: 'ASSET_INTEGRITY_MISMATCH' });
    try {
      const expected = manifest.assets.filter(isRuntimeAsset).filter(asset => !/[.](mjs|js)$/.test(asset.path));
      assert.ok(expected.length > 1);
      assert.deepEqual(requested.toSorted(), expected.map(asset => asset.path).toSorted());
    } finally {
      gate.resolve();
      await rejected;
    }
  });
}

test('asset loader overlaps response bodies and keeps bytes associated with their paths', async () => {
  const firstBody = Promise.withResolvers();
  const requested = [];
  const assets = [
    { path: 'wasm/first.wasm', mediaType: 'application/wasm' },
    { path: 'wasm/second.wasm', mediaType: 'application/wasm' },
  ];
  const loader = createTextGraphRuntimeLoader({
    manifest: { assets },
    fetch: async url => {
      requested.push(url.pathname.split('/').at(-1));
      return { ok: true, arrayBuffer: () => url.pathname.endsWith('/first.wasm')
        ? firstBody.promise : Promise.resolve(new Uint8Array([2]).buffer) };
    },
  });
  const loading = loader.loadAssets();
  try {
    assert.deepEqual([...requested], ['first.wasm', 'second.wasm']);
  } finally {
    firstBody.resolve(new Uint8Array([1]).buffer);
    const loaded = await loading;
    assert.deepEqual([...loaded.keys()], assets.map(asset => asset.path));
    assert.deepEqual(loaded.get('wasm/first.wasm').bytes, new Uint8Array([1]));
    assert.deepEqual(loaded.get('wasm/second.wasm').bytes, new Uint8Array([2]));
  }
});

test('cancelling parallel startup forwards cancellation to every pending request', async () => {
  const controller = new AbortController();
  const signals = [];
  let aborted = 0;
  const startup = loadBrowserRuntime({
    signal: controller.signal,
    fetch: (_url, { signal }) => new Promise((_resolve, reject) => {
      signals.push(signal);
      signal.addEventListener('abort', () => {
        aborted += 1;
        reject(new DOMException('cancelled', 'AbortError'));
      }, { once: true });
    }),
  }, manifest);
  const rejected = assert.rejects(startup, { name: 'AbortError' });
  controller.abort();
  await rejected;
  assert.ok(signals.length > 1);
  assert.ok(signals.every(signal => signal === controller.signal));
  assert.equal(aborted, signals.length);
});
