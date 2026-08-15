import { createRuntimeAssetPlan } from './shared.js';
import { DrawMotiveError } from './errors.js';

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
