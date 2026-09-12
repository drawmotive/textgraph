import assert from 'node:assert/strict';
import test from 'node:test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { initializeTextGraph } from '@drawmotive/textgraph/node';

test('missing real Node assets reject without terminating the host process', async () => {
  for (const name of ['Graphics.Core.wasm', 'dotnet.native.js', 'dotnet.boot.js']) {
    const { stdout } = await promisify(execFile)(process.execPath, [fileURLToPath(new URL('./fixtures/startup-failure.mjs', import.meta.url)), name]);
    assert.equal(stdout.trim(), 'caught:RESOURCE_NOT_FOUND', name);
  }
});

test('platform initialization always rejects invalid options asynchronously', async () => {
  for (const options of [null, 42, 'bad']) {
    const promise = initializeTextGraph(options);
    assert.equal(typeof promise.then, 'function');
    await assert.rejects(promise, { code: 'INVALID_ARGUMENT' });
  }
  for (const key of ['resolveAsset', 'fetch', 'loadRuntime']) {
    await assert.rejects(initializeTextGraph({ [key]: 42 }), { code: 'INVALID_ARGUMENT' });
  }
});
