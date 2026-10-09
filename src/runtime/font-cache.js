import { readVerifiedAsset } from './integrity.js';
import { throwIfAborted } from './lifecycle.js';

const cacheName = 'textgraph-fonts-v1';

/** HTTP fonts are immutable by content hash. Cache verified bytes in browsers
 * and Workers without requiring host headers or a service worker; local files
 * stay authoritative. Storage is optional and cannot turn valid I/O into failure. */
export async function readVerifiedFontAsset(item, options, readAsset) {
  if (!['http:', 'https:'].includes(item.url?.protocol)) return readVerifiedAsset(item, options, readAsset);
  const url = new URL(item.url);
  url.searchParams.set('v', item.asset.sha256);
  const versioned = { ...item, url };
  let cache;
  try { cache = await globalThis.caches?.open(cacheName); } catch { /* Private contexts may deny storage. */ }
  throwIfAborted(options.signal);
  let cached;
  try { cached = await cache?.match(url.href); } catch { /* Read from the configured source instead. */ }
  throwIfAborted(options.signal);
  if (cached) {
    try {
      const bytes = await readVerifiedAsset(versioned, options, async () => cached);
      throwIfAborted(options.signal);
      return bytes;
    } catch {
      throwIfAborted(options.signal);
      // A damaged entry grants no authority: evict and verify the original source.
      try { await cache.delete(url.href); } catch { /* A new download can still succeed. */ }
    }
  }
  const bytes = await readVerifiedAsset(versioned, options, readAsset);
  throwIfAborted(options.signal);
  try { await cache?.put(url.href, new Response(bytes, { headers: { 'Content-Type': 'font/ttf' } })); } catch { /* Quota and storage failures are non-fatal. */ }
  throwIfAborted(options.signal);
  return bytes;
}
