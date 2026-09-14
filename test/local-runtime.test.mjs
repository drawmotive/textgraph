import assert from 'node:assert/strict';
import test from 'node:test';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { Worker } from 'node:worker_threads';
import { once } from 'node:events';
import { initializeTextGraph } from '@drawmotive/textgraph/node';
import bundledManifest from '../generated/wasm-manifest.js';

async function fixture(t, { copy = true } = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'textgraph-local-runtime-'));
  const previous = process.env.DRAWMOTIVE_TEXTGRAPH_RUNTIME;
  t.after(async () => {
    if (previous === undefined) delete process.env.DRAWMOTIVE_TEXTGRAPH_RUNTIME;
    else process.env.DRAWMOTIVE_TEXTGRAPH_RUNTIME = previous;
    await rm(root, { recursive: true, force: true });
  });
  if (copy) await cp(new URL('../generated/', import.meta.url), root, { recursive: true });
  process.env.DRAWMOTIVE_TEXTGRAPH_RUNTIME = root;
  return root;
}

test('explicit local runtime uses its JSON manifest and resolves native and render assets there', async t => {
  const root = await fixture(t);
  const manifestPath = path.join(root, 'wasm-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.privateSource.development = true;
  manifest.privateSource.fingerprint = 'local-test-inputs';
  const theme = manifest.assets.find(asset => asset.path === manifest.rendering.theme);
  const bytes = Buffer.concat([await readFile(path.join(root, theme.path)), Buffer.from('\n/* local runtime theme */\n')]);
  await writeFile(path.join(root, theme.path), bytes);
  theme.bytes = bytes.length;
  theme.sha256 = createHash('sha256').update(bytes).digest('hex');
  await writeFile(manifestPath, JSON.stringify(manifest));
  // The development loader must consume JSON, never a stale executable projection.
  await writeFile(path.join(root, 'wasm-manifest.js'), 'throw new Error("stale projection");');
  const resolved = [];
  const runtime = await initializeTextGraph({ resolveAsset: (asset, defaultUrl) => {
    resolved.push({ asset: asset.path, url: defaultUrl.href });
    return defaultUrl;
  } });
  try {
    assert.equal((await runtime.renderPng('A -> B')).success, true);
    assert.equal(runtime.info.packageVersion, bundledManifest.packageVersion);
    assert.ok(runtime.info.capabilities.includes('textgraph-render-v1'));
    assert.ok(resolved.some(item => item.asset === 'wasm/dotnet.js'));
    assert.ok(resolved.some(item => item.asset === manifest.rendering.theme));
    assert.ok(resolved.some(item => item.asset.endsWith('.ttf')));
    for (const item of resolved) assert.equal(item.url, pathToFileURL(path.join(root, item.asset)).href);
  } finally { await runtime.dispose(); }
});

test('explicit local manifest restricts exposed capabilities to the selected loader contract', async t => {
  const root = await fixture(t);
  const manifest = structuredClone(bundledManifest);
  manifest.capabilities = ['textgraph-validate-v1'];
  delete manifest.rendering;
  await writeFile(path.join(root, 'wasm-manifest.json'), JSON.stringify(manifest));
  const runtime = await initializeTextGraph();
  try {
    assert.deepEqual(runtime.info.capabilities, ['textgraph-validate-v1']);
    assert.equal((await runtime.validate('A -> B')).valid, true);
    await assert.rejects(runtime.renderPng('A -> B'), { code: 'UNSUPPORTED_CAPABILITY' });
  } finally { await runtime.dispose(); }
});

test('invalid explicit local runtime selections reject instead of using bundled assets', async t => {
  const root = await fixture(t, { copy: false });
  for (const directory of ['', 'relative/generated']) {
    process.env.DRAWMOTIVE_TEXTGRAPH_RUNTIME = directory;
    await assert.rejects(initializeTextGraph(), { code: 'INVALID_ARGUMENT' });
  }
  process.env.DRAWMOTIVE_TEXTGRAPH_RUNTIME = root;
  await assert.rejects(initializeTextGraph(), { code: 'RESOURCE_NOT_FOUND' });
  await writeFile(path.join(root, 'wasm-manifest.json'), '{invalid');
  await assert.rejects(initializeTextGraph(), { code: 'INVALID_MANIFEST' });
  await writeFile(path.join(root, 'wasm-manifest.json'), '{}');
  await assert.rejects(initializeTextGraph(), { code: 'INVALID_MANIFEST' });
  await writeFile(path.join(root, 'wasm-manifest.json'), JSON.stringify(bundledManifest));
  await assert.rejects(initializeTextGraph(), { code: 'RESOURCE_NOT_FOUND' });
});

test('corrupt local assets remain subject to manifest integrity checks', async t => {
  const root = await fixture(t);
  await writeFile(path.join(root, 'wasm/Graphics.Core.wasm'), 'corrupt');
  await assert.rejects(initializeTextGraph(), { code: 'ASSET_INTEGRITY_MISMATCH' });
});

test('Node Workers inherit explicit local runtime selection without silently falling back', async t => {
  await fixture(t, { copy: false });
  const worker = new Worker(new URL('./fixtures/real-worker.mjs', import.meta.url));
  try {
    const [message] = await once(worker, 'message');
    assert.match(message.error, /local|manifest/i);
    assert.equal(message.result, undefined);
  } finally { await worker.terminate(); }
});

test('an explicit runtime loader remains authoritative over development environment selection', async t => {
  await fixture(t, { copy: false });
  const runtime = await initializeTextGraph({ loadRuntime: async () => ({
    abiVersion: '1.0.0', validate: () => JSON.stringify({ protocolVersion: 1, valid: true, diagnostics: [] }),
  }) });
  try { assert.equal((await runtime.validate('A -> B')).valid, true); }
  finally { await runtime.dispose(); }
});
