import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const packageRoot = path.resolve(import.meta.dirname, '..');

test('TextGraph resolves Node and explicit browser/worker ESM entries independently', async () => {
  const root = await import('@drawmotive/textgraph');
  const browser = await import('@drawmotive/textgraph/browser');
  const worker = await import('@drawmotive/textgraph/worker');

  assert.equal(root.platform, 'node');
  assert.equal(browser.platform, 'browser');
  assert.equal(worker.platform, 'worker');
});

test('TextGraph browser and worker module graphs contain no Node imports', async () => {
  for (const relative of ['src/platform/browser.js', 'src/platform/worker.js']) {
    const source = await readFile(path.join(packageRoot, relative), 'utf8');
    assert.doesNotMatch(source, /(?:from|import\s*\()\s*['"]node:/);
  }
  const nodeSource = await readFile(path.join(packageRoot, 'src/platform/node.js'), 'utf8');
  assert.doesNotMatch(nodeSource, /runtime\/browser|platform\/browser/);
});
