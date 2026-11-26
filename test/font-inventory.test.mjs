import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { createBridgeRuntime } from '../src/runtime/dotnet.js';
import { normalizeFontAssets } from '../src/runtime/language-packs.js';
import { createNativeHost } from '../src/runtime/native-host.js';

const inventoryUrl = new URL('https://resources.test/static/files.json');
const hash = data => createHash('sha256').update(data).digest('hex');
const core = new Uint8Array([0, 1]);
const ext = new Uint8Array([2, 3]);
const theme = 'theme fixture';
const corePath = 'static/NotoSans-Regular-core.ttf';
const extPath = 'static/NotoSans-Regular-ext.ttf';
const assets = new Map([
  ['static/themes.css', theme], [corePath, core], [extPath, ext],
  ['wasm/themes.css', theme], ['wasm/base.ttf', core],
]);
const inventory = {
  schemaVersion: 2,
  files: Object.fromEntries([...assets].filter(([path]) => path.startsWith('static/')).map(([path, value]) => [path, hash(value)])),
  fonts: [
    { family: 'Noto Sans', path: corePath, languages: ['en'], style: 'normal', pack: 'core', coverage: [[32, 126]], weight: '100 900', license: 'static/NotoSans-LICENSE.txt' },
    { family: 'Noto Sans', path: extPath, languages: ['en'], style: 'normal', pack: 'ext', coverage: [[339, 339]], weight: '100 900', license: 'static/NotoSans-LICENSE.txt' },
  ],
};
const response = JSON.stringify({ protocolVersion: 2, success: true, diagnostics: [] });
const command = source => JSON.stringify({ protocolVersion: 2, operation: 'render', source });

function fixture({ corruptTheme = false, capabilities = ['textgraph-font-inventory-v1'] } = {}) {
  const reads = [], events = [];
  const host = createNativeHost(true);
  async function loadFont(path) {
    const bytes = new Uint8Array(await host.imports.loadInventoryFont(path, inventory.files[path]));
    host.imports.copyInventoryFont(path, bytes);
    assert.deepEqual(bytes, assets.get(path));
  }
  const runtime = createBridgeRuntime({
    manifest: {
      bridge: { execute: 'Execute' },
      capabilities: ['textgraph-render-v1', ...capabilities],
      rendering: { theme: 'wasm/themes.css', fonts: [{ family: 'Noto Sans', asset: 'wasm/base.ttf' }] },
      assets: [...assets].filter(([path]) => path.startsWith('wasm/')).map(([path, data]) => ({ path, bytes: data.length, sha256: hash(data) })),
    },
    options: { fontAssets: normalizeFontAssets({ inventory: inventoryUrl }), resolveAsset: asset => new URL(asset.path, 'https://runtime.test/') },
    info: { abiVersion: '1.0.0', capabilities: ['textgraph-render-v1', ...capabilities] },
    host,
    readAsset: async ({ url }) => {
      reads.push(url.href);
      if (url.pathname === '/static/files.json') return Response.json(inventory);
      if (corruptTheme && url.pathname === '/static/themes.css') return new Response('corrupt theme');
      return new Response(assets.get(url.pathname.slice(1)));
    },
    bridge: {
      async ConfigureInventory(css, data) {
        assert.equal(css, theme);
        assert.deepEqual(JSON.parse(data), inventory);
        await loadFont(corePath);
        events.push('configure inventory');
        return response;
      },
      async PrepareInventoryFonts(source) {
        if (source === 'œ') {
          await loadFont(extPath);
          events.push('prepare extension');
        }
        return response;
      },
      Execute(request) {
        const { operation, source } = JSON.parse(request);
        if (operation === 'prepare-fonts') return JSON.stringify({ ...JSON.parse(response), fontRuns: [{ text: source, language: null, missing: source === 'œ' }] });
        if (operation === 'render') events.push('render ' + source);
        return response;
      },
    },
  });
  return { runtime, reads, events };
}

test('the inventory supplies the theme and verified core and extension bytes through the native host', async () => {
  const { runtime, reads, events } = fixture();
  await runtime.execute(command('hello'));
  await runtime.execute(command('œ'), { onPreview: () => events.push('preview') });
  assert.deepEqual(reads.map(url => url.split('?')[0]), [
    'https://resources.test/static/files.json', 'https://resources.test/static/themes.css',
    'https://resources.test/static/NotoSans-Regular-core.ttf', 'https://resources.test/static/NotoSans-Regular-ext.ttf',
  ]);
  assert.deepEqual(events, ['configure inventory', 'render hello', 'render œ', 'preview', 'prepare extension', 'render œ']);
});

test('an inventory theme with the wrong digest cannot configure the native renderer', async () => {
  const { runtime, reads, events } = fixture({ corruptTheme: true });
  await assert.rejects(runtime.execute(command('hello')), { code: 'ASSET_INTEGRITY_MISMATCH' });
  assert.equal(reads.length, 2);
  assert.deepEqual(events, []);
});

test('a configured inventory cannot silently use a legacy bridge', async () => {
  const { runtime, reads } = fixture({ capabilities: [] });
  await assert.rejects(runtime.execute(command('hello')), { code: 'UNSUPPORTED_CAPABILITY' });
  assert.deepEqual(reads, []);
});
