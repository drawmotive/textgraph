import { DrawMotiveError } from './errors.js';

const defaultFamilies = ['NotoSans-Regular', 'FuzzyBubbles-Regular'];

/** Copy caller-owned font descriptors before asynchronous startup without performing font I/O. */
export function normalizeLanguagePacks(packs = []) {
  const invalid = message => { throw new DrawMotiveError('INVALID_ARGUMENT', message); };
  if (!Array.isArray(packs)) invalid('languagePacks must be an array');
  const families = new Set(defaultFamilies);
  const normalized = packs.map(pack => {
    if (!pack || !Array.isArray(pack.fonts) || pack.fonts.length === 0) invalid('Each language pack must contain a non-empty fonts array');
    const fonts = pack.fonts.map(font => {
      if (!font || typeof font.family !== 'string' || !font.family.trim() || font.family !== font.family.trim()) invalid('Font family must be a non-empty trimmed string');
      if (families.has(font.family)) invalid(`Duplicate font family: ${font.family}`);
      families.add(font.family);
      let source;
      if (font.source instanceof URL) {
        if (!['https:', 'http:', 'file:', 'data:', 'blob:'].includes(font.source.protocol)) invalid(`Unsupported font URL protocol: ${font.source.protocol}`);
        source = new URL(font.source.href);
      } else if (font.source instanceof Uint8Array && font.source.byteLength > 0) source = new Uint8Array(font.source);
      else invalid(`Font ${font.family} source must be a URL or non-empty Uint8Array`);
      return Object.freeze({ family: font.family, source });
    });
    const fallbackFamilies = pack.fallbackFamilies ?? [];
    if (!Array.isArray(fallbackFamilies) || !fallbackFamilies.every(family => typeof family === 'string' && family.trim() && family === family.trim())) invalid('fallbackFamilies must be an array of font family names');
    return Object.freeze({ fonts: Object.freeze(fonts), fallbackFamilies: Object.freeze([...fallbackFamilies]) });
  });
  for (const pack of normalized) for (const family of pack.fallbackFamilies) {
    if (!families.has(family)) invalid(`Fallback font family is not configured: ${family}`);
  }
  return Object.freeze(normalized);
}
