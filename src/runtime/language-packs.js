import { DrawMotiveError } from './errors.js';

const defaultFamilies = ['NotoSans-Regular', 'FuzzyBubbles-Regular'];
const fail = message => { throw new DrawMotiveError('INVALID_ARGUMENT', message); };

function copyUrl(value, name) {
  if (!(value instanceof URL) || !['https:', 'http:', 'file:', 'data:', 'blob:'].includes(value.protocol)) fail(`${name} must be a supported URL`);
  return new URL(value.href);
}

/** Host configuration selects a source, never probes the network during initialization. */
export function normalizeFontAssets(value = {}) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail('fontAssets must be an object');
  if (value.fallback !== undefined && value.fallback !== false && !(value.fallback instanceof URL)) fail('fontAssets.fallback must be false or a catalog URL');
  return Object.freeze({
    ...(value.catalog === undefined ? {} : { catalog: copyUrl(value.catalog, 'fontAssets.catalog') }),
    ...(value.fallback === undefined ? {} : { fallback: value.fallback === false ? false : copyUrl(value.fallback, 'fontAssets.fallback') }),
  });
}

/** Official lazy descriptors carry complete immutable coverage and content identity. */
export function normalizeFontMetadata(font) {
  if (font.coverage === undefined) return {};
  if (!Array.isArray(font.coverage) || !font.coverage.length || !Array.isArray(font.languages) || !font.languages.length
      || !font.languages.every(language => typeof language === 'string' && /^[a-z]{2,8}(?:-[A-Za-z0-9]+)*$/.test(language))
      || !Number.isSafeInteger(font.bytes) || font.bytes <= 0 || !/^[a-f0-9]{64}$/.test(font.sha256)) fail('Lazy fonts require coverage, languages, bytes and sha256');
  let end = -1;
  const coverage = font.coverage.map(range => {
    if (!Array.isArray(range) || range.length !== 2 || !range.every(Number.isSafeInteger) || range[0] <= end || range[0] < 0 || range[1] < range[0] || range[1] > 0x10ffff) fail('Font coverage must contain sorted non-overlapping Unicode ranges');
    end = range[1];
    return Object.freeze([...range]);
  });
  return { coverage: Object.freeze(coverage), languages: Object.freeze([...font.languages]), bytes: font.bytes, sha256: font.sha256 };
}

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
      return Object.freeze({ family: font.family, source, ...normalizeFontMetadata(font) });
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
