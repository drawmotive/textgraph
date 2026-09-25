import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import test from 'node:test';
import { fontCatalog, languagePacks, zhCN, ja, emoji } from '../index.js';
import { copyFonts } from '../scripts/copy-fonts.mjs';
import { readFontCoverage, verifyFontAssets } from '../scripts/font-assets.mjs';

const run = promisify(execFile);
const root = path.resolve(import.meta.dirname, '..');
const includes = (font, cp) => font.coverage.some(([start, end]) => start <= cp && cp <= end);

test('catalog identities, actual font coverage, hashes and licenses agree', async () => {
  assert.deepEqual(await verifyFontAssets(), fontCatalog);
  assert.deepEqual(languagePacks, [zhCN, ja, emoji]);
  for (const [pack, language, text] of [[zhCN, 'zh', '开始结束中文漢字繁體龍門臺灣'], [ja, 'ja', '日本語ひらがなカタカナ'], [emoji, 'emoji', '😀👨👩👧👦🇨🇳🏽']]) {
    assert.deepEqual(pack.fonts[0].languages, [language]);
    assert.ok(Object.isFrozen(pack.fonts[0].coverage));
    for (const character of text) assert.ok(includes(pack.fonts[0], character.codePointAt(0)), `${language} lacks ${character}`);
    assert.equal((await readFile(pack.fonts[0].source)).length, pack.fonts[0].bytes);
  }
  assert.equal(zhCN.fonts[0].sha256, 'a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da');
});

test('cmap coverage excludes missing glyphs, merges ranges, and includes supplementary scalars', () => {
  const data = Buffer.alloc(28 + 12 + 16 + 3 * 12);
  data.writeUInt16BE(1, 4);
  data.write('cmap', 12);
  data.writeUInt32BE(28, 20);
  data.writeUInt32BE(data.length - 28, 24);
  data.writeUInt16BE(1, 30);
  data.writeUInt16BE(3, 32);
  data.writeUInt16BE(10, 34);
  data.writeUInt32BE(12, 36);
  data.writeUInt16BE(12, 40);
  data.writeUInt32BE(3, 52);
  for (const [index, [start, end, glyph]] of [[65, 67, 0], [68, 69, 4], [0x1f600, 0x1f601, 8]].entries()) {
    data.writeUInt32BE(start, 56 + index * 12);
    data.writeUInt32BE(end, 60 + index * 12);
    data.writeUInt32BE(glyph, 64 + index * 12);
  }
  assert.deepEqual(readFontCoverage(data), [[66, 69], [0x1f600, 0x1f601]]);
});

test('format 4 cmap applies range offsets without treating a zero glyph as coverage', () => {
  const data = Buffer.alloc(78);
  data.writeUInt16BE(1, 4);
  data.write('cmap', 12);
  data.writeUInt32BE(28, 20);
  data.writeUInt32BE(50, 24);
  data.writeUInt16BE(1, 30);
  data.writeUInt16BE(3, 32);
  data.writeUInt16BE(1, 34);
  data.writeUInt32BE(12, 36);
  data.writeUInt16BE(4, 40);
  data.writeUInt16BE(38, 42);
  data.writeUInt16BE(4, 46);
  data.writeUInt16BE(67, 54);
  data.writeUInt16BE(0xffff, 56);
  data.writeUInt16BE(65, 60);
  data.writeUInt16BE(0xffff, 62);
  data.writeUInt16BE(1, 64);
  data.writeUInt16BE(1, 66);
  data.writeUInt16BE(4, 68);
  data.writeUInt16BE(2, 72);
  data.writeUInt16BE(0, 74);
  data.writeUInt16BE(5, 76);
  assert.deepEqual(readFontCoverage(data), [[65, 65], [67, 67]]);
});

test('copy command includes complete deployment assets and detects byte or metadata corruption', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'textgraph-font-assets-'));
  try {
    await copyFonts(temp);
    const target = pathToFileURL(`${temp}${path.sep}`);
    assert.deepEqual(await verifyFontAssets(target), fontCatalog);
    const catalogPath = path.join(temp, 'font-catalog.json');
    const catalog = JSON.parse(await readFile(catalogPath, 'utf8'));
    catalog.fonts[0].coverage = [[0, 0x10ffff]];
    await writeFile(catalogPath, JSON.stringify(catalog));
    await assert.rejects(verifyFontAssets(target), /coverage mismatch/);
    await copyFonts(temp);
    await writeFile(path.join(temp, fontCatalog.fonts[0].path), 'broken');
    await assert.rejects(verifyFontAssets(target), /integrity mismatch/);
  } finally { await rm(temp, { recursive: true, force: true }); }
});

test('npm tarball installs and copies fonts fully offline without another runtime', async () => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'textgraph-font-packed-'));
  try {
    const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
    const { stdout } = await run(npm, ['pack', '--ignore-scripts', '--json', '--workspaces=false', '--pack-destination', temp], { cwd: root });
    const [packed] = JSON.parse(stdout);
    const filenames = packed.files.map(file => file.path);
    assert.ok(filenames.every(name => !name.endsWith('.wasm') && !name.startsWith('test/')));
    for (const font of fontCatalog.fonts) assert.ok(filenames.includes(`assets/${font.path}`));
    await writeFile(path.join(temp, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
    await run(npm, ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', path.join(temp, packed.filename)], { cwd: temp });
    const program = `import {fontCatalog, languagePacks} from '@drawmotive/textgraph-fonts'; console.log(JSON.stringify({fonts:fontCatalog.fonts.length,packs:languagePacks.length}));`;
    assert.deepEqual(JSON.parse((await run(process.execPath, ['--input-type=module', '-e', program], { cwd: temp })).stdout), { fonts: 3, packs: 3 });
    // Exercise npm's generated .bin entry, including the POSIX symlink that
    // differs from the real module path seen by the ESM loader.
    await run(npm, ['exec', '--offline', '--no', '--', 'textgraph-copy-fonts', path.join(temp, 'deployed')], { cwd: temp });
    assert.deepEqual(await verifyFontAssets(pathToFileURL(`${path.join(temp, 'deployed')}${path.sep}`)), fontCatalog);
  } finally { await rm(temp, { recursive: true, force: true }); }
});
