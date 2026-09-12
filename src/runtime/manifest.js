import { DrawMotiveError } from './errors.js';

export const validationCapability = 'textgraph-validate-v1';
export const renderingCapability = 'textgraph-render-v1';

/** Only native runtime formats belong to startup; fonts, themes and licenses are separate assets. */
export function isRuntimeAsset(asset) {
  return /[.](wasm|js|mjs|json|dat)$/.test(asset.path);
}

/** Boot metadata cannot expand the preflighted asset authority after native startup begins. */
export function validateBootConfig(config, manifest) {
  if (config?.mainAssemblyName !== manifest.bridge.assembly) throw new DrawMotiveError('ABI_MISMATCH', 'Unexpected boot entry assembly');
  const paths = new Set(manifest.assets.filter(isRuntimeAsset).map(asset => asset.path.slice(5)));
  if (!config.resources || typeof config.resources !== 'object') throw new DrawMotiveError('INVALID_MANIFEST', 'Missing boot resources');
  const visit = value => {
    if (!value || typeof value !== 'object') return;
    if (Object.hasOwn(value, 'name') && !paths.has(value.name)) throw new DrawMotiveError('INVALID_MANIFEST', 'Boot resource is absent from the asset manifest', { details: { asset: value.name } });
    Object.values(value).forEach(visit);
  };
  visit(config.resources);
}

/** Reject incompatible bundles and ambiguous paths before any executable asset is imported. */
export function validateManifest(manifest) {
  const invalid = () => { throw new DrawMotiveError('INVALID_MANIFEST', 'Invalid TextGraph runtime manifest'); };
  if (!manifest || manifest.schemaVersion !== 1 || manifest.packageName !== '@drawmotive/textgraph'
      || typeof manifest.packageVersion !== 'string' || !manifest.packageVersion || manifest.protocolVersion !== 1
      || manifest.targetFramework !== 'net10.0' || !/^[a-f0-9]{40}$/.test(manifest.privateSource?.commit ?? '')
      || manifest.privateSource?.project !== 'DrawMotive.TextGraph.Bridge' || !Array.isArray(manifest.assets)) invalid();
  if (manifest.abiVersion !== '1.0.0') throw new DrawMotiveError('ABI_MISMATCH', 'Unsupported TextGraph ABI');
  if (!Array.isArray(manifest.capabilities) || !manifest.capabilities.every(item => typeof item === 'string')) invalid();
  if (!manifest.capabilities.includes(validationCapability)) throw new DrawMotiveError('UNSUPPORTED_CAPABILITY', 'Validation capability is missing');
  const paths = new Set();
  for (const asset of manifest.assets) {
    if (!asset || !/^wasm[/][A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(asset.path) || paths.has(asset.path)
        || /[.](pdb|map|br|gz|cs)$/.test(asset.path) || !/^[a-f0-9]{64}$/.test(asset.sha256)
        || !Number.isSafeInteger(asset.bytes) || asset.bytes < 0 || typeof asset.mediaType !== 'string') invalid();
    paths.add(asset.path);
  }
  for (const key of ['runtimeModule', 'entryAssembly', 'runtimeWasm', 'runtimeConfig']) if (!paths.has(manifest[key])) invalid();
  if (!paths.has('wasm/dotnet.boot.js') || manifest.bridge?.assembly !== 'DrawMotive.TextGraph.Bridge.dll'
      || manifest.bridge?.type !== 'DrawMotive.TextGraph.Bridge.Program' || manifest.bridge?.info !== 'GetRuntimeInfo'
      || manifest.bridge?.validate !== 'Validate') invalid();
  if (manifest.bridge.execute !== undefined && manifest.bridge.execute !== 'Execute') invalid();
  if (manifest.capabilities.includes(renderingCapability) && (!manifest.rendering || manifest.bridge.execute !== 'Execute')) invalid();
  if (manifest.rendering !== undefined) {
    const rendering = manifest.rendering;
    if (!rendering || !paths.has(rendering.theme) || !rendering.theme.endsWith('.css')
        || !Array.isArray(rendering.fonts) || rendering.fonts.length === 0) invalid();
    const families = new Set();
    const fontPaths = new Set();
    for (const font of rendering.fonts) {
      if (!font || typeof font.family !== 'string' || !font.family.trim() || font.family !== font.family.trim()
          || families.has(font.family) || fontPaths.has(font.asset) || !paths.has(font.asset) || !/[.](ttf|otf)$/.test(font.asset)) invalid();
      families.add(font.family); fontPaths.add(font.asset);
    }
  }
  return manifest;
}
