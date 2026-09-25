import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fontsRoot, fontsReleaseChannel, verifyFontsPackage, verifyFontsPackList, packFontsRelease, verifyFontsArtifact } from '../scripts/fonts-release.mjs';
import { publishFontsRelease } from '../scripts/publish-fonts-release.mjs';
import { readPublicRegistry } from '../scripts/publish-release.mjs';

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const hash = bytes => `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
async function temporary(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'textgraph-fonts-release-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}
async function artifact(t) {
  const directory = await temporary(t);
  const bytes = Buffer.from('immutable fonts tarball');
  const release = { ...fontsReleaseChannel('0.2.2-alpha.1'), name: '@drawmotive/textgraph-fonts', filename: 'drawmotive-textgraph-fonts-0.2.2-alpha.1.tgz', integrity: hash(bytes) };
  await writeFile(path.join(directory, release.filename), bytes);
  await writeFile(path.join(directory, 'release.json'), JSON.stringify(release));
  return { directory, release };
}
const registryVersion = release => ({ [release.version]: { dist: { integrity: release.integrity } } });

test('fonts use an independent Git tag and the shared strict npm channel policy', () => {
  assert.deepEqual(fontsReleaseChannel('0.2.2-alpha.1'), { version: '0.2.2-alpha.1', tag: 'alpha', gitTag: 'textgraph-fonts-v0.2.2-alpha.1' });
  assert.equal(fontsReleaseChannel('0.2.2').tag, 'latest');
  for (const version of ['v0.2.2', '0.2.2-beta.1', '0.2.2-alpha.01', '0.2.2+build']) assert.throws(() => fontsReleaseChannel(version), /version/i);
});

test('fonts release readiness rejects a wrong tag, excluded target, altered license, and unsafe channel', async t => {
  const root = path.join(await temporary(t), 'fonts');
  await cp(fontsRoot, root, { recursive: true, filter: source => !source.includes(`${path.sep}node_modules`) && !source.endsWith('.tgz') && !source.endsWith(`${path.sep}release.json`) });
  const pkg = await readJson(path.join(root, 'package.json'));
  const release = await verifyFontsPackage(root, fontsReleaseChannel(pkg.version).gitTag);
  await assert.rejects(verifyFontsPackage(root, `textgraph-v${release.version}`), /tag/i);
  const targetFile = path.join(root, '.release/target.json');
  const target = await readJson(targetFile);
  await writeFile(targetFile, JSON.stringify({ ...target, publishable: false }));
  await assert.rejects(verifyFontsPackage(root), /not publishable/);
  await writeFile(targetFile, JSON.stringify(target));
  const licenseFile = path.join(root, 'assets/NotoSansJP-LICENSE.txt');
  const license = await readFile(licenseFile);
  await writeFile(licenseFile, Buffer.concat([license, Buffer.from('changed')]));
  await assert.rejects(verifyFontsPackage(root), /License integrity mismatch/);
  await writeFile(licenseFile, license);
  await writeFile(path.join(root, 'package.json'), JSON.stringify({ ...pkg, publishConfig: { ...pkg.publishConfig, tag: release.tag === 'alpha' ? 'latest' : 'alpha' } }));
  await assert.rejects(verifyFontsPackage(root), /Unsafe publish configuration/);
});

test('packing the real fonts distribution retains exact bytes and requires its complete offline surface', async t => {
  const directory = await temporary(t);
  const release = await packFontsRelease(fontsRoot, directory);
  assert.deepEqual(await verifyFontsArtifact(directory, release), release);
  assert.equal(hash(await readFile(path.join(directory, release.filename))), release.integrity);
  const { command } = await import('../scripts/command.mjs');
  const { stdout } = await command('npm', ['pack', '--ignore-scripts', '--dry-run', '--json', '--workspaces=false'], fontsRoot);
  const [packed] = JSON.parse(stdout);
  const catalog = await readJson(path.join(fontsRoot, 'assets/font-catalog.json'));
  verifyFontsPackList(packed, release, catalog);
  for (const file of ['assets/NotoSansJP-LICENSE.txt', 'assets/NotoColorEmoji.NOTICE.txt', 'assets/NotoSansSC-Regular.ttf', 'scripts/copy-fonts.mjs']) {
    assert.throws(() => verifyFontsPackList({ ...packed, files: packed.files.filter(item => item.path !== file) }, release, catalog), /missing/);
  }
  assert.throws(() => verifyFontsPackList({ ...packed, files: [...packed.files, { path: '.npmrc' }] }, release, catalog), /Unexpected/);
  assert.throws(() => verifyFontsPackList({ ...packed, name: '@drawmotive/textgraph' }, release, catalog), /package mismatch/);
});

test('fonts artifact verification rejects tampering and receipt identity/channel substitution before network calls', async t => {
  const { directory, release } = await artifact(t);
  const noNetwork = async () => assert.fail('Artifact must be verified before registry access');
  for (const patch of [{ name: '@drawmotive/textgraph' }, { tag: 'latest' }, { gitTag: 'textgraph-v0.2.2-alpha.1' }, { filename: '../other.tgz' }]) {
    await writeFile(path.join(directory, 'release.json'), JSON.stringify({ ...release, ...patch }));
    await assert.rejects(publishFontsRelease({ directory, expected: release, readRegistry: noNetwork }), /mismatch/);
  }
  await writeFile(path.join(directory, 'release.json'), JSON.stringify(release));
  await writeFile(path.join(directory, release.filename), 'changed');
  await assert.rejects(publishFontsRelease({ directory, expected: release, readRegistry: noNetwork }), /integrity mismatch/);
});

test('fonts bootstrap publishes alpha exactly once and accepts npm assigning the initial latest', async t => {
  const { directory, release } = await artifact(t);
  let registry = null;
  let writes = 0;
  const options = { directory, expected: release, readRegistry: async () => registry, run: async (executable, args) => {
    writes++;
    assert.equal(executable, 'npm');
    assert.deepEqual(args, ['publish', path.join(directory, release.filename), '--ignore-scripts', '--access', 'public', '--tag', 'alpha', '--registry', 'https://registry.npmjs.org/']);
    registry = { 'dist-tags': { alpha: release.version, latest: release.version }, versions: registryVersion(release) };
  } };
  assert.equal((await publishFontsRelease(options)).status, 'published');
  assert.equal((await publishFontsRelease(options)).status, 'already-published');
  assert.equal(writes, 1);
  registry.versions[release.version].dist.integrity = 'sha512-different';
  await assert.rejects(publishFontsRelease(options), /integrity/);
  assert.equal(writes, 1);
});

test('subsequent fonts alpha publications preserve latest and refuse channel rollback', async t => {
  const { directory, release } = await artifact(t);
  const before = { 'dist-tags': { latest: '0.2.1' }, versions: { '0.2.1': {} } };
  for (const preserveLatest of [true, false]) {
    let registry = before;
    const operation = publishFontsRelease({ directory, expected: release, readRegistry: async () => registry, run: async () => {
      registry = { 'dist-tags': { alpha: release.version, latest: preserveLatest ? '0.2.1' : release.version }, versions: { ...before.versions, ...registryVersion(release) } };
    } });
    if (preserveLatest) assert.equal((await operation).status, 'published');
    else await assert.rejects(operation, /latest/);
  }
  await assert.rejects(publishFontsRelease({ directory, expected: release, readRegistry: async () => ({ ...before, 'dist-tags': { ...before['dist-tags'], alpha: '0.2.2-alpha.2' } }), run: async () => assert.fail('Must not downgrade alpha') }), /older/);
});

test('fonts dry-run verifies the retained artifact and passes an explicit dry-run to npm', async t => {
  const { directory, release } = await artifact(t);
  let reads = 0;
  const result = await publishFontsRelease({ directory, expected: release, dryRun: true, readRegistry: async () => { reads++; return null; }, run: async (_command, args) => {
    assert.equal(args.at(-1), '--dry-run');
    assert.equal(args[1], path.join(directory, release.filename));
  } });
  assert.equal(result.status, 'dry-run');
  assert.equal(reads, 1);
});

test('fonts registry reads and dist-tags address the fonts package independently of the SDK', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async url => { calls.push(url); return Response.json(url.endsWith('/dist-tags') ? { alpha: '0.2.2-alpha.1' } : { versions: {} }); };
  try {
    const registry = await readPublicRegistry('@drawmotive/textgraph-fonts');
    assert.equal(registry['dist-tags'].alpha, '0.2.2-alpha.1');
    assert.deepEqual(calls, ['https://registry.npmjs.org/@drawmotive%2ftextgraph-fonts', 'https://registry.npmjs.org/-/package/@drawmotive%2ftextgraph-fonts/dist-tags']);
  } finally { globalThis.fetch = originalFetch; }
});
