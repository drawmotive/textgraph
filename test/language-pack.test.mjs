import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import test from 'node:test';

test('Simplified Chinese pack supplies a usable font URL without importing a runtime', async () => {
  const { zhCN } = await import('../language-packs/index.js');
  assert.deepEqual(zhCN.fallbackFamilies, ['NotoSansSC-Regular']);
  const font = zhCN.fonts.find(item => item.family === 'NotoSansSC-Regular');
  const bytes = await readFile(font.source);
  assert.equal(bytes.readUInt32BE(0), 0x00010000);
  assert.ok((await stat(font.source)).size > 0);
  const metadata = JSON.parse(await readFile(new URL('../language-packs/package.json', import.meta.url)));
  assert.equal(metadata.name, '@drawmotive/textgraph-fonts');
  assert.equal(metadata.license, '(MIT AND OFL-1.1)');
  assert.ok((await readFile(new URL('../language-packs/zh-cn/OFL.txt', import.meta.url), 'utf8')).includes('SIL OPEN FONT LICENSE'));
});
