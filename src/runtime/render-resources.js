import { createRuntimeAssetPlan } from './shared.js';
import { readVerifiedAsset } from './integrity.js';
import { decodeConfiguration } from './rendering.js';
import { throwIfAborted } from './lifecycle.js';
import { createFontPreparation, fontBase64 as base64, fontCapability } from './font-resources.js';
import { DrawMotiveError } from './errors.js';

/** Preparation lives inside the instance operation queue; validation never triggers font I/O. */
export function createRenderingExecutor({ manifest, options, readAsset, execute }) {
  let configured = false;
  const lazy = manifest.capabilities?.includes(fontCapability);
  const prepareFonts = lazy ? createFontPreparation({ options, readAsset, execute }) : undefined;
  return async (request, context = {}) => {
    const loadingOptions = { ...options, signal: context.signal };
    throwIfAborted(context.signal);
    if (!lazy && options.fontAssets?.catalog) throw new DrawMotiveError('UNSUPPORTED_CAPABILITY', 'This runtime does not support lazy font assets');
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
          if (lazy && font.coverage) continue;
          throwIfAborted(context.signal);
          const item = { asset: { path: `font:${font.family}`, mediaType: 'font/ttf', bytes: font.bytes, sha256: font.sha256 }, url: font.source };
          const bytes = font.coverage
            ? await readVerifiedAsset(item, loadingOptions, font.source instanceof Uint8Array ? async () => new Response(font.source) : readAsset)
            : font.source instanceof Uint8Array ? font.source : new Uint8Array(await (await readAsset(item, loadingOptions)).arrayBuffer());
          throwIfAborted(context.signal);
          fonts.push({ family: font.family, data: base64(bytes), ...(font.languages ? { languages: font.languages } : {}) });
        }
        for (const family of pack.fallbackFamilies) if (fonts.some(font => font.family === family) && !fallbackFamilies.includes(family)) fallbackFamilies.push(family);
      }
      throwIfAborted(context.signal);
      decodeConfiguration(await execute(JSON.stringify({ protocolVersion: 1, operation: 'configure', theme, fonts, fallbackFamilies })));
      // Native configuration is committed even when the caller cancels during that synchronous operation.
      configured = true;
      throwIfAborted(context.signal);
    }
    return prepareFonts ? prepareFonts(request, context) : execute(request);
  };
}
