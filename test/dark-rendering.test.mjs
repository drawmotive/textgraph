import assert from 'node:assert/strict';
import test from 'node:test';
import { initializeTextGraph } from '../src/index.js';

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==';
const results = {
  png: { protocolVersion: 1, success: true, png, width: 1, height: 1, diagnostics: [] },
  svg: { protocolVersion: 1, success: true, svg: '<svg xmlns="http://www.w3.org/2000/svg"/>', displayWidth: 1, displayHeight: 1, diagnostics: [] },
};
const capabilities = ['textgraph-render-v1', 'textgraph-render-svg-v1', 'textgraph-render-dark-v1'];
async function fixture(execute, supported = capabilities) {
  const requests = [];
  const runtime = await initializeTextGraph({ loadRuntime: async () => ({ abiVersion: '1.0.0', capabilities: supported,
    execute: (json, context) => {
      const request = JSON.parse(json);
      requests.push(request);
      return execute?.(request, context) ?? JSON.stringify(results[request.export.format]);
    },
  }) });
  return { runtime, requests };
}

test('legacy inferred PNG support never implies native dark capability', async () => {
  let calls = 0;
  const runtime = await initializeTextGraph({ loadRuntime: async () => ({ abiVersion: '1.0.0',
    execute: () => { calls++; return JSON.stringify(results.png); },
  }) });
  try {
    await assert.rejects(runtime.renderPng('A', { dark: true }), error => error.code === 'UNSUPPORTED_CAPABILITY' && /dark/.test(error.message));
    assert.equal(calls, 0);
    assert.equal((await runtime.renderPng('A')).success, true);
  } finally { await runtime.dispose(); }
});

for (const [format, method] of [['png', 'renderPng'], ['svg', 'renderSvg']]) {
  test(`${method} forwards strict dark selection and preserves light defaults`, async () => {
    const { runtime, requests } = await fixture();
    try {
      for (const dark of [undefined, false, true]) {
        const result = await runtime[method]('A: 日本語', { dark, language: 'ja', padding: 3 });
        assert.equal(result.success, true);
        assert.equal(requests.at(-1).language, 'ja');
        assert.equal(requests.at(-1).export.padding, 3);
        assert.equal(requests.at(-1).export.format, format);
        assert.equal(Object.hasOwn(requests.at(-1).export, 'dark'), dark !== undefined);
        assert.equal(requests.at(-1).export.dark, dark);
      }
    } finally { await runtime.dispose(); }
  });

  test(`${method} rejects nonboolean dark options before native work`, async () => {
    const { runtime, requests } = await fixture();
    try {
      for (const dark of [null, 0, 1, 'true', 'false', {}, [], new Boolean(true)]) {
        await assert.rejects(runtime[method]('A', { dark }), { code: 'INVALID_ARGUMENT' });
      }
      assert.deepEqual(requests, []);
    } finally { await runtime.dispose(); }
  });

  test(`${method} requires dark capability only for dark output`, async () => {
    const { runtime, requests } = await fixture(undefined, capabilities.filter(value => value !== 'textgraph-render-dark-v1'));
    try {
      await assert.rejects(runtime[method]('A', { dark: true }), error => error.code === 'UNSUPPORTED_CAPABILITY' && /dark/.test(error.message));
      assert.deepEqual(requests, []);
      assert.equal((await runtime[method]('A', { dark: false })).success, true);
      assert.equal((await runtime[method]('A')).success, true);
    } finally { await runtime.dispose(); }
  });

  test(`${method} keeps dark previews and queued options tied to their originating request`, async () => {
    const gate = Promise.withResolvers();
    const started = Promise.withResolvers();
    const previews = [];
    const { runtime, requests } = await fixture(async (request, context) => {
      if (request.export.dark) {
        context.onPreview(JSON.stringify(results[format]));
        started.resolve();
        await gate.promise;
      }
      return JSON.stringify(results[format]);
    });
    const options = { dark: true, onPreview: preview => previews.push(preview) };
    const first = runtime[method]('dark', options);
    options.dark = false;
    const second = runtime[method]('light', { dark: false });
    const controller = new AbortController();
    const cancelled = assert.rejects(runtime[method]('cancelled', { dark: true, signal: controller.signal }), { name: 'AbortError' });
    controller.abort();
    const disposing = runtime.dispose();
    await assert.rejects(runtime[method]('late', { dark: true }), { code: 'INSTANCE_DISPOSED' });
    await started.promise;
    assert.equal(previews.length, 1);
    gate.resolve();
    await Promise.all([first, second, cancelled, disposing]);
    assert.deepEqual(requests.map(request => [request.source, request.export.dark]), [['dark', true], ['light', false]]);
    assert.equal(runtime.state, 'disposed');
  });
}
