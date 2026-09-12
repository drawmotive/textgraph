import { readFile } from 'node:fs/promises';
import { startTextGraphRuntime } from './dotnet.js';
import { DrawMotiveError } from './errors.js';

/** Node file loading is isolated from the browser module graph. */
export function loadNodeRuntime(options, manifest) {
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
