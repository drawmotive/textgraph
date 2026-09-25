export * from '../index.js';
import { initializeTextGraph as initialize } from '../index.js';
import { loadNodeRuntime } from '../runtime/node.js';
import manifest from '../../generated/wasm-manifest.js';
import { DrawMotiveError } from '../runtime/errors.js';
import { normalizeFontAssets, normalizeLanguagePacks } from '../runtime/language-packs.js';

export async function initializeTextGraph(options = {}) {
  if (!options || typeof options !== 'object') throw new DrawMotiveError('INVALID_ARGUMENT', 'Initialization options must be an object');
  options = { ...options };
  // The workspace development command opts in explicitly; imports and browser
  // loaders never consult a local build directory or replace packaged assets.
  const directory = process.env.DRAWMOTIVE_TEXTGRAPH_RUNTIME;
  const languagePacks = normalizeLanguagePacks(options.languagePacks);
  let fontAssets = normalizeFontAssets(options.fontAssets);
  if (!options.loadRuntime && fontAssets?.catalog === undefined && options.languagePacks === undefined) {
    let entry;
    try { entry = import.meta.resolve('@drawmotive/textgraph-fonts'); }
    catch (error) { if (error.code !== 'ERR_MODULE_NOT_FOUND') throw error; }
    // Resolve the optional package from the installed SDK tree. A broken installed
    // package must surface its error; only absence enables the remote source.
    if (entry) {
      const pack = await import(entry);
      if (!(pack.fontCatalogUrl instanceof URL)) throw new DrawMotiveError('INVALID_MANIFEST', 'Installed font package has no catalog URL');
      fontAssets = { ...fontAssets, catalog: pack.fontCatalogUrl };
    }
  }
  return initialize({ ...options, languagePacks, fontAssets, loadRuntime: options.loadRuntime ?? (context => loadNodeRuntime(context, manifest, directory)) });
}

export const platform = 'node';
