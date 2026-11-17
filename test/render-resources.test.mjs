import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import manifest from '../generated/wasm-manifest.js';
import { createRenderingExecutor } from '../src/runtime/render-resources.js';
import { normalizeLanguagePacks } from '../src/runtime/language-packs.js';
import { validateManifest, validateBootConfig } from '../src/runtime/manifest.js';
import { config } from '../generated/wasm/dotnet.boot.js';
import { loadNodeRuntime } from '../src/runtime/node.js';
import { createBridgeRuntime } from '../src/runtime/dotnet.js';
import { createNativeHost, encodeFontBatch, nativeHostModule } from '../src/runtime/native-host.js';

const resources = new Map([['wasm/themes.css', new TextEncoder().encode('text { color: black; }')], ['wasm/NotoSans-Regular.ttf', new Uint8Array([1, 2, 3])], ['wasm/FuzzyBubbles-Regular.ttf', new Uint8Array([4, 5, 6])]]);
const rendering = { theme: 'wasm/themes.css', fonts: [{ family: 'Noto Sans', asset: 'wasm/NotoSans-Regular.ttf' }, { family: 'Fuzzy Bubbles', asset: 'wasm/FuzzyBubbles-Regular.ttf' }] };
const assets = [...resources].map(([path, data]) => ({ path, mediaType: path.endsWith('.css') ? 'text/css' : 'font/ttf', bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') }));
const renderManifest = () => ({ ...structuredClone(manifest), rendering, bridge: { ...manifest.bridge, execute: 'Execute' }, capabilities: [...new Set([...manifest.capabilities.filter(capability => capability !== 'textgraph-fonts-v1'), 'textgraph-render-v1'])], assets: [...manifest.assets.filter(asset => !resources.has(asset.path)), ...assets] });
// Bridges return a JSON envelope; the runtime's native call wraps it with any delivered payload.
const configuredJson = JSON.stringify({ protocolVersion: 2, success: true, diagnostics: [] });
const configured = Object.freeze({ json: configuredJson });
const rendered = Object.freeze({ json: '{"rendered":true}' });
const request = JSON.stringify({ protocolVersion: 2, operation: 'render', source: 'A', export: { format: 'png', scale: 2, padding: 10 } });

test('dark capability requires shared resources at manifest preflight', () => {
  const declared = { ...renderManifest(), capabilities: ['textgraph-validate-v1', 'textgraph-render-dark-v1'] };
  const { rendering, ...missing } = declared;
  assert.throws(() => validateManifest(missing), { code: 'INVALID_MANIFEST' });
  assert.throws(() => validateManifest({ ...declared, bridge: { ...declared.bridge, execute: undefined } }), { code: 'INVALID_MANIFEST' });
});

test('render preparation loads bundled resources lazily through the resolver and configures once', async () => {
  const reads = [];
  const calls = [];
  const languagePacks = normalizeLanguagePacks([{ fonts: [{ family: 'Chinese', source: new URL('https://fonts.example/chinese.ttf') }, { family: 'Japanese', source: new Uint8Array([10, 11, 12]) }], fallbackFamilies: ['Chinese', 'Japanese'] }]);
  const execute = createRenderingExecutor({
    manifest: renderManifest(), options: { languagePacks, resolveAsset: asset => new URL(asset.path, 'https://cdn.example/') },
    execute: (json, fonts) => { calls.push({ command: JSON.parse(json), fonts }); return JSON.parse(json).operation === 'configure' ? configured : rendered; },
    readAsset: async item => { reads.push(item.url.href); return new Response(resources.get(item.asset.path) ?? new Uint8Array([7, 8, 9])); },
  });
  assert.deepEqual(reads, []);
  assert.equal(await execute(request), rendered);
  assert.equal(await execute(request), rendered);
  assert.deepEqual(reads, ['https://cdn.example/wasm/themes.css', ...rendering.fonts.map(font => {
    const asset = assets.find(asset => asset.path === font.asset);
    return `https://cdn.example/${font.asset}?v=${asset.sha256}`;
  }), 'https://fonts.example/chinese.ttf']);
  assert.deepEqual(calls.map(item => item.command.operation), ['configure', 'render', 'render']);
  // Fonts never enter JSON: the request carries lengths and the bytes travel beside it.
  assert.deepEqual(calls[0].command, { protocolVersion: 2, operation: 'configure', theme: 'text { color: black; }', fonts: [
    { family: 'Noto Sans', byteLength: 3 }, { family: 'Fuzzy Bubbles', byteLength: 3 },
    { family: 'Chinese', byteLength: 3 }, { family: 'Japanese', byteLength: 3 },
  ], fallbackFamilies: ['Chinese', 'Japanese'] });
  assert.deepEqual(calls[0].fonts.map(bytes => [...bytes]), [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]]);
  assert.equal(calls[1].fonts, undefined);
});

test('font batches send only byte lengths and keep the original buffers for the native copy', () => {
  const first = new Uint8Array([1, 2, 3]);
  const second = new Uint8Array([4, 5]);
  const batch = encodeFontBatch([{ family: 'A', bytes: first, languages: ['zh'] }, { family: 'B', bytes: second }]);
  assert.deepEqual(batch.fonts, [{ family: 'A', byteLength: 3, languages: ['zh'] }, { family: 'B', byteLength: 2 }]);
  // The host keeps its original buffers; the only copy is the one into native memory.
  assert.equal(batch.data[0], first);
  assert.equal(batch.data[1], second);
});

test('native host serves fonts and accepts one image only during the owning call', () => {
  const host = createNativeHost();
  const fontView = new Uint8Array(3);
  const pngView = new Uint8Array([137, 80, 78, 71]);
  const response = host.run(() => {
    host.imports.copyFontBytes(0, fontView);
    host.imports.acceptPng(pngView);
    return '{"ok":true}';
  }, [new Uint8Array([7, 8, 9])]);
  assert.deepEqual([...fontView], [7, 8, 9]);
  assert.equal(response.json, '{"ok":true}');
  // The view aliases WASM memory only during the import; the response owns a copy.
  assert.notEqual(response.png, pngView);
  assert.deepEqual([...response.png], [137, 80, 78, 71]);
  assert.ok(Object.isFrozen(response));
  assert.deepEqual(host.run(() => { host.imports.acceptSvg('<svg/>'); return '{}'; }), { json: '{}', svg: '<svg/>' });
  assert.deepEqual(host.run(() => '{}'), { json: '{}' });
  assert.throws(() => host.run(() => host.imports.copyFontBytes(0, fontView), [new Uint8Array([7, 8])]), /native buffer/);
  assert.throws(() => host.run(() => { host.imports.acceptPng(pngView); host.imports.acceptSvg('<svg/>'); }), /outside one export call/);
  assert.throws(() => host.run(() => host.run(() => '{}')), /already serving/);
  // Outside a call there are neither fonts to serve nor a response to receive output.
  assert.throws(() => host.imports.copyFontBytes(0, fontView), /native buffer/);
  assert.throws(() => host.imports.acceptPng(pngView), /outside one export call/);
  assert.throws(() => host.imports.acceptSvg('<svg/>'), /outside one export call/);
  assert.equal(nativeHostModule, 'drawmotive-textgraph-host');
});

test('bridge runtime fills native font blocks and returns PNG payloads beside the envelope', async () => {
  const declared = renderManifest();
  const host = createNativeHost();
  const calls = [];
  const png = new Uint8Array([137, 80, 78, 71]);
  const runtime = createBridgeRuntime({ manifest: declared, options: {}, readAsset: async item => new Response(resources.get(item.asset.path)), host,
    info: { abiVersion: '1.0.0', capabilities: declared.capabilities },
    bridge: { Validate: () => 'validated', Execute: (...args) => {
      // Emulate the C# bridge: allocate each native block, ask the host to fill it, then hand out the image.
      const command = JSON.parse(args[0]);
      const filled = (command.fonts ?? []).map((font, index) => {
        const view = new Uint8Array(font.byteLength);
        host.imports.copyFontBytes(index, view);
        return [...view];
      });
      if (command.operation === 'render') host.imports.acceptPng(png);
      calls.push({ args, filled });
      return configuredJson;
    } },
  });
  try {
    const response = await runtime.execute(request);
    assert.ok(calls.every(call => call.args.length === 1));
    assert.deepEqual(calls[0].filled, [[1, 2, 3], [4, 5, 6]]);
    assert.deepEqual(response, { json: configuredJson, png });
    assert.notEqual(response.png, png);
  } finally { await runtime.dispose(); }
  assert.equal(JSON.parse(calls.at(-1).args[0]).operation, 'dispose');
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
  for (const [response, code] of [[{ json: 'not JSON' }, 'INVALID_RESPONSE'], [{ json: JSON.stringify({ protocolVersion: 2, success: false, diagnostics: [{ code: 'TG_FONT_ERROR', severity: 'error', stage: 'font', message: 'Invalid font' }] }) }, 'RUNTIME_FAILED']]) {
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

test('SVG capability requires shared resources and exposes the prepared executor without PNG capability', async () => {
  const declared = { ...renderManifest(), capabilities: ['textgraph-validate-v1', 'textgraph-render-svg-v1'] };
  const { rendering: omitted, ...missingResources } = declared;
  assert.throws(() => validateManifest(missingResources), { code: 'INVALID_MANIFEST' });
  assert.throws(() => validateManifest({ ...declared, bridge: { ...declared.bridge, execute: undefined } }), { code: 'INVALID_MANIFEST' });
  const operations = [];
  const runtime = createBridgeRuntime({ manifest: declared, options: {}, readAsset: async item => new Response(resources.get(item.asset.path)),
    info: { abiVersion: '1.0.0', capabilities: declared.capabilities },
    bridge: { Validate: () => 'validated', Execute: request => { operations.push(JSON.parse(request)); return configuredJson; } },
  });
  try {
    const request = JSON.stringify({ protocolVersion: 2, operation: 'render', source: 'A', export: { format: 'svg', padding: 10 } });
    assert.deepEqual(await runtime.execute(request), configured);
    assert.deepEqual(operations.map(item => item.operation), ['configure', 'render']);
    assert.deepEqual(operations[1].export, { format: 'svg', padding: 10 });
  } finally { await runtime.dispose(); }
  assert.equal(operations.at(-1).operation, 'dispose');
});
