import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import manifest from '../generated/wasm-manifest.js';
import { startTextGraphRuntime } from '../src/runtime/dotnet.js';

async function startupFixture(t, targetFramework, mainAssemblyName, invalidResource = false) {
  const directory = await mkdtemp(path.join(tmpdir(), 'textgraph-boot-handoff-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, 'wasm'));
  await writeFile(path.join(directory, 'package.json'), JSON.stringify({ type: 'module' }));
  await writeFile(path.join(directory, 'state.mjs'), 'export const state = {};');
  const { state } = await import(pathToFileURL(path.join(directory, 'state.mjs')));
  const config = { mainAssemblyName, resources: { wasmNative: [{ name: 'dotnet.native.wasm' }] } };
  if (invalidResource) config.resources.wasmNative.push({ name: '../unlisted.wasm' });
  const files = {
    'wasm/dotnet.boot.js': `import { state } from '../state.mjs';
      export const config = ${JSON.stringify(config)};
      state.boot = config;`,
    'wasm/dotnet.js': `import { state } from '../state.mjs';
      export const dotnet = {
        withConfig(config) { state.configured = config; return this; },
        withResourceLoader(loader) { state.loader = loader; return this; },
        async create() {
          if (!state.configured?.resources?.wasmNative?.length) throw new Error('Boot resources were not supplied to the runtime builder');
          state.wasm = new Uint8Array(await (await state.loader('dotnetwasm', 'dotnet.native.wasm')).arrayBuffer());
          return { async getAssemblyExports(assembly) {
            state.exportAssembly = assembly;
            return { DrawMotive: { TextGraph: { Bridge: { Program: {
              GetRuntimeInfo: () => JSON.stringify({ abiVersion: '1.0.0', protocolVersion: 1, packageKind: 'textgraph', capabilities: ['textgraph-validate-v1'] }),
              Validate: () => JSON.stringify({ protocolVersion: 1, valid: true, diagnostics: [] })
            } } } } };
          } };
        }
      };`,
    'wasm/dotnet.native.wasm': new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]),
    'wasm/DrawMotive.TextGraph.Bridge.wasm': new Uint8Array([0]),
    'wasm/DrawMotive.TextGraph.Bridge.runtimeconfig.json': '{}',
  };
  const assets = [];
  for (const [relative, content] of Object.entries(files)) {
    const bytes = typeof content === 'string' ? Buffer.from(content) : content;
    await writeFile(path.join(directory, relative), bytes);
    assets.push({ path: relative, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
      mediaType: relative.endsWith('.wasm') ? 'application/wasm' : relative.endsWith('.js') ? 'text/javascript' : 'application/json' });
  }
  const selected = { ...manifest, targetFramework, assets, capabilities: ['textgraph-validate-v1'], rendering: undefined };
  return { state, async start() {
    return startTextGraphRuntime({ resolveAsset: asset => pathToFileURL(path.join(directory, asset.path)) }, selected,
      async item => new Response(await readFile(item.url)));
  } };
}

for (const [targetFramework, mainAssemblyName] of [
  ['net10.0', 'DrawMotive.TextGraph.Bridge.dll'],
  ['net11.0', 'DrawMotive.TextGraph.Bridge'],
]) {
  test(`${targetFramework} startup gives the runtime builder the exact preflighted boot configuration`, async t => {
    const fixture = await startupFixture(t, targetFramework, mainAssemblyName);
    const runtime = await fixture.start();
    try {
      assert.equal(fixture.state.configured, fixture.state.boot);
      assert.equal(fixture.state.configured.mainAssemblyName, mainAssemblyName);
      assert.equal(fixture.state.exportAssembly, 'DrawMotive.TextGraph.Bridge.dll');
      assert.deepEqual(fixture.state.wasm, new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]));
      assert.equal(JSON.parse(runtime.validate('A -> B')).valid, true);
    } finally { await runtime.dispose(); }
  });

  test(`${targetFramework} startup never configures the runtime with unlisted boot resources`, async t => {
    const fixture = await startupFixture(t, targetFramework, mainAssemblyName, true);
    await assert.rejects(fixture.start(), { code: 'INVALID_MANIFEST' });
    assert.equal(fixture.state.configured, undefined);
  });
}
