import { zhCN } from './zh-cn/index.js';
import { ja } from './ja/index.js';
import { emoji } from './emoji/index.js';

/** Metadata imports never read font binaries; the renderer selects them on demand. */
export { fontCatalog } from './descriptor.js';
export { zhCN, ja, emoji };
export const languagePacks = Object.freeze([zhCN, ja, emoji]);
export const fontAssetsUrl = new URL('./assets/', import.meta.url);
export const fontCatalogUrl = new URL('./assets/font-catalog.json', import.meta.url);
