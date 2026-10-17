import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { initializeTextGraph } from '@drawmotive/textgraph/node';
import { PNG } from 'pngjs';
import { fontCatalogUrl } from '../language-packs/index.js';

// Documentation consumes final native output with packaged font authority.
// A provisional missing-glyph preview must never become the public example.
const source = await readFile(new URL('../language-packs/examples/cjk-emoji.textgraph', import.meta.url), 'utf8');
const readme = await readFile(new URL('../language-packs/README.md', import.meta.url), 'utf8');
assert.equal(readme.match(/## Language coverage[\s\S]*?```textgraph\n([\s\S]*?)```/)?.[1], source, 'Font coverage source must match the rendered example');
const renderer = await initializeTextGraph({ fontAssets: { catalog: fontCatalogUrl, fallback: false },
  fetch: () => { throw new Error('Font example must not request external resources'); } });
try {
  const result = await renderer.renderPng(source, { scale: 2, padding: 24 });
  assert.ok(result.success, JSON.stringify(result.diagnostics));
  assert.deepEqual(result.diagnostics.filter(item => item.stage === 'font'), []);
  const png = PNG.sync.read(Buffer.from(result.png));
  let color = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    if (Math.max(...png.data.subarray(i, i + 3)) - Math.min(...png.data.subarray(i, i + 3)) > 30) color++;
  }
  assert.ok(color > 20, 'Font example must contain colored emoji glyph pixels');
  await writeFile(new URL('../language-packs/examples/cjk-emoji.png', import.meta.url), result.png);
  console.log('Rendered offline Chinese, Japanese and color emoji (' + png.width + ' × ' + png.height + ').');
} finally { await renderer.dispose(); }
