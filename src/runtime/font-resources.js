import { DrawMotiveError } from './errors.js';
import { normalizeFontMetadata } from './language-packs.js';
import { decodeDiagnostics } from './validation.js';
import { decodeConfiguration } from './rendering.js';
import { readVerifiedAsset } from './integrity.js';
import { throwIfAborted } from './lifecycle.js';

export const fontCapability = 'textgraph-fonts-v1';
const stagingCatalog = 'https://staging.drawmotive.com/static/font-catalog.json';

export function fontBase64(bytes) {
  const chunks = [];
  for (let offset = 0; offset < bytes.length; offset += 32768) chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 32768)));
  return btoa(chunks.join(''));
}

/** Catalog paths stay within their deployment directory, independent of the hosting origin. */
function decodeCatalog(value, url) {
  try {
    if (value?.schemaVersion !== 1 || !Array.isArray(value.fonts) || !value.fonts.length) throw new Error('Invalid font catalog envelope');
    const ids = new Set(), families = new Set(), paths = new Set();
    return value.fonts.map(font => {
      if (!font || typeof font.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(font.id) || ids.has(font.id)
          || typeof font.family !== 'string' || !font.family.trim() || font.family !== font.family.trim() || families.has(font.family)
          || typeof font.path !== 'string' || !/^[A-Za-z0-9_./-]+[.](ttf|otf)$/.test(font.path) || font.path.startsWith('/')
          || font.path.split('/').some(segment => !segment || segment === '.' || segment === '..') || paths.has(font.path) || font.coverage === undefined) throw new Error('Invalid or duplicate font catalog entry');
      ids.add(font.id); families.add(font.family); paths.add(font.path);
      const metadata = normalizeFontMetadata(font);
      const source = new URL(font.path, url);
      // A stable content identity lets HTTP caches distinguish font revisions.
      // File URLs remain plain paths for local/offline hosts.
      if (['http:', 'https:'].includes(source.protocol)) source.searchParams.set('v', metadata.sha256);
      return Object.freeze({ family: font.family, source, ...metadata });
    });
  } catch (cause) {
    throw new DrawMotiveError('INVALID_MANIFEST', 'Invalid font catalog', { cause, details: { url: url.href } });
  }
}

function decodePreparation(json) {
  try {
    const value = JSON.parse(json);
    if (value?.protocolVersion !== 1 || typeof value.success !== 'boolean') throw new Error('Invalid envelope');
    const diagnostics = decodeDiagnostics(value.diagnostics, ['parse', 'semantic', 'layout', 'render', 'font']);
    if (value.success === diagnostics.some(d => d.severity === 'error')) throw new Error('Inconsistent success');
    if (!Array.isArray(value.fontRuns) || value.fontRuns.some(run => !run || typeof run.text !== 'string' || !run.text
        || typeof run.missing !== 'boolean' || (run.language !== undefined && run.language !== null && typeof run.language !== 'string'))) throw new Error('Invalid font runs');
    return { ...value, diagnostics };
  } catch (cause) {
    throw new DrawMotiveError('INVALID_RESPONSE', 'Invalid native font preparation response', { cause });
  }
}

function contains(ranges, point) {
  let low = 0, high = ranges.length - 1;
  while (low <= high) {
    const middle = (low + high) >>> 1, range = ranges[middle];
    if (point < range[0]) high = middle - 1;
    else if (point > range[1]) low = middle + 1;
    else return true;
  }
  return false;
}

function matches(font, run) {
  // Coverage overlap does not grant a language-specific pack authority for another
  // script: loading history must not turn a JP font into implicit Korean fallback.
  if (!run.language || !font.languages.some(language => language.split('-')[0] === run.language.split('-')[0])) return false;
  // Variation selectors and joiners describe shaping; they need no standalone cmap glyph.
  const points = [...run.text].filter(character => !/[\s\p{Default_Ignorable_Code_Point}]/u.test(character)).map(character => character.codePointAt(0));
  return points.length > 0 && points.every(point => contains(font.coverage, point));
}

