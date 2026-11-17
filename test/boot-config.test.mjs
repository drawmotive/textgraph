import assert from 'node:assert/strict';
import test from 'node:test';
import manifest from '../generated/wasm-manifest.js';
import { config } from '../generated/wasm/dotnet.boot.js';
import { validateBootConfig } from '../src/runtime/manifest.js';

for (const [targetFramework, mainAssemblyName, otherFrameworkName] of [
  ['net10.0', 'DrawMotive.TextGraph.Bridge.dll', 'DrawMotive.TextGraph.Bridge'],
  ['net11.0', 'DrawMotive.TextGraph.Bridge', 'DrawMotive.TextGraph.Bridge.dll'],
]) {
  test(`${targetFramework} boot metadata uses its SDK assembly identity without changing export lookup`, () => {
    const selected = { ...manifest, targetFramework };
    assert.doesNotThrow(() => validateBootConfig({ ...config, mainAssemblyName }, selected));
    assert.equal(selected.bridge.assembly, 'DrawMotive.TextGraph.Bridge.dll');
  });

  test(`${targetFramework} boot metadata rejects foreign assembly identities and assembly paths`, () => {
    const selected = { ...manifest, targetFramework };
    for (const name of [otherFrameworkName, 'Other', 'Other.dll', '../' + mainAssemblyName, mainAssemblyName + '.bak', mainAssemblyName + '?spoof=1']) {
      assert.throws(() => validateBootConfig({ ...config, mainAssemblyName: name }, selected), { code: 'ABI_MISMATCH' }, name);
    }
  });

  test(`${targetFramework} boot metadata cannot escape or expand the manifest resource authority`, () => {
    const selected = { ...manifest, targetFramework };
    for (const name of ['missing.wasm', '../dotnet.native.wasm', 'wasm/dotnet.native.wasm']) {
      const boot = { ...structuredClone(config), mainAssemblyName };
      boot.resources.assembly.push({ name });
      assert.throws(() => validateBootConfig(boot, selected), { code: 'INVALID_MANIFEST' }, name);
    }
  });
}

for (const targetFramework of ['net9.0', 'net12.0', 'net11.0-browser', undefined]) {
  test(`boot metadata does not infer a supported assembly identity for ${String(targetFramework)}`, () => {
    for (const mainAssemblyName of ['DrawMotive.TextGraph.Bridge.dll', 'DrawMotive.TextGraph.Bridge']) {
      assert.throws(() => validateBootConfig({ ...config, mainAssemblyName }, { ...manifest, targetFramework }), { code: 'ABI_MISMATCH' });
    }
  });
}

test('boot configuration cannot introduce unlisted assets into native startup', () => {
  assert.doesNotThrow(() => validateBootConfig(config, manifest));
  const stale = structuredClone(config);
  stale.resources.assembly.push({ name: 'missing.wasm' });
  assert.throws(() => validateBootConfig(stale, manifest), { code: 'INVALID_MANIFEST' });
  assert.throws(() => validateBootConfig({ ...config, mainAssemblyName: 'Other.dll' }, manifest), { code: 'ABI_MISMATCH' });
});
