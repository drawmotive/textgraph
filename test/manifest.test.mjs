import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { validateManifest } from '../src/runtime/manifest.js';
const source = JSON.parse(await readFile(new URL('../generated/wasm-manifest.json', import.meta.url)));
const manifest = () => ({ ...structuredClone(source), protocolVersion: 1, runtimeModule: 'wasm/dotnet.js', bridge: { assembly: 'DrawMotive.TextGraph.Bridge.dll', type: 'DrawMotive.TextGraph.Bridge.Program', info: 'GetRuntimeInfo', validate: 'Validate' }, capabilities: [...source.capabilities, 'textgraph-validate-v1'] });

test('manifest validation rejects incompatible identity and incomplete capabilities', () => {
  assert.doesNotThrow(() => validateManifest(manifest()));
  for (const change of [{ schemaVersion: 2 }, { abiVersion: '2.0.0' }, { protocolVersion: 2 }, { packageName: 'other' }, { capabilities: [] }, { runtimeModule: 'wasm/missing.js' }]) {
    assert.throws(() => validateManifest({ ...manifest(), ...change }), error => ['INVALID_MANIFEST', 'ABI_MISMATCH', 'UNSUPPORTED_CAPABILITY'].includes(error.code));
  }
});

test('manifest rejects duplicate, escaping and malformed assets before fetching', () => {
  for (const asset of [{ path: '../secret' }, { path: 'wasm/%2e%2e/secret' }, { sha256: 'wrong' }, { bytes: -1 }]) {
    const input = manifest(); input.assets[0] = { ...input.assets[0], ...asset };
    assert.throws(() => validateManifest(input), { code: 'INVALID_MANIFEST' });
  }
  const input = manifest(); input.assets.push(input.assets[0]);
  assert.throws(() => validateManifest(input), { code: 'INVALID_MANIFEST' });
});
