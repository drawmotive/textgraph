import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { initializeTextGraph } from '@drawmotive/textgraph/node';
import { zhCN, emoji } from '../language-packs/index.js';

const inspect = result => {
  assert.equal(result.success, true, JSON.stringify(result.diagnostics));
  const dom = new JSDOM(result.svg, { contentType: 'image/svg+xml' });
  try {
    const root = dom.window.document.documentElement;
    assert.equal(root.localName, 'svg');
    assert.equal(root.namespaceURI, 'http://www.w3.org/2000/svg');
    const attribute = root.getAttribute('viewBox');
    assert.ok(attribute, 'SVG root supplies its logical viewBox');
    const viewBox = attribute.trim().split(/[\s,]+/).map(Number);
    assert.deepEqual(viewBox.slice(0, 2), [0, 0]);
    assert.ok(Math.abs(viewBox[2] - result.displayWidth) < 0.01);
    assert.ok(Math.abs(viewBox[3] - result.displayHeight) < 0.01);
    assert.ok(root.querySelector('path, rect, polygon, line, polyline, text'), 'Diagram has real vector geometry');
    assert.ok(result.displayWidth > 0 && result.displayHeight > 0);
    return [...root.querySelectorAll('path')].map(path => path.getAttribute('d'));
  } finally { dom.window.close(); }
};

test('real SVG runtime exports logical vector geometry and preserves PNG across isolated renders', { timeout: 30000 }, async () => {
  const runtime = await initializeTextGraph({ fontAssets: { fallback: false } });
  try {
    assert.ok(runtime.info.capabilities.includes('textgraph-render-svg-v1'));
    const first = await runtime.renderSvg('A -> B', { padding: 10 });
    const firstPaths = inspect(first);
    const noPadding = await runtime.renderSvg('A -> B', { padding: 0 });
    inspect(noPadding);
    assert.ok(Math.abs(first.displayWidth - noPadding.displayWidth - 20) < 0.01);
    assert.ok(Math.abs(first.displayHeight - noPadding.displayHeight - 20) < 0.01);
    const pngBefore = await runtime.renderPng('A -> B');
    assert.equal(pngBefore.success, true);
    const larger = await runtime.renderSvg('one -> two -> three -> four');
    inspect(larger);
    const invalid = await runtime.renderSvg('A -> {}}');
    assert.equal(invalid.success, false);
    assert.ok(invalid.diagnostics.some(item => item.code === 'TG_PARSE_ERROR'));
    assert.equal(Object.hasOwn(invalid, 'svg'), false);
    assert.equal(Object.hasOwn(invalid, 'displayWidth'), false);
    const repeated = await runtime.renderSvg('A -> B');
    assert.deepEqual(inspect(repeated), firstPaths);
    assert.equal(repeated.displayWidth, first.displayWidth);
    assert.equal(repeated.displayHeight, first.displayHeight);
    const pngAfter = await runtime.renderPng('A -> B');
    assert.deepEqual(pngAfter.png, pngBefore.png);
  } finally { await runtime.dispose(); }
});

test('real SVG runtime shares offline Chinese and emoji font preparation with PNG', { timeout: 30000 }, async () => {
  const runtime = await initializeTextGraph({ languagePacks: [zhCN, emoji], fontAssets: { fallback: false },
    fetch: () => { throw new Error('Offline SVG render must not request network resources'); },
  });
  try {
    assert.ok(runtime.info.capabilities.includes('textgraph-render-svg-v1'));
    for (const source of ['A: 开始\nB: 完成\nA -> B', 'A: 👩‍💻 🇯🇵 👍🏽 1️⃣']) {
      const result = await runtime.renderSvg(source);
      inspect(result);
      assert.ok(!result.diagnostics.some(item => item.stage === 'font'), JSON.stringify(result.diagnostics));
      assert.equal((await runtime.renderPng(source)).success, true);
    }
  } finally { await runtime.dispose(); }
});
