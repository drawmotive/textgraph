import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveRuntimeAssets } from '../src/index.js';

const manifest = { assets: [{ path: 'wasm/runtime.wasm', mediaType: 'application/wasm' }] };

test('TextGraph resolves package assets from file, CDN, bundler, and no-bundler module URLs', () => {
  const cases = [
    ['file:///app/node_modules/@drawmotive/textgraph/src/runtime/assets.js', 'file:///app/node_modules/@drawmotive/textgraph/generated/wasm/runtime.wasm'],
    ['https://cdn.example/@drawmotive/textgraph/src/runtime/assets.js', 'https://cdn.example/@drawmotive/textgraph/generated/wasm/runtime.wasm'],
    ['https://app.example/assets/@drawmotive/textgraph/src/runtime/assets-HASH.js', 'https://app.example/assets/@drawmotive/textgraph/generated/wasm/runtime.wasm'],
    ['https://example.test/vendor/textgraph/src/runtime/assets.js', 'https://example.test/vendor/textgraph/generated/wasm/runtime.wasm'],
  ];
  for (const [moduleUrl, expected] of cases) {
    assert.equal(resolveRuntimeAssets({ manifest, moduleUrl })[0].url.href, expected);
  }
});

test('TextGraph accepts absolute asset overrides and rejects relative results', () => {
  const absolute = resolveRuntimeAssets({ manifest, moduleUrl: import.meta.url, resolveAsset: () => 'https://assets.example/runtime.wasm' });
  assert.equal(absolute[0].url.href, 'https://assets.example/runtime.wasm');
  assert.throws(
    () => resolveRuntimeAssets({ manifest, moduleUrl: import.meta.url, resolveAsset: () => './runtime.wasm' }),
    (error) => error.code === 'INVALID_ASSET_URL',
  );
});
