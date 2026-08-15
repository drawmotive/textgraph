import { resolveRuntimeAssets } from './assets.js';

/** Resolves every manifest asset while preserving the initial loader's baseUrl option. */
export function createRuntimeAssetPlan({ manifest, baseUrl, moduleUrl, resolveAsset }) {
  if (baseUrl) {
    const base = new URL(baseUrl);
    return resolveRuntimeAssets({
      manifest,
      moduleUrl,
      resolveAsset: (asset, _defaultUrl) => {
        const defaultUrl = new URL(asset.path, base);
        return resolveAsset ? resolveAsset(asset, defaultUrl) : defaultUrl;
      },
    });
  }
  return resolveRuntimeAssets({ manifest, moduleUrl, resolveAsset });
}
