import { DrawMotiveError } from './errors.js';

/** Check package-owned data before passing it to native code, including lazy render resources. */
export async function readVerifiedAsset(item, options, readAsset) {
  const response = await readAsset(item, options);
  const bytes = new Uint8Array(await response.arrayBuffer());
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), byte => byte.toString(16).padStart(2, '0')).join('');
  if (bytes.byteLength !== item.asset.bytes || hash !== item.asset.sha256) {
    throw new DrawMotiveError('ASSET_INTEGRITY_MISMATCH', `Asset integrity failed: ${item.asset.path}`, { details: { asset: item.asset.path } });
  }
  return bytes;
}
