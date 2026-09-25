import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { command } from './command.mjs';
import { releaseChannel } from './release-policy.mjs';
import { checkComponent } from '../language-packs/.release/check.cjs';
import { verifyFontAssets } from '../language-packs/scripts/font-assets.mjs';

export const fontsRoot = path.resolve(import.meta.dirname, '../language-packs');
const packageName = '@drawmotive/textgraph-fonts';
const readJson = async file => JSON.parse(await readFile(file, 'utf8'));

// These notices are upstream bytes, reviewed alongside the pinned font sources.
// Keep their hashes independent of files.json, whose public contract is fonts only.
const licenseHashes = {
  'LICENSE': 'b2e4c882e27763af7df15720c25f659da06d6a9f55fa92caaae0a1af528f683f',
  'zh-cn/OFL.txt': '1c05c68c34f9708415aada51f17e1b0092d2cea709bf4a94cd38114f9e73d7d9',
  'assets/NotoSansSC-LICENSE.txt': '1c05c68c34f9708415aada51f17e1b0092d2cea709bf4a94cd38114f9e73d7d9',
  'assets/NotoSansJP-LICENSE.txt': '1c05c68c34f9708415aada51f17e1b0092d2cea709bf4a94cd38114f9e73d7d9',
  'assets/NotoColorEmoji.LICENSE.txt': '6a73f9541c2de74158c0e7cf6b0a58ef774f5a780bf191f2d7ec9cc53efe2bf2',
  'assets/NotoColorEmoji.NOTICE.txt': '2971652640a0602abc1a9f9fa83ea176c238ca2b651b4aedafaefe8825e54518',
};

/** Fonts share version/channel policy but have an independent immutable Git tag. */
export function fontsReleaseChannel(version) {
  return { ...releaseChannel(version), gitTag: `textgraph-fonts-v${version}` };
}

/** Release readiness covers font bytes, coverage, provenance, and original notices. */
export async function verifyFontsPackage(root = fontsRoot, gitTag) {
  const errors = checkComponent(root, { ready: true });
  if (errors.length) throw new Error(errors.join('\n'));
  const pkg = await readJson(path.join(root, 'package.json'));
  const release = fontsReleaseChannel(pkg.version);
  assert.equal(pkg.name, packageName, 'Unexpected npm package');
  assert.notEqual(pkg.private, true, 'Package is private');
  assert.deepEqual(pkg.publishConfig, { access: 'public', registry: 'https://registry.npmjs.org/', tag: release.tag }, 'Unsafe publish configuration');
  if (gitTag) assert.equal(gitTag, release.gitTag, 'Git tag does not match fonts package version');
  await verifyFontAssets(pathToFileURL(`${path.join(root, 'assets')}${path.sep}`));
  for (const [file, expected] of Object.entries(licenseHashes)) {
    const bytes = await readFile(path.join(root, file));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), expected, `License integrity mismatch: ${file}`);
  }
  return { ...release, name: pkg.name };
}

/** Require the complete offline distribution and exclude release tooling/private data. */
export function verifyFontsPackList(packed, release, catalog) {
  assert.equal(packed.name, release.name, 'Tarball package mismatch');
  assert.equal(packed.version, release.version, 'Tarball version mismatch');
  assert.equal(packed.filename, `drawmotive-textgraph-fonts-${release.version}.tgz`, 'Unexpected tarball filename');
  const required = [
    'package.json', 'README.md', 'index.js', 'index.d.ts', 'catalog.js', 'descriptor.js',
    'zh-cn/index.js', 'zh-cn/index.d.ts', 'ja/index.js', 'ja/index.d.ts', 'emoji/index.js', 'emoji/index.d.ts',
    'assets/font-catalog.json', 'assets/files.json', 'assets/provenance.json',
    'scripts/copy-fonts.mjs', 'scripts/font-assets.mjs', 'scripts/verify-assets.mjs',
    ...Object.keys(licenseHashes), ...catalog.fonts.map(font => `assets/${font.path}`),
  ];
  const files = packed.files.map(file => file.path);
  assert.deepEqual([...files].sort(), [...required].sort(), 'Unexpected or missing fonts tarball files');
}

/** Pack once and retain the receipt that binds identity/channel to exact SHA-512 bytes. */
export async function packFontsRelease(root = fontsRoot, destination = path.join(root, '.release'), gitTag) {
  const release = await verifyFontsPackage(root, gitTag);
  await mkdir(destination, { recursive: true });
  const { stdout } = await command('npm', ['pack', '--ignore-scripts', '--json', '--workspaces=false', '--pack-destination', destination], root);
  const [packed] = JSON.parse(stdout);
  verifyFontsPackList(packed, release, await readJson(path.join(root, 'assets/font-catalog.json')));
  const receipt = { ...release, filename: packed.filename, integrity: packed.integrity };
  await writeFile(path.join(destination, 'release.json'), `${JSON.stringify(receipt, null, 2)}\n`);
  await verifyFontsArtifact(destination, release);
  return receipt;
}

/** Artifact checks run before registry access and prevent path or channel substitution. */
export async function verifyFontsArtifact(directory, expected) {
  const receipt = await readJson(path.join(directory, 'release.json'));
  const release = fontsReleaseChannel(receipt.version);
  assert.equal(receipt.name, packageName, 'Artifact package mismatch');
  for (const key of ['version', 'tag', 'gitTag']) assert.equal(receipt[key], release[key], `Artifact ${key} mismatch`);
  if (expected) for (const key of ['name', 'version', 'tag', 'gitTag']) assert.equal(receipt[key], expected[key], `Artifact ${key} mismatch`);
  assert.equal(receipt.filename, `drawmotive-textgraph-fonts-${receipt.version}.tgz`, 'Artifact filename mismatch');
  const bytes = await readFile(path.join(directory, receipt.filename));
  assert.equal(`sha512-${createHash('sha512').update(bytes).digest('base64')}`, receipt.integrity, 'Artifact integrity mismatch');
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [action, gitTag, ...extra] = process.argv.slice(2);
  if (extra.length || !['verify', 'pack'].includes(action)) throw new Error('Usage: node scripts/fonts-release.mjs <verify|pack> [GIT_TAG]');
  const result = action === 'pack' ? await packFontsRelease(fontsRoot, path.join(fontsRoot, '.release'), gitTag) : await verifyFontsPackage(fontsRoot, gitTag);
  console.log(JSON.stringify(result, null, 2));
}
