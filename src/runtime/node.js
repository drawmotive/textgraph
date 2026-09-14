import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { startTextGraphRuntime } from './dotnet.js';
import { DrawMotiveError } from './errors.js';

/** Node file loading is isolated from the browser module graph. */
export async function loadNodeRuntime(options, manifest, directory) {
  if (directory !== undefined) {
    if (!path.isAbsolute(directory)) throw new DrawMotiveError('INVALID_ARGUMENT', 'DRAWMOTIVE_TEXTGRAPH_RUNTIME must be an absolute generated directory');
    const manifestPath = path.join(directory, 'wasm-manifest.json');
    let json;
    try { json = await readFile(manifestPath, { encoding: 'utf8', signal: options.signal }); }
    catch (cause) {
      if (cause?.name === 'AbortError') throw cause;
      throw new DrawMotiveError('RESOURCE_NOT_FOUND', 'Could not read the selected local runtime manifest', { cause, details: { manifest: manifestPath } });
    }
    try { manifest = JSON.parse(json); }
    catch (cause) { throw new DrawMotiveError('INVALID_MANIFEST', 'The selected local runtime manifest is not valid JSON', { cause }); }
    const resolveAsset = options.resolveAsset;
    // Use the selected manifest and directory together for every native module,
    // theme and font. A missing local artifact must never load packaged bytes.
    options = { ...options, resolveAsset: asset => {
      const defaultUrl = pathToFileURL(path.join(directory, asset.path));
      return resolveAsset ? resolveAsset(asset, defaultUrl) : defaultUrl;
    } };
  }
  return startTextGraphRuntime(options, manifest, async (item, context) => {
    try {
      if (item.url.protocol === 'file:') {
        return new Response(await readFile(item.url, { signal: context.signal }), { headers: { 'Content-Type': item.asset.mediaType } });
      }
      const fetchResource = context.fetch ?? context.adapters?.network?.fetch ?? globalThis.fetch;
      const response = await fetchResource(item.url, { signal: context.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (cause) {
      if (cause?.name === 'AbortError') throw cause;
      throw new DrawMotiveError('RESOURCE_NOT_FOUND', `Could not load ${item.asset.path}`, { cause, details: { asset: item.asset.path } });
    }
  });
}
