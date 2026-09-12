import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const packageRoot = path.resolve(import.meta.dirname, '..');

test('TextGraph ships a complete package-owned Release WASM manifest', async () => {
  const manifestPath = path.join(packageRoot, 'generated', 'wasm-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.packageName, '@drawmotive/textgraph');
  const packageJson = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));
  assert.equal(manifest.packageVersion, packageJson.version);
  assert.equal(manifest.abiVersion, '1.0.0');
  assert.equal(manifest.targetFramework, 'net10.0');
  assert.match(manifest.privateSource.commit, /^[0-9a-f]{40}$/);
  assert.equal(manifest.privateSource.project, 'DrawMotive.TextGraph.Bridge');
  assert.equal(manifest.entryAssembly, 'wasm/DrawMotive.TextGraph.Bridge.wasm');
  assert.equal(manifest.runtimeWasm, 'wasm/dotnet.native.wasm');
  assert.match(manifest.runtimeConfig, /runtimeconfig.json$/);
  assert.ok(manifest.assets.some((asset) => asset.path === 'wasm/main.mjs'));
  assert.ok(manifest.assets.length > 3);

  for (const asset of manifest.assets) {
    assert.match(asset.path, /^wasm\/[A-Za-z0-9._-]+$/);
    assert.doesNotMatch(asset.path, /.pdb$|.map$|.br$|.gz$|.cs$/);
    assert.match(asset.sha256, /^[0-9a-f]{64}$/);
    const content = await readFile(path.join(packageRoot, 'generated', asset.path));
    assert.equal(content.byteLength, asset.bytes, asset.path);
    assert.equal(createHash('sha256').update(content).digest('hex'), asset.sha256, asset.path);
  }

  const runtimeWasm = await readFile(path.join(packageRoot, 'generated', manifest.runtimeWasm));
  assert.deepEqual([...runtimeWasm.subarray(0, 4)], [0x00, 0x61, 0x73, 0x6d]);
  const bootConfig = await readFile(path.join(packageRoot, 'generated', 'wasm', 'dotnet.boot.js'), 'utf8');
  assert.doesNotMatch(bootConfig, /wasmSymbols|\.symbols/);
});

test('TextGraph generated directory contains only manifest-listed public assets', async () => {
  const manifest = JSON.parse(
    await readFile(path.join(packageRoot, 'generated', 'wasm-manifest.json'), 'utf8'),
  );
  const actual = (await readdir(path.join(packageRoot, 'generated', 'wasm')))
    .map((name) => `wasm/${name}`)
    .sort();
  const listed = manifest.assets.map((asset) => asset.path).sort();

  assert.deepEqual(actual, listed);
});

test('TextGraph browser loader resolves every manifest asset without ambient globals', async () => {
  const { createTextGraphRuntimeLoader } = await import('../src/runtime/browser.js');
  const manifest = JSON.parse(
    await readFile(path.join(packageRoot, 'generated', 'wasm-manifest.json'), 'utf8'),
  );
  const requested = [];
  const loader = createTextGraphRuntimeLoader({
    manifest,
    baseUrl: new URL('../generated/', import.meta.url),
    fetch: async (url) => {
      requested.push(url.href);
      return new Response(await readFile(url), { status: 200 });
    },
  });

  const assets = await loader.loadAssets();

  assert.equal(assets.size, manifest.assets.length);
  assert.equal(requested.length, manifest.assets.length);
  assert.ok([...assets.values()].every((asset) => asset.bytes instanceof Uint8Array));
});
