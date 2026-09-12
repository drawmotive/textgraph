import { initializeTextGraph } from '../../src/platform/worker.js';
try {
  const runtime = await initializeTextGraph();
  try {
    const result = await runtime.renderPng('A -> B');
    if (!result.success) throw new Error(JSON.stringify(result.diagnostics));
    const bitmap = await createImageBitmap(new Blob([result.png], { type: 'image/png' }));
    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const context = canvas.getContext('2d');
    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
    let ink = 0;
    for (let i = 0; i < pixels.length; i += 4) if (pixels[i] < 240 || pixels[i + 1] < 240 || pixels[i + 2] < 240) ink++;
    bitmap.close();
    postMessage({ width: canvas.width, height: canvas.height, ink, hasWindow: typeof window !== 'undefined' });
  } finally { await runtime.dispose(); }
} catch (error) { postMessage({ error: String(error), cause: String(error.cause) }); }
