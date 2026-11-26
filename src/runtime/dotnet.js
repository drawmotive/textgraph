import { createRuntimeAssetPlan } from './shared.js';
import { DrawMotiveError } from './errors.js';
import { validateManifest, validateBootConfig, validationCapability, renderingCapability, svgRenderingCapability, darkRenderingCapability, supportsRendering, isRuntimeAsset, protocolVersion } from './manifest.js';
import { throwIfAborted } from './lifecycle.js';
import { readVerifiedAsset } from './integrity.js';
import { createRenderingExecutor } from './render-resources.js';
import { decodeConfiguration } from './rendering.js';
import { fontCapability } from './font-resources.js';
import { createNativeHost, nativeHostModule } from './native-host.js';
import { createInventoryRenderingExecutor, inventoryCapability } from './inventory-resources.js';

/** Starts one isolated .NET module graph; platform loaders own all data I/O. */
export async function startTextGraphRuntime(options, manifest, readAsset) {
  validateManifest(manifest);
  throwIfAborted(options.signal);
  if (!globalThis.crypto?.subtle || typeof globalThis.crypto.randomUUID !== 'function') {
    throw new DrawMotiveError('UNSUPPORTED_ENVIRONMENT', 'TextGraph requires Web Crypto in HTTPS or localhost');
  }
  const plan = createRuntimeAssetPlan({ manifest: { assets: manifest.assets.filter(isRuntimeAsset) }, moduleUrl: import.meta.url, resolveAsset: options.resolveAsset });
  const byName = new Map(plan.map(item => [item.asset.path.slice(5), item]));
  const instanceKey = crypto.randomUUID();
  const moduleUrl = item => {
    const url = new URL(item.url);
    // .NET ESM modules retain mutable initialization state, so each instance needs its own graph.
    url.searchParams.set('textgraph-instance', instanceKey);
    return url.href;
  };
  let bridge;
  try {
    // .NET treats download failures as fatal and may terminate a Node host. Own
    // loading/cancellation here, before entering its non-cancellable startup.
    // Data assets are independent: start them together, but verify every response
    // before importing modules or giving .NET ownership of the bytes.
    const data = new Map(await Promise.all(plan.filter(item => !/[.](mjs|js)$/.test(item.asset.path)).map(async item => {
      throwIfAborted(options.signal);
      return [item.asset.path, await readVerifiedAsset(item, options, readAsset)];
    })));
    throwIfAborted(options.signal);
    // Detect unsupported WASM features before the runtime takes ownership of failure handling.
    await WebAssembly.compile(data.get(manifest.runtimeWasm));
    // Import dependency modules before create(): its asynchronous imports otherwise
    // turn missing modules into fatal unhandled runtime startup failures.
    let bootConfig;
    for (const item of plan) {
      if (!/[.]js$/.test(item.asset.path) || item.asset.path === manifest.runtimeModule) continue;
      let imported;
      try { imported = await import(/* webpackIgnore: true */ /* @vite-ignore */ moduleUrl(item)); }
      catch (cause) { throw new DrawMotiveError('RESOURCE_NOT_FOUND', `Could not import ${item.asset.path}`, { cause, details: { asset: item.asset.path } }); }
      if (item.asset.path === 'wasm/dotnet.boot.js') {
        bootConfig = imported.config;
        validateBootConfig(bootConfig, manifest);
      }
    }
    throwIfAborted(options.signal);
    const runtimeEntry = byName.get(manifest.runtimeModule.slice(5));
    let dotnet;
    try { ({ dotnet } = await import(/* webpackIgnore: true */ /* @vite-ignore */ moduleUrl(runtimeEntry))); }
    catch (cause) { throw new DrawMotiveError('RESOURCE_NOT_FOUND', 'Could not import the runtime module', { cause, details: { asset: runtimeEntry.asset.path } }); }
    // SDK 11 no longer loads dotnet.boot.js implicitly. Both SDKs must start
    // from the exact boot configuration whose resource authority we checked.
    const runtime = await dotnet.withConfig(bootConfig).withResourceLoader((type, name) => {
      const item = byName.get(name);
      if (!item) throw new DrawMotiveError('RESOURCE_NOT_FOUND', 'Runtime requested an unlisted asset', { details: { asset: name } });
      if (/[.](mjs|js)$/.test(name)) return moduleUrl(item);
      return Promise.resolve(new Response(data.get(item.asset.path), { headers: { 'Content-Type': item.asset.mediaType } }));
    }).create();
    throwIfAborted(options.signal);
    // Register before any export runs: the bridge binds this module on its first font or image payload.
    const host = createNativeHost(manifest.capabilities.includes(inventoryCapability));
    runtime.setModuleImports(nativeHostModule, host.imports);
    const exports = await runtime.getAssemblyExports(manifest.bridge.assembly);
    bridge = manifest.bridge.type.split('.').reduce((value, key) => value?.[key], exports);
    if (typeof bridge?.[manifest.bridge.info] !== 'function' || typeof bridge?.[manifest.bridge.validate] !== 'function') {
      throw new DrawMotiveError('ABI_MISMATCH', 'Required bridge exports are missing');
    }
    let info;
    try { info = JSON.parse(bridge[manifest.bridge.info]()); }
    catch (cause) { throw new DrawMotiveError('ABI_MISMATCH', 'Invalid bridge handshake', { cause }); }
    if (!info || info.abiVersion !== manifest.abiVersion || info.packageKind !== 'textgraph' || info.protocolVersion !== manifest.protocolVersion) {
      throw new DrawMotiveError('ABI_MISMATCH', 'Bridge and manifest disagree');
    }
    if (!Array.isArray(info.capabilities) || !info.capabilities.includes(validationCapability)) throw new DrawMotiveError('UNSUPPORTED_CAPABILITY', 'Bridge does not implement validation');
    const renders = supportsRendering(manifest.capabilities);
    for (const capability of [renderingCapability, svgRenderingCapability, darkRenderingCapability]) {
      if (manifest.capabilities.includes(capability) && !info.capabilities.includes(capability)) throw new DrawMotiveError('UNSUPPORTED_CAPABILITY', 'Bridge does not implement rendering');
    }
    for (const capability of [fontCapability, inventoryCapability]) {
      if (manifest.capabilities.includes(capability) && !info.capabilities.includes(capability)) throw new DrawMotiveError('UNSUPPORTED_CAPABILITY', 'Bridge does not implement ' + capability);
    }
    if (renders && typeof bridge[manifest.bridge.execute] !== 'function') throw new DrawMotiveError('ABI_MISMATCH', 'Rendering bridge export is missing');
    return createBridgeRuntime({ manifest, options, readAsset, bridge, info, host });
  } catch (cause) {
    bridge = undefined;
    if (cause instanceof DrawMotiveError || cause?.name === 'AbortError') throw cause;
    throw new DrawMotiveError('INITIALIZATION_FAILED', 'Could not initialize TextGraph WASM', { cause });
  }
}

