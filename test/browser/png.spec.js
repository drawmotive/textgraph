import { test, expect } from '@playwright/test';

test('browser renders base64 PNG with lazy fonts and decodable visible content', async ({ page }) => {
  await page.goto('http://127.0.0.1:4178/');
  const result = await page.evaluate(async () => {
    const { initializeTextGraph } = await import('/src/platform/browser.js');
    const requests = [];
    const runtime = await initializeTextGraph({ fetch: async (url, options) => {
      requests.push(String(url)); return fetch(url, options);
    } });
    try {
      await runtime.validate('A -> B');
      const before = requests.filter(url => /[.](ttf|css)$/.test(url));
      const rendered = await runtime.renderPng('A -> B', { encoding: 'base64', maxWidth: 500 });
      if (!rendered.success) throw new Error(JSON.stringify(rendered.diagnostics));
      const image = new Image();
      image.src = `data:image/png;base64,${rendered.png}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0;
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 240 || pixels[i + 1] < 240 || pixels[i + 2] < 240) ink++;
      const loaded = requests.filter(url => /[.](ttf|css)$/.test(url));
      await runtime.renderPng('B -> C');
      return { before, loaded, after: requests.filter(url => /[.](ttf|css)$/.test(url)),
        width: rendered.width, height: rendered.height, decodedWidth: canvas.width, decodedHeight: canvas.height, ink };
    } finally { await runtime.dispose(); }
  });
  expect(result.before).toEqual([]);
  expect(result.loaded.filter(url => url.endsWith('.ttf'))).toHaveLength(2);
  expect(result.loaded.filter(url => url.endsWith('.css'))).toHaveLength(1);
  expect(result.after).toEqual(result.loaded);
  expect(result.decodedWidth).toBe(result.width);
  expect(result.decodedHeight).toBe(result.height);
  expect(result.ink).toBeGreaterThan(100);
});

test('module Worker renders PNG bytes without DOM or window', async ({ page }) => {
  await page.goto('http://127.0.0.1:4178/');
  const actual = await page.evaluate(() => new Promise((resolve, reject) => {
    const worker = new Worker('/test/browser/png-worker.js', { type: 'module' });
    worker.onmessage = event => { worker.terminate(); resolve(event.data); };
    worker.onerror = event => { worker.terminate(); reject(new Error(event.message)); };
  }));
  expect(actual.error).toBeUndefined();
  expect(actual.width).toBeGreaterThan(0);
  expect(actual.height).toBeGreaterThan(0);
  expect(actual.ink).toBeGreaterThan(100);
  expect(actual.hasWindow).toBe(false);
});

test('browser loads the optional Chinese pack and renders labels without missing glyphs', async ({ page }) => {
  await page.goto('http://127.0.0.1:4178/');
  const actual = await page.evaluate(async () => {
    const { initializeTextGraph } = await import('/src/platform/browser.js');
    const { zhCN } = await import('/language-packs/index.js');
    const runtime = await initializeTextGraph({ languagePacks: [zhCN] });
    try {
      const result = await runtime.renderPng('A: 开始\nB: 完成\nA -> B');
      if (!result.success) return result;
      const bitmap = await createImageBitmap(new Blob([result.png], { type: 'image/png' }));
      const width = bitmap.width;
      bitmap.close();
      return { success: result.success, diagnostics: result.diagnostics, width };
    } finally { await runtime.dispose(); }
  });
  expect(actual.success).toBe(true);
  expect(actual.diagnostics).toEqual([]);
  expect(actual.width).toBeGreaterThan(0);
});
