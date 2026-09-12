import { createRuntimeAssetPlan } from './shared.js';
import { DrawMotiveError } from './errors.js';
import { startTextGraphRuntime } from './dotnet.js';

/** Browser and module Workers share URL-based startup without DOM dependencies. */
export function loadBrowserRuntime(options, manifest) {
  const fetchResource = options.fetch ?? options.adapters?.network?.fetch ?? globalThis.fetch;
  return startTextGraphRuntime(options, manifest, async (item, context) => {
    try {
      const response = await fetchResource(item.url, { signal: context.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (cause) {
      if (cause?.name === 'AbortError') throw cause;
      throw new DrawMotiveError('RESOURCE_NOT_FOUND', `Could not load ${item.asset.path}`, { cause, details: { asset: item.asset.path } });
    }
  });
}

/** Creates the browser-compatible loader for TextGraph's package-owned runtime assets. */
export function createTextGraphRuntimeLoader(options) {
  const fetchResource = options.fetch ?? globalThis.fetch;
  if (typeof fetchResource !== 'function') throw new TypeError('A fetch implementation is required');
  const plan = createRuntimeAssetPlan(options);
  return {
    plan,
    async loadAssets() {
      const loaded = new Map();
      for (const item of plan) {
        const response = await fetchResource(item.url);
        if (!response.ok) {
          throw new DrawMotiveError('RESOURCE_NOT_FOUND', `Failed to load ${item.asset.path}: HTTP ${response.status}`, {
            details: { asset: item.asset.path, status: response.status, url: item.url.href },
          });
        }
        loaded.set(item.asset.path, { ...item.asset, url: item.url, bytes: new Uint8Array(await response.arrayBuffer()) });
      }
      return loaded;
    },
  };
}
