import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import test from 'node:test';
import { Worker } from 'node:worker_threads';

import { createTextGraphRuntimeLoader } from '../src/platform/browser.js';

const fixture = (name) => path.join(import.meta.dirname, 'fixtures', name);
const manifest = { assets: [
  { path: 'wasm/a.wasm', mediaType: 'application/wasm' },
  { path: 'wasm/b.js', mediaType: 'text/javascript' },
] };

test('TextGraph browser entry initializes under a strict CSP guard', async () => {
  const child = spawn(process.execPath, [fixture('csp.mjs')], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  const [code] = await once(child, 'exit');
  assert.equal(code, 0);
  assert.equal(stdout, 'browser:ready');
});

test('TextGraph loader uses an injected offline cache and reports a stable cache miss', async () => {
  const cache = new Map([
    ['https://offline.test/pkg/generated/wasm/a.wasm', new Uint8Array([0, 97, 115, 109])],
    ['https://offline.test/pkg/generated/wasm/b.js', new TextEncoder().encode('export {}')],
  ]);
  const offlineFetch = async (url) => {
    const bytes = cache.get(url.href);
    return bytes ? new Response(bytes, { status: 200 }) : new Response(null, { status: 504 });
  };
  const loader = createTextGraphRuntimeLoader({ manifest, moduleUrl: 'https://offline.test/pkg/src/runtime/assets.js', fetch: offlineFetch });
  assert.equal((await loader.loadAssets()).size, 2);
  cache.delete('https://offline.test/pkg/generated/wasm/b.js');
  await assert.rejects(loader.loadAssets(), (error) => error.code === 'RESOURCE_NOT_FOUND' && error.details.asset === 'wasm/b.js');
});

test('TextGraph explicit worker entry initializes in worker_threads', async () => {
  const worker = new Worker(fixture('worker.mjs'));
  const [message] = await once(worker, 'message');
  assert.deepEqual(message, { platform: 'worker', state: 'ready' });
  await worker.terminate();
});
