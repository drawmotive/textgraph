import assert from 'node:assert/strict';
import test from 'node:test';
import { initializeTextGraph } from '@drawmotive/textgraph/node';
import { readFile } from 'node:fs/promises';
import { PNG } from 'pngjs';

const catalogUrl = new URL('../language-packs/assets/font-catalog.json', import.meta.url);
const source = { zh: 'A: 中文开始繁體測試', ja: 'A: 日本語の図', emoji: 'A: 😀 👩‍💻 🇯🇵 👍🏽 1️⃣' };

test('real native lazy fonts use rendered labels, remain installed and ignore edit history', { timeout: 120000 }, async () => {
  const requests = [];
  const catalog = JSON.parse(await readFile(catalogUrl, 'utf8'));
  const runtime = await initializeTextGraph({
    fontAssets: { catalog: new URL('https://fonts.test/font-catalog.json'), fallback: false },
    fetch: async url => {
      const name = new URL(url).pathname.slice(1); requests.push(name);
      assert.equal(new URL(url).origin, 'https://fonts.test');
      return new Response(await readFile(new URL(name, catalogUrl)));
    },
  });
  const clean = await initializeTextGraph({ fontAssets: { catalog: catalogUrl, fallback: false }, fetch: () => { throw new Error('Offline host attempted external access'); } });
  try {
    assert.ok(runtime.info.capabilities.includes('textgraph-fonts-v1'));
    await runtime.validate(source.zh);
    await runtime.renderPng('A: English 123');
    await runtime.renderPng('<!-- 中文 日本語 😀 -->\nA: English');
    assert.deepEqual(requests, []);
    for (const language of ['zh', 'ja', 'emoji']) {
      const result = await runtime.renderPng(source[language]);
      assert.equal(result.success, true, JSON.stringify(result.diagnostics));
      assert.deepEqual(result.diagnostics.filter(d => d.stage === 'font'), []);
      const pixels = PNG.sync.read(Buffer.from(result.png)).data;
      if (language === 'emoji') {
        let colored = 0;
        for (let offset = 0; offset < pixels.length; offset += 4) if (Math.max(...pixels.subarray(offset, offset + 3)) - Math.min(...pixels.subarray(offset, offset + 3)) > 30) colored++;
        assert.ok(colored > 20, 'Emoji PNG contains colored glyph pixels');
      }
    }
    assert.equal(requests.filter(name => name.endsWith('.ttf')).length, 3);
    assert.deepEqual(new Set(requests.filter(name => name.endsWith('.ttf'))), new Set(catalog.fonts.map(font => font.path)));
    const mixed = 'A: 中文\nB: 日本語の図\nC: 😀\nA -> B -> C';
    const reused = await runtime.renderPng(mixed);
    const fresh = await clean.renderPng(mixed);
    assert.equal(fresh.success, true, JSON.stringify(fresh.diagnostics));
    assert.deepEqual(Buffer.from(reused.png), Buffer.from(fresh.png));
    const before = requests.length;
    await runtime.renderPng(source.zh);
    await runtime.renderPng(source.ja);
    assert.equal(requests.length, before);
  } finally { await runtime.dispose(); await clean.dispose(); }
});
