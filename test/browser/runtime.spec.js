import { test, expect } from '@playwright/test';

test('real browser runtime validates under CSP with injected data loading', async ({ page }) => {
  await page.goto('http://127.0.0.1:4178/');
  const actual = await page.evaluate(async () => {
    const { initializeTextGraph } = await import('/src/platform/browser.js');
    const requests = [];
    const runtime = await initializeTextGraph({ fetch: async (url, options) => { requests.push(String(url)); return fetch(url, options); } });
    const valid = await runtime.validate('A -> B');
    const invalid = await runtime.validate('A ->');
    await runtime.dispose();
    return { valid, invalid, state: runtime.state, requests };
  });
  expect(actual.valid).toEqual({ valid: true, diagnostics: [] });
  expect(actual.invalid.valid).toBe(false);
  expect(actual.requests.some(url => url.endsWith('.wasm'))).toBe(true);
  expect(actual.state).toBe('disposed');
});

test('real module Worker validates without window or document', async ({ page }) => {
  await page.goto('http://127.0.0.1:4178/');
  const actual = await page.evaluate(() => new Promise((resolve, reject) => {
    const worker = new Worker('/test/browser/worker.js', { type: 'module' });
    worker.onmessage = event => { worker.terminate(); resolve(event.data); };
    worker.onerror = event => { worker.terminate(); reject(new Error(event.message)); };
  }));
  expect(actual).toEqual({ result: { valid: true, diagnostics: [] }, state: 'disposed' });
});
