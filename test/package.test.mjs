import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const packageRoot = path.resolve(import.meta.dirname, '..');

test('TextGraph scaffold reserves the public package identity without enabling publication', async () => {
  const packageJson = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));

  assert.equal(packageJson.name, '@drawmotive/textgraph');
  assert.equal(packageJson.private, true);
  assert.equal(packageJson.type, 'module');
  assert.equal(packageJson.engines.node, '>=22');
  assert.equal(packageJson.scripts.test, 'node --test test/*.test.mjs');
  assert.equal(packageJson.scripts.build, 'node --check src/index.js');
  assert.deepEqual(packageJson.files, ['src', 'generated/wasm', 'generated/wasm-manifest.json']);
});

test('TextGraph entry imports without claiming unavailable runtime behavior', async () => {
  const textgraph = await import('../src/index.js');

  assert.deepEqual(Object.keys(textgraph), []);
});

test('local debug WASM is excluded from the public repository', async () => {
  const ignore = await readFile(path.join(packageRoot, '.gitignore'), 'utf8');

  assert.match(ignore, /^\.local\/$/m);
});
