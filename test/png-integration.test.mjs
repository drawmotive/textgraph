import assert from 'node:assert/strict';
import test from 'node:test';
import { initializeTextGraph } from '@drawmotive/textgraph/node';
import { zhCN } from '../language-packs/zh-cn/index.js';
import { readFile } from 'node:fs/promises';

test('real Node runtime renders isolated PNGs with matching byte and base64 output', async () => {
  const runtime = await initializeTextGraph();
  try {
    assert.equal(typeof runtime.renderPng, 'function');
    const { PNG } = await import('pngjs');
    const first = await runtime.renderPng('A -> B');
    assert.equal(first.success, true, JSON.stringify(first.diagnostics));
    assert.ok(first.png instanceof Uint8Array);
    const decoded = PNG.sync.read(Buffer.from(first.png));
    assert.equal(decoded.width, first.width);
    assert.equal(decoded.height, first.height);
    let ink = 0;
    for (let i = 0; i < decoded.data.length; i += 4) {
      if (decoded.data[i] < 240 || decoded.data[i + 1] < 240 || decoded.data[i + 2] < 240) ink++;
    }
    assert.ok(ink > 100, 'PNG must contain visible diagram content');
    const encoded = await runtime.renderPng('A -> B', { encoding: 'base64' });
    assert.equal(encoded.success, true);
    assert.deepEqual(Buffer.from(encoded.png, 'base64'), Buffer.from(first.png));
    const enlarged = await runtime.renderPng('A -> B', { scale: 4 });
    assert.equal(enlarged.success, true);
    assert.ok(Math.abs(enlarged.width - first.width * 2) <= 1);
    assert.ok(Math.abs(enlarged.height - first.height * 2) <= 1);
    const padded = await runtime.renderPng('A -> B', { padding: 20 });
    assert.equal(padded.width, first.width + 40);
    assert.equal(padded.height, first.height + 40);
    const limited = await runtime.renderPng('A -> B', { maxWidth: 100 });
    assert.equal(limited.width, 100);
    for (const source of ['', 'A ->', '(sequence) { A -> B }']) {
      const result = await runtime.renderPng(source);
      assert.equal(result.success, false, source);
      assert.ok(result.diagnostics.some(diagnostic => diagnostic.severity === 'error'));
    }
    await runtime.renderPng('C -> D -> E');
    const repeated = await runtime.renderPng('A -> B');
    assert.deepEqual(Buffer.from(repeated.png), Buffer.from(first.png));
    assert.equal((await runtime.validate('A -> B')).valid, true);
  } finally { await runtime.dispose(); }
});

test('optional Chinese pack resolves missing glyphs without changing the default instance', async () => {
  const source = 'A: 开始\nB: 完成\nA -> B';
  const base = await initializeTextGraph();
  const chinese = await initializeTextGraph({ languagePacks: [zhCN] });
  try {
    assert.equal(typeof base.renderPng, 'function');
    const missing = await base.renderPng(source);
    assert.ok(missing.diagnostics.some(item => item.stage === 'font'), JSON.stringify(missing));
    const rendered = await chinese.renderPng(source);
    assert.equal(rendered.success, true, JSON.stringify(rendered.diagnostics));
    assert.ok(!rendered.diagnostics.some(item => item.stage === 'font'), JSON.stringify(rendered.diagnostics));
    const again = await base.renderPng(source);
    assert.ok(again.diagnostics.some(item => item.stage === 'font'));
  } finally { await base.dispose(); await chinese.dispose(); }
});

test('corrupt font data fails before configuration and rendering can retry after repair', async () => {
  let corrupt = true;
  let fontReads = 0;
  const runtime = await initializeTextGraph({
    resolveAsset: (asset, url) => asset.path.endsWith('.ttf') ? new URL(asset.path, 'https://fonts.invalid/') : url,
    fetch: async url => {
      fontReads++;
      const path = new URL(url).pathname.slice(1);
      return new Response(corrupt ? new Uint8Array([0]) : await readFile(new URL(`../generated/${path}`, import.meta.url)));
    },
  });
  try {
    assert.equal(typeof runtime.renderPng, 'function');
    assert.equal(fontReads, 0);
    await assert.rejects(runtime.renderPng('A -> B'), { code: 'ASSET_INTEGRITY_MISMATCH' });
    assert.equal((await runtime.validate('A -> B')).valid, true);
    corrupt = false;
    assert.equal((await runtime.renderPng('A -> B')).success, true);
  } finally { await runtime.dispose(); }
});
