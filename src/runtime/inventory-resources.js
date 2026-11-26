import { DrawMotiveError } from './errors.js';
import { readVerifiedFontAsset } from './font-cache.js';
import { decodePreparation } from './font-resources.js';
import { readVerifiedAsset } from './integrity.js';
import { throwIfAborted } from './lifecycle.js';
import { protocolVersion } from './manifest.js';
import { decodeConfiguration } from './rendering.js';

export const inventoryCapability = 'textgraph-font-inventory-v1';
const themePath = 'static/themes.css';

/** Supplies verified distribution bytes while the native renderer owns face selection and decoding. */
export function createInventoryRenderingExecutor({ options, readAsset, bridge, host, execute, supported }) {
  const inventoryUrl = options.fontAssets.inventory;
  let configured = false;
  function resource(path, sha256, mediaType) {
    if (!/^static[/][A-Za-z0-9][A-Za-z0-9._-]*$/.test(path) || !/^[a-f0-9]{64}$/.test(sha256)) {
      throw new DrawMotiveError('INVALID_MANIFEST', 'Invalid inventory resource descriptor');
    }
    const url = new URL(path.slice('static/'.length), inventoryUrl);
    if (url.protocol === 'https:' || url.protocol === 'http:') url.searchParams.set('v', sha256);
    return { asset: { path, sha256, mediaType }, url };
  }

  return async (request, context = {}) => {
    if (!supported || typeof bridge.ConfigureInventory !== 'function' || typeof bridge.PrepareInventoryFonts !== 'function') {
      throw new DrawMotiveError('UNSUPPORTED_CAPABILITY', 'This runtime does not support a split font inventory');
    }
    const loading = { ...options, signal: context.signal };
    throwIfAborted(context.signal);
    const loadFont = (path, sha256) => readVerifiedFontAsset(resource(path, sha256, 'font/ttf'), loading, readAsset);
    if (!configured) {
      const item = { asset: { path: 'static/files.json', mediaType: 'application/json' }, url: inventoryUrl };
      const inventory = await (await readAsset(item, loading)).text();
      let metadata;
      try { metadata = JSON.parse(inventory); }
      catch (cause) { throw new DrawMotiveError('INVALID_MANIFEST', 'Invalid resource inventory', { cause }); }
      if (metadata?.schemaVersion !== 2) throw new DrawMotiveError('INVALID_MANIFEST', 'Unsupported resource inventory version');
      throwIfAborted(context.signal);
      const themeHash = metadata.files?.[themePath];
      const bytes = await readVerifiedAsset(resource(themePath, typeof themeHash === 'string' ? themeHash.toLowerCase() : undefined, 'text/css'), loading, readAsset);
      const theme = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
      throwIfAborted(context.signal);
      decodeConfiguration(await host.runInventory(() => bridge.ConfigureInventory(theme, inventory), loadFont));
      configured = true;
    }
    throwIfAborted(context.signal);
    const { source, language } = JSON.parse(request);
    let consumed = false;
    try {
      const prepared = decodePreparation(execute(JSON.stringify({ protocolVersion, operation: 'prepare-fonts', source, language })).json);
      if (!prepared.success) return { json: JSON.stringify({ protocolVersion, success: false, diagnostics: prepared.diagnostics }) };
      // An already-loaded fallback can preview an element whose preferred pack still needs loading.
      if (context.onPreview && prepared.fontRuns.some(run => run.missing || run.pendingPack)) context.onPreview(execute(request));
      throwIfAborted(context.signal);
      const json = await host.runInventory(() => bridge.PrepareInventoryFonts(source, language ?? null), loadFont);
      decodeConfiguration(json, 'font preparation');
      throwIfAborted(context.signal);
      const result = execute(request);
      consumed = true;
      return result;
    } finally {
      if (!consumed) decodeConfiguration(execute(JSON.stringify({ protocolVersion, operation: 'cancel-prepare' })).json, 'font preparation cleanup');
    }
  };
}
