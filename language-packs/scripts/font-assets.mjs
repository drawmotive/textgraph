import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

/** Reads actual Unicode cmap mappings, excluding .notdef, rather than inferring coverage from a font name. */
export function readFontCoverage(bytes) {
  const data = Buffer.from(bytes);
  const tableCount = data.readUInt16BE(4);
  let cmap;
  for (let index = 0; index < tableCount; index++) {
    const record = 12 + index * 16;
    if (data.toString('ascii', record, record + 4) === 'cmap') {
      const offset = data.readUInt32BE(record + 8);
      cmap = data.subarray(offset, offset + data.readUInt32BE(record + 12));
      break;
    }
  }
  if (!cmap) throw new Error('Font has no cmap table');
  const codepoints = new Set();
  const visited = new Set();
  let supported = false;
  for (let index = 0; index < cmap.readUInt16BE(2); index++) {
    const record = 4 + index * 8;
    const platform = cmap.readUInt16BE(record);
    const encoding = cmap.readUInt16BE(record + 2);
    if (platform !== 0 && !(platform === 3 && (encoding === 1 || encoding === 10))) continue;
    const offset = cmap.readUInt32BE(record + 4);
    if (visited.has(offset)) continue;
    visited.add(offset);
    const format = cmap.readUInt16BE(offset);
    if (format === 12) {
      supported = true;
      for (let group = 0; group < cmap.readUInt32BE(offset + 12); group++) {
        const start = offset + 16 + group * 12;
        const first = cmap.readUInt32BE(start);
        const last = cmap.readUInt32BE(start + 4);
        const glyph = cmap.readUInt32BE(start + 8);
        if (last > 0x10ffff || first > last) throw new Error('Invalid cmap Unicode range');
        for (let cp = first; cp <= last; cp++) if (glyph + cp - first !== 0) codepoints.add(cp);
      }
    } else if (format === 4) {
      supported = true;
      const count = cmap.readUInt16BE(offset + 6) / 2;
      const ends = offset + 14;
      const starts = ends + count * 2 + 2;
      const deltas = starts + count * 2;
      const offsets = deltas + count * 2;
      for (let segment = 0; segment < count; segment++) {
        const first = cmap.readUInt16BE(starts + segment * 2);
        const last = cmap.readUInt16BE(ends + segment * 2);
        const delta = cmap.readInt16BE(deltas + segment * 2);
        const rangeOffset = cmap.readUInt16BE(offsets + segment * 2);
        for (let cp = first; cp <= last && cp < 0xffff; cp++) {
          const raw = rangeOffset === 0 ? cp : cmap.readUInt16BE(offsets + segment * 2 + rangeOffset + (cp - first) * 2);
          const glyph = rangeOffset !== 0 && raw === 0 ? 0 : (raw + delta) & 0xffff;
          if (glyph !== 0) codepoints.add(cp);
        }
      }
    }
  }
  if (!supported || codepoints.size === 0) throw new Error('Font has no supported Unicode cmap mappings');
  const coverage = [];
  for (const cp of [...codepoints].sort((left, right) => left - right)) {
    if (cp >= 0xd800 && cp <= 0xdfff) continue;
    const previous = coverage.at(-1);
    if (previous && cp === previous[1] + 1) previous[1] = cp;
    else coverage.push([cp, cp]);
  }
  return coverage;
}

export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

/** All paths in a deployed catalog are relative to that catalog's directory. */
export function assetUrl(relative, root) {
  if (typeof relative !== 'string' || !/^[A-Za-z0-9._/-]+$/u.test(relative) || relative.split('/').some(part => !part || part === '..' || part === '.')) {
    throw new Error(`Invalid font asset path: ${relative}`);
  }
  return new URL(relative, root);
}

/** Verifies packaged/deployed bytes and metadata before copying or publishing them. */
export async function verifyFontAssets(root = new URL('../assets/', import.meta.url)) {
  const catalog = JSON.parse(await readFile(new URL('font-catalog.json', root), 'utf8'));
  const files = JSON.parse(await readFile(new URL('files.json', root), 'utf8'));
  const provenance = JSON.parse(await readFile(new URL('provenance.json', root), 'utf8'));
  if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.fonts) || catalog.fonts.length === 0) throw new Error('Invalid font catalog');
  if (Object.keys(files).length !== catalog.fonts.length) throw new Error('Font hash manifest does not match catalog');
  const ids = new Set();
  const paths = new Set();
  for (const font of catalog.fonts) {
    if (typeof font.id !== 'string' || !font.id || typeof font.family !== 'string' || !font.family || !Array.isArray(font.languages) || font.languages.length === 0 || !font.languages.every(language => typeof language === 'string' && language.length > 0)) throw new Error('Invalid font catalog identity/languages');
    if (ids.has(font.id) || paths.has(font.path)) throw new Error('Duplicate font catalog identity/path');
    ids.add(font.id);
    paths.add(font.path);
    const bytes = await readFile(assetUrl(font.path, root));
    if (bytes.length !== font.bytes || sha256(bytes) !== font.sha256 || files[font.path] !== font.sha256) throw new Error(`Font integrity mismatch: ${font.path}`);
    if (JSON.stringify(readFontCoverage(bytes)) !== JSON.stringify(font.coverage)) throw new Error(`Font coverage mismatch: ${font.path}`);
    const source = provenance.fonts.find(item => item.id === font.id);
    if (!source || source.sha256 !== font.sha256 || source.path !== font.path || !source.source.includes(source.revision)) throw new Error(`Missing pinned font provenance: ${font.path}`);
    const license = await readFile(assetUrl(font.license, root), 'utf8');
    if (!license.includes('SIL OPEN FONT LICENSE')) throw new Error(`Missing font license: ${font.path}`);
  }
  if (!(await readFile(new URL('NotoColorEmoji.NOTICE.txt', root), 'utf8')).includes('Copyright 2022 Google Inc.')) throw new Error('Missing emoji copyright notice');
  return catalog;
}
