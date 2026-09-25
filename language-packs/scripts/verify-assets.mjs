import assert from 'node:assert/strict';
import { fontCatalog } from '../index.js';
import { verifyFontAssets } from './font-assets.mjs';

assert.deepEqual(fontCatalog, await verifyFontAssets());
console.log(`Verified ${fontCatalog.fonts.length} optional TextGraph fonts.`);
