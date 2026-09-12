import assert from 'node:assert/strict';
import test from 'node:test';
import manifest from '../generated/wasm-manifest.js';
import { config } from '../generated/wasm/dotnet.boot.js';
import { validateBootConfig } from '../src/runtime/manifest.js';

test('boot configuration cannot introduce unlisted assets into native startup', () => {
  assert.doesNotThrow(() => validateBootConfig(config, manifest));
  const stale = structuredClone(config);
  stale.resources.assembly.push({ name: 'missing.wasm' });
  assert.throws(() => validateBootConfig(stale, manifest), { code: 'INVALID_MANIFEST' });
  assert.throws(() => validateBootConfig({ ...config, mainAssemblyName: 'Other.dll' }, manifest), { code: 'ABI_MISMATCH' });
});
