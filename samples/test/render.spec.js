import { test, expect } from '@playwright/test';

async function pixels(image) {
  return image.evaluate(async element => {
    await element.decode();
    const canvas = document.createElement('canvas');
    canvas.width = element.naturalWidth;
    canvas.height = element.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(element, 0, 0);
    const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let ink = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240) ink++;
    }
    return { width: canvas.width, height: canvas.height, ink, png: canvas.toDataURL() };
  });
}

for (const [index, sample] of ['browser', 'react-vite', 'worker'].entries()) {
  test(`${sample} renders and updates diagrams from the packed SDK with local WASM`, async ({ page }) => {
    const pageErrors = [];
    const assets = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    page.context().on('response', response => {
      if (response.url().includes('/textgraph/wasm/')) assets.push({ url: response.url(), status: response.status() });
    });
    await page.goto(`http://127.0.0.1:${4180 + index}`);
    const image = page.getByAltText('Rendered diagram');
    await expect(image).toBeVisible();
    const before = await pixels(image);
    expect(before.width).toBeGreaterThan(0);
    expect(before.height).toBeGreaterThan(0);
    expect(before.ink).toBeGreaterThan(100);
    const previousSource = await image.getAttribute('src');
    await page.getByLabel('Diagram source').fill('A: Review\nB: Approve\nC: Publish\nA -> B\nB -> C');
    if (sample !== 'react-vite') await page.getByRole('button', { name: 'Render diagram' }).click();
    await expect(image).not.toHaveAttribute('src', previousSource);
    const after = await pixels(image);
    expect(after.ink).toBeGreaterThan(100);
    expect(after.png).not.toBe(before.png);
    expect(assets.some(asset => asset.url.endsWith('/dotnet.native.wasm') && asset.status === 200)).toBe(true);
    expect(assets.some(asset => asset.url.endsWith('.ttf') && asset.status === 200)).toBe(true);
    expect(assets.filter(asset => asset.status >= 400)).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
}
