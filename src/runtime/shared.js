/** Resolves every manifest asset relative to a package-owned generated directory. */
export function createRuntimeAssetPlan({ manifest, baseUrl, resolveAsset }) {
  const base = new URL(baseUrl);
  return manifest.assets.map((asset) => {
    const defaultUrl = new URL(asset.path.replace(/^wasm\//, 'wasm/'), base);
    const resolved = resolveAsset ? resolveAsset(asset, defaultUrl) : defaultUrl;
    return { asset, url: resolved instanceof URL ? resolved : new URL(resolved) };
  });
}