/** Owns optional font I/O inside the instance queue; native owns text, shaping and final coverage. */
export function createFontPreparation({ options, readAsset, execute }) {
  const packs = options.languagePacks ?? [];
  const fallbackOrder = [...new Set(packs.flatMap(pack => pack.fallbackFamilies))];
  const descriptors = packs.flatMap(pack => pack.fonts);
  const explicit = fallbackOrder.map(family => descriptors.find(font => font.family === family)).filter(font => font?.coverage);
  const installed = new Set(packs.flatMap(pack => pack.fonts).filter(font => !font.coverage).map(font => font.family));
  const settings = options.fontAssets ?? {};
  // A configured package is authoritative, including its failures. Never probe another source silently.
  const catalogUrl = settings.catalog ?? (packs.length ? undefined : settings.fallback === false ? undefined : settings.fallback ?? new URL(stagingCatalog));
  let catalog;
  async function candidates(context) {
    if (!catalogUrl) return explicit;
    if (!catalog) {
      const response = await readAsset({ asset: { path: 'font-catalog.json', mediaType: 'application/json' }, url: catalogUrl }, context);
      throwIfAborted(context.signal);
      let value;
      try { value = await response.json(); }
      catch (cause) { throw new DrawMotiveError('INVALID_MANIFEST', 'Could not decode font catalog', { cause }); }
      const decoded = decodeCatalog(value, catalogUrl);
      throwIfAborted(context.signal);
      const overridden = new Set(packs.flatMap(pack => pack.fonts).map(font => font.family));
      catalog = decoded.filter(font => !overridden.has(font.family));
    }
    return [...explicit, ...catalog];
  }
  return async (request, context) => {
    const render = JSON.parse(request);
    const loading = { ...options, signal: context.signal };
    const attempted = new Set();
    let consumed = false;
    try {
      while (true) {
        throwIfAborted(context.signal);
        const prepared = decodePreparation(await execute(JSON.stringify({ protocolVersion: 1, operation: 'prepare-fonts', source: render.source, ...(render.language === undefined ? {} : { language: render.language }) })));
        throwIfAborted(context.signal);
        if (!prepared.success) return JSON.stringify({ protocolVersion: 1, success: false, diagnostics: prepared.diagnostics });
        const missing = prepared.fontRuns.filter(run => run.missing && run.language);
        if (!missing.length) break;
        const selected = new Set();
        let available = explicit;
        for (const run of missing) {
          const usable = font => !installed.has(font.family) && !attempted.has(font.family) && matches(font, run);
          let candidate = available.find(usable);
          if (!candidate && catalogUrl) {
            available = await candidates(loading);
            candidate = available.find(usable);
          }
          if (candidate) selected.add(candidate);
        }
        if (!selected.size) break;
        const fonts = [];
        for (const font of selected) {
          attempted.add(font.family);
          throwIfAborted(context.signal);
          const bytes = await readVerifiedAsset({ asset: { path: `font:${font.family}`, bytes: font.bytes, sha256: font.sha256, mediaType: 'font/ttf' }, url: font.source }, loading,
            font.source instanceof Uint8Array ? async () => new Response(font.source) : readAsset);
          throwIfAborted(context.signal);
          fonts.push({ family: font.family, data: fontBase64(bytes), languages: font.languages });
        }
        const installedAfter = new Set([...installed, ...fonts.map(font => font.family)]);
        const order = [...fallbackOrder, ...(catalog ?? []).map(font => font.family)].filter(family => installedAfter.has(family));
        decodeConfiguration(await execute(JSON.stringify({ protocolVersion: 1, operation: 'install-fonts', fonts, fallbackFamilies: order })), 'font installation');
        // Native has committed before cancellation can be observed: preserve that installation identity.
        for (const font of fonts) installed.add(font.family);
      }
      throwIfAborted(context.signal);
      const result = await execute(request);
      consumed = true;
      return result;
    } finally {
      if (!consumed) decodeConfiguration(await execute(JSON.stringify({ protocolVersion: 1, operation: 'cancel-prepare' })), 'font preparation cleanup');
    }
  };
}
