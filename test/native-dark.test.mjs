import assert from 'node:assert/strict';
import test from 'node:test';
import { PNG } from 'pngjs';
import { JSDOM } from 'jsdom';
import { initializeTextGraph } from '@drawmotive/textgraph/node';

test('bundled native runtime encodes both palettes and restores light across PNG and SVG', { timeout: 30000 }, async () => {
  const runtime = await initializeTextGraph({ fontAssets: { fallback: false } });
  const source = 'a: Start\nb(fill success): Finish\na -> b';
  const vectors = [];
  try {
    assert.ok(runtime.info.capabilities.includes('textgraph-render-dark-v1'));
    const images = [];
    for (const dark of [false, true, false]) {
      const png = await runtime.renderPng(source, { dark });
      const svg = await runtime.renderSvg(source, { dark });
      assert.equal(png.success, true, JSON.stringify(png.diagnostics));
      assert.equal(svg.success, true, JSON.stringify(svg.diagnostics));
      images.push(PNG.sync.read(Buffer.from(png.png)));
      vectors.push(new JSDOM(svg.svg, { contentType: 'image/svg+xml' }));
    }
    const [light, dark, restored] = images;
    assert.deepEqual([dark.width, dark.height], [light.width, light.height]);
    assert.deepEqual([...light.data.subarray(0, 4)], [255, 255, 255, 255]);
    assert.deepEqual([...dark.data.subarray(0, 4)], [32, 38, 50, 255]);
    assert.notDeepEqual(dark.data, light.data);
    assert.deepEqual(restored.data, light.data);
    const paths = vectors.map(dom => [...dom.window.document.querySelectorAll('path')].map(path => path.getAttribute('d')));
    assert.deepEqual(paths[1], paths[0]);
    assert.deepEqual(paths[2], paths[0]);
    const colors = vectors.map(dom => [...dom.window.document.querySelectorAll('[fill]')].map(node => node.getAttribute('fill')));
    assert.notDeepEqual(colors[1], colors[0]);
    assert.deepEqual(colors[2], colors[0]);
  } finally {
    vectors.forEach(dom => dom.window.close());
    await runtime.dispose();
  }
});
