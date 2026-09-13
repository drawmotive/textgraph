import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { copyRuntimeAssets } from '../scripts/copy-assets.mjs';

const run = promisify(execFile);
const root = path.resolve(import.meta.dirname, '..');

async function temporary(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'textgraph-assets-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test('CLI copies every runtime asset from the installed package, independently of cwd', async t => {
  const directory = await temporary(t);
  const destination = path.join(directory, 'public', 'textgraph', 'wasm');
  await mkdir(destination, { recursive: true });
  await writeFile(path.join(destination, 'unrelated.txt'), 'preserve me');
  await writeFile(path.join(destination, 'dotnet.js'), 'previous runtime');
  const executable = path.join(directory, 'textgraph-copy-assets');
  await symlink(path.join(root, 'scripts/copy-assets.mjs'), executable);
  await run(process.execPath, [executable, 'public/textgraph/wasm'], { cwd: directory });
  const manifest = JSON.parse(await readFile(path.join(root, 'generated/wasm-manifest.json'), 'utf8'));
  for (const asset of manifest.assets) {
    const bytes = await readFile(path.join(destination, asset.path.slice('wasm/'.length)));
    assert.equal(bytes.length, asset.bytes, asset.path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256, asset.path);
  }
  assert.equal(await readFile(path.join(destination, 'unrelated.txt'), 'utf8'), 'preserve me');
});

test('CLI requires exactly one destination and rejects copying over or inside its own runtime', async t => {
  const directory = await temporary(t);
  const executable = path.join(root, 'scripts/copy-assets.mjs');
  for (const arguments_ of [[], ['one', 'two']]) {
    await assert.rejects(run(process.execPath, [executable, ...arguments_], { cwd: directory }), /Usage:/);
  }
  for (const destination of [path.parse(root).root, root, path.join(root, 'generated/wasm'), path.join(root, 'generated/wasm/nested')]) {
    await assert.rejects(copyRuntimeAssets(destination), /Choose a destination/);
  }
  const linked = path.join(directory, 'linked');
  await symlink(path.join(root, 'generated/wasm'), linked, 'dir');
  await assert.rejects(copyRuntimeAssets(path.join(linked, 'nested')), /Choose a destination/);
});