/** Owns managed bridge resources; the instance queue drains calls before invoking disposal. */
export function createBridgeRuntime({ manifest, options, readAsset, bridge, info, host = createNativeHost() }) {
  const renders = supportsRendering(manifest.capabilities);
  const execute = (request, fonts) => host.run(() => bridge[manifest.bridge.execute](request), fonts);
  const inventory = options.fontAssets?.inventory;
  return {
    // A bridge may support operations intentionally omitted by the selected
    // manifest; advertise only the intersection that this loader exposes.
    abiVersion: info.abiVersion, capabilities: info.capabilities.filter(capability => manifest.capabilities.includes(capability)),
    validate: source => bridge[manifest.bridge.validate](source),
    ...(renders ? { execute: inventory
      ? createInventoryRenderingExecutor({ options, readAsset, bridge, host, execute, supported: manifest.capabilities.includes(inventoryCapability) })
      : createRenderingExecutor({ manifest, options, readAsset, execute }) } : {}),
    async dispose() {
      if (!bridge) return;
      try {
        // Release native font caches and their timers without .NET exit(), which terminates Node.
        if (renders) decodeConfiguration(host.run(() => bridge[manifest.bridge.execute](JSON.stringify({ protocolVersion, operation: 'dispose' }))).json, 'disposal');
      } catch (cause) {
        if (cause instanceof DrawMotiveError) throw cause;
        throw new DrawMotiveError('RUNTIME_FAILED', 'Native resource disposal failed', { cause });
      } finally { bridge = undefined; }
    },
  };
}
