import { createRuntimeAssetPlan } from './shared.js';
import { readVerifiedAsset } from './integrity.js';
import { decodeConfiguration } from './rendering.js';
import { throwIfAborted } from './lifecycle.js';

function base64(bytes) {
  const chunks = [];
  for (let offset = 0; offset < bytes.length; offset += 32768) chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 32768)));
  return btoa(chunks.join(''));
}

/** Preparation lives inside the instance operation queue; validation never triggers font I/O. */
export function createRenderingExecutor({ manifest, options, readAsset, execute }) {
  let configured = false;
  return async (request, context = {}) => {
    const loadingOptions = { ...options, signal: context.signal };
    throwIfAborted(context.signal);
    if (!configured) {
      const selected = new Set([manifest.rendering.theme, ...manifest.rendering.fonts.map(font => font.asset)]);
      const plan = createRuntimeAssetPlan({ manifest: { assets: manifest.assets.filter(asset => selected.has(asset.path)) }, moduleUrl: import.meta.url, resolveAsset: options.resolveAsset });
      const byPath = new Map(plan.map(item => [item.asset.path, item]));
      const load = async path => {
        throwIfAborted(context.signal);
        const bytes = await readVerifiedAsset(byPath.get(path), loadingOptions, readAsset);
        throwIfAborted(context.signal);
        return bytes;
      };
      const theme = new TextDecoder('utf-8', { fatal: true }).decode(await load(manifest.rendering.theme));
      const fonts = [];
      for (const font of manifest.rendering.fonts) fonts.push({ family: font.family, data: base64(await load(font.asset)) });
      const fallbackFamilies = [];
      for (const pack of options.languagePacks ?? []) {
        for (const font of pack.fonts) {
          throwIfAborted(context.signal);
          const bytes = font.source instanceof Uint8Array ? font.source : new Uint8Array(await (await readAsset({
            asset: { path: `font:${font.family}`, mediaType: 'font/ttf' }, url: font.source,
          }, loadingOptions)).arrayBuffer());
          throwIfAborted(context.signal);
          fonts.push({ family: font.family, data: base64(bytes) });
        }
        for (const family of pack.fallbackFamilies) if (!fallbackFamilies.includes(family)) fallbackFamilies.push(family);
      }
      throwIfAborted(context.signal);
      decodeConfiguration(await execute(JSON.stringify({ protocolVersion: 1, operation: 'configure', theme, fonts, fallbackFamilies })));
      // Native configuration is committed even when the caller cancels during that synchronous operation.
      configured = true;
      throwIfAborted(context.signal);
    }
    return execute(request);
  };
}
