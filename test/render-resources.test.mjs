import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import manifest from '../generated/wasm-manifest.js';
import { createRenderingExecutor } from '../src/runtime/render-resources.js';
import { normalizeLanguagePacks } from '../src/runtime/language-packs.js';
import { validateManifest, validateBootConfig } from '../src/runtime/manifest.js';
import { config } from '../generated/wasm/dotnet.boot.js';
import { loadNodeRuntime } from '../src/runtime/node.js';

const resources = new Map([['wasm/themes.css', new TextEncoder().encode('text { color: black; }')], ['wasm/NotoSans-Regular.ttf', new Uint8Array([1, 2, 3])], ['wasm/FuzzyBubbles-Regular.ttf', new Uint8Array([4, 5, 6])]]);
const rendering = { theme: 'wasm/themes.css', fonts: [{ family: 'NotoSans-Regular', asset: 'wasm/NotoSans-Regular.ttf' }, { family: 'FuzzyBubbles-Regular', asset: 'wasm/FuzzyBubbles-Regular.ttf' }] };
const assets = [...resources].map(([path, data]) => ({ path, mediaType: path.endsWith('.css') ? 'text/css' : 'font/ttf', bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') }));
const renderManifest = () => ({ ...structuredClone(manifest), rendering, bridge: { ...manifest.bridge, execute: 'Execute' }, capabilities: [...new Set([...manifest.capabilities, 'textgraph-render-v1'])], assets: [...manifest.assets.filter(asset => !resources.has(asset.path)), ...assets] });
const configured = JSON.stringify({ protocolVersion: 1, success: true, diagnostics: [] });
const request = JSON.stringify({ protocolVersion: 1, operation: 'render', source: 'A', export: { format: 'png', scale: 2, padding: 10 } });

test('render preparation loads bundled resources lazily through the resolver and configures once', async () => {
  const reads = [];
  const requests = [];
  const languagePacks = normalizeLanguagePacks([{ fonts: [{ family: 'Chinese', source: new URL('https://fonts.example/chinese.ttf') }, { family: 'Japanese', source: new Uint8Array([10, 11, 12]) }], fallbackFamilies: ['Chinese', 'Japanese'] }]);
  const execute = createRenderingExecutor({
    manifest: renderManifest(), options: { languagePacks, resolveAsset: asset => new URL(asset.path, 'https://cdn.example/') },
    execute: json => { requests.push(JSON.parse(json)); return JSON.parse(json).operation === 'configure' ? configured : 'rendered'; },
    readAsset: async item => { reads.push(item.url.href); return new Response(resources.get(item.asset.path) ?? new Uint8Array([7, 8, 9])); },
  });
  assert.deepEqual(reads, []);
  assert.equal(await execute(request), 'rendered');
  assert.equal(await execute(request), 'rendered');
  assert.deepEqual(reads, ['https://cdn.example/wasm/themes.css', 'https://cdn.example/wasm/NotoSans-Regular.ttf', 'https://cdn.example/wasm/FuzzyBubbles-Regular.ttf', 'https://fonts.example/chinese.ttf']);
  assert.deepEqual(requests.map(item => item.operation), ['configure', 'render', 'render']);
  assert.deepEqual(requests[0], { protocolVersion: 1, operation: 'configure', theme: 'text { color: black; }', fonts: [
    { family: 'NotoSans-Regular', data: 'AQID' }, { family: 'FuzzyBubbles-Regular', data: 'BAUG' },
    { family: 'Chinese', data: 'BwgJ' }, { family: 'Japanese', data: 'CgsM' },
  ], fallbackFamilies: ['Chinese', 'Japanese'] });
});

test('render preparation rejects corruption before native configuration and can retry a repaired resource', async () => {
  let corrupt = true;
  const operations = [];
  const execute = createRenderingExecutor({ manifest: renderManifest(), options: {},
    execute: json => { operations.push(JSON.parse(json).operation); return configured; },
    readAsset: async item => new Response(corrupt ? new Uint8Array([0]) : resources.get(item.asset.path)),
  });
  await assert.rejects(execute(request), { code: 'ASSET_INTEGRITY_MISMATCH' });
  assert.deepEqual(operations, []);
  corrupt = false;
  await execute(request);
  assert.deepEqual(operations, ['configure', 'render']);
});

test('render preparation passes the call signal and cancellation prevents native configuration', async () => {
  const controller = new AbortController();
  let nativeCalls = 0;
  const execute = createRenderingExecutor({ manifest: renderManifest(), options: {},
    execute: () => { nativeCalls++; return configured; },
    readAsset: async (item, context) => { assert.equal(context.signal, controller.signal); controller.abort(); return new Response(resources.get(item.asset.path)); },
  });
  await assert.rejects(execute(request, { signal: controller.signal }), { name: 'AbortError' });
  assert.equal(nativeCalls, 0);
});

test('failed or malformed configuration does not submit the diagram', async () => {
  for (const [response, code] of [['not JSON', 'INVALID_RESPONSE'], [JSON.stringify({ protocolVersion: 1, success: false, diagnostics: [{ code: 'TG_FONT_ERROR', severity: 'error', stage: 'font', message: 'Invalid font' }] }), 'RUNTIME_FAILED']]) {
    const operations = [];
    const execute = createRenderingExecutor({ manifest: renderManifest(), options: {},
      execute: json => { operations.push(JSON.parse(json).operation); return response; },
      readAsset: async item => new Response(resources.get(item.asset.path)),
    });
    await assert.rejects(execute(request), { code });
    assert.deepEqual(operations, ['configure']);
  }
});

test('render manifest rejects missing, duplicate and runtime-overlapping resource declarations', () => {
  assert.doesNotThrow(() => validateManifest(renderManifest()));
  for (const change of [null, { ...rendering, theme: 'wasm/missing.css' }, { ...rendering, fonts: [] },
    { ...rendering, fonts: [rendering.fonts[0], rendering.fonts[0]] },
    { ...rendering, theme: manifest.runtimeConfig },
    { ...rendering, fonts: [{ family: 'Noto', asset: manifest.entryAssembly }] }]) {
    assert.throws(() => validateManifest({ ...renderManifest(), rendering: change }), { code: 'INVALID_MANIFEST' });
  }
  assert.throws(() => validateManifest({ ...renderManifest(), bridge: { ...manifest.bridge, execute: undefined } }), { code: 'INVALID_MANIFEST' });
  const boot = structuredClone(config); boot.resources.assembly.push({ name: 'NotoSans-Regular.ttf' });
  assert.throws(() => validateBootConfig(boot, renderManifest()), { code: 'INVALID_MANIFEST' });
});

test('validate-only startup performs no font or theme reads even when rendering assets are declared', async () => {
  const declared = renderManifest();
  // This fixture's shipped bridge may predate rendering; absence of Execute is checked after safe startup.
  const reads = [];
  let runtime;
  try {
    runtime = await loadNodeRuntime({ resolveAsset: (asset, url) => resources.has(asset.path) ? new URL(asset.path, 'https://fonts.invalid/') : url,
      fetch: async url => { reads.push(url.href); throw new Error('Unexpected rendering asset read'); } }, declared);
    assert.equal(JSON.parse(runtime.validate('A')).valid, true);
  } catch (error) {
    assert.ok(['ABI_MISMATCH', 'UNSUPPORTED_CAPABILITY'].includes(error.code), error.stack);
  } finally { await runtime?.dispose(); }
  assert.deepEqual(reads, []);
});
