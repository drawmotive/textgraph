import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { test, expect } from '@playwright/test';
import { PNG } from 'pngjs';

test('Node sample writes a visible PNG using WASM from its installed tarball', async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'The Node sample needs one platform run.');
  const directory = await mkdtemp(path.join(os.tmpdir(), 'textgraph-node-sample-'));
  try {
    const sample = path.resolve(import.meta.dirname, '../node');
    const output = path.join(directory, 'diagram.png');
    await promisify(execFile)(process.execPath, ['index.mjs', 'diagram.textgraph', output], { cwd: sample, timeout: 30000 });
    const png = PNG.sync.read(await readFile(output));
    expect(png.width).toBeGreaterThan(0);
    expect(png.height).toBeGreaterThan(0);
    let ink = 0;
    for (let i = 0; i < png.data.length; i += 4) {
      if (png.data[i] < 240 || png.data[i + 1] < 240 || png.data[i + 2] < 240) ink++;
    }
    expect(ink).toBeGreaterThan(100);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
