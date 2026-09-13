import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile, access } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
import { PNG } from 'pngjs';

const run = promisify(execFile);
const sample = path.resolve(import.meta.dirname, '../node');
const entry = path.join(sample, 'index.mjs');

async function temporary(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'textgraph-node-sample-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

async function visiblePng(file) {
  const bytes = await readFile(file);
  const png = PNG.sync.read(bytes);
  assert.ok(png.width > 0 && png.height > 0);
  let ink = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    if (png.data[i] < 240 || png.data[i + 1] < 240 || png.data[i + 2] < 240) ink++;
  }
  assert.ok(ink > 100, 'PNG must contain visible diagram pixels');
  return bytes;
}

test('Node sample renders its default DSL and changed file input using the installed SDK', async t => {
  const directory = await temporary(t);
  await run(process.execPath, [entry], { cwd: directory, timeout: 30000 });
  const before = await visiblePng(path.join(directory, 'output/diagram.png'));
  const source = path.join(directory, 'custom.textgraph');
  const output = path.join(directory, 'nested/custom.png');
  await writeFile(source, 'A: Review\nB: Approve\nC: Publish\nA -> B\nB -> C');
  await run(process.execPath, [entry, source, output], { cwd: directory, timeout: 30000 });
  assert.notDeepEqual(await visiblePng(output), before);
});

test('Node sample rejects invalid DSL without writing a misleading image', async t => {
  const directory = await temporary(t);
  const source = path.join(directory, 'invalid.textgraph');
  const output = path.join(directory, 'invalid.png');
  await writeFile(source, 'A ->');
  await assert.rejects(run(process.execPath, [entry, source, output], { cwd: directory, timeout: 30000 }), error => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /Error:/);
    return true;
  });
  await assert.rejects(access(output), { code: 'ENOENT' });
});
