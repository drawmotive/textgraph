import { createRuntimeAssetPlan } from './shared.js';
import { DrawMotiveError } from './errors.js';
import { validateManifest, validateBootConfig, validationCapability, renderingCapability, isRuntimeAsset } from './manifest.js';
import { throwIfAborted } from './lifecycle.js';
import { readVerifiedAsset } from './integrity.js';
import { createRenderingExecutor } from './render-resources.js';
import { decodeConfiguration } from './rendering.js';

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
    const data = new Map();
    for (const item of plan) {
      throwIfAborted(options.signal);
      if (/[.](mjs|js)$/.test(item.asset.path)) continue;
      data.set(item.asset.path, await readVerifiedAsset(item, options, readAsset));
    }
    throwIfAborted(options.signal);
    // Detect unsupported WASM features before the runtime takes ownership of failure handling.
    await WebAssembly.compile(data.get(manifest.runtimeWasm));
    // Import dependency modules before create(): its asynchronous imports otherwise
    // turn missing modules into fatal unhandled runtime startup failures.
    for (const item of plan) {
      if (!/[.]js$/.test(item.asset.path) || item.asset.path === manifest.runtimeModule) continue;
      let imported;
      try { imported = await import(/* webpackIgnore: true */ /* @vite-ignore */ moduleUrl(item)); }
      catch (cause) { throw new DrawMotiveError('RESOURCE_NOT_FOUND', `Could not import ${item.asset.path}`, { cause, details: { asset: item.asset.path } }); }
      if (item.asset.path === 'wasm/dotnet.boot.js') validateBootConfig(imported.config, manifest);
    }
    throwIfAborted(options.signal);
    const runtimeEntry = byName.get(manifest.runtimeModule.slice(5));
    let dotnet;
    try { ({ dotnet } = await import(/* webpackIgnore: true */ /* @vite-ignore */ moduleUrl(runtimeEntry))); }
    catch (cause) { throw new DrawMotiveError('RESOURCE_NOT_FOUND', 'Could not import the runtime module', { cause, details: { asset: runtimeEntry.asset.path } }); }
    const runtime = await dotnet.withResourceLoader((type, name) => {
      const item = byName.get(name);
      if (!item) throw new DrawMotiveError('RESOURCE_NOT_FOUND', 'Runtime requested an unlisted asset', { details: { asset: name } });
      if (/[.](mjs|js)$/.test(name)) return moduleUrl(item);
      return Promise.resolve(new Response(data.get(item.asset.path), { headers: { 'Content-Type': item.asset.mediaType } }));
    }).create();
    throwIfAborted(options.signal);
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
    const renders = manifest.capabilities.includes(renderingCapability);
    if (renders && !info.capabilities.includes(renderingCapability)) throw new DrawMotiveError('UNSUPPORTED_CAPABILITY', 'Bridge does not implement rendering');
    if (renders && typeof bridge[manifest.bridge.execute] !== 'function') throw new DrawMotiveError('ABI_MISMATCH', 'Rendering bridge export is missing');
    return createBridgeRuntime({ manifest, options, readAsset, bridge, info });
  } catch (cause) {
    bridge = undefined;
    if (cause instanceof DrawMotiveError || cause?.name === 'AbortError') throw cause;
    throw new DrawMotiveError('INITIALIZATION_FAILED', 'Could not initialize TextGraph WASM', { cause });
  }
}

/** Owns managed bridge resources; the instance queue drains calls before invoking disposal. */
export function createBridgeRuntime({ manifest, options, readAsset, bridge, info }) {
  const renders = manifest.capabilities.includes(renderingCapability);
  return {
    // A bridge may support operations intentionally omitted by the selected
    // manifest; advertise only the intersection that this loader exposes.
    abiVersion: info.abiVersion, capabilities: info.capabilities.filter(capability => manifest.capabilities.includes(capability)),
    validate: source => bridge[manifest.bridge.validate](source),
    ...(renders ? { execute: createRenderingExecutor({ manifest, options, readAsset, execute: request => bridge[manifest.bridge.execute](request) }) } : {}),
    async dispose() {
      if (!bridge) return;
      try {
        // Release native font caches and their timers without .NET exit(), which terminates Node.
        if (renders) decodeConfiguration(await bridge[manifest.bridge.execute](JSON.stringify({ protocolVersion: 1, operation: 'dispose' })), 'disposal');
      } catch (cause) {
        if (cause instanceof DrawMotiveError) throw cause;
        throw new DrawMotiveError('RUNTIME_FAILED', 'Native resource disposal failed', { cause });
      } finally { bridge = undefined; }
    },
  };
}
