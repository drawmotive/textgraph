import assert from 'node:assert/strict';
import test, { after, afterEach, beforeEach } from 'node:test';
import { JSDOM } from 'jsdom';
import * as React from 'react';
import { act as legacyAct } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { TextGraph, TextGraphProvider } from '@drawmotive/textgraph/react';

const dom = new JSDOM('<!doctype html><body></body>');
const { createElement: h, StrictMode } = React;
const act = React.act ?? legacyAct;
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});
after(() => dom.window.close());

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function png(width = 10, height = 10, displayDimensions = {}) {
  const bytes = Buffer.alloc(33);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(bytes);
  bytes.writeUInt32BE(13, 8);
  bytes.write('IHDR', 12);
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return JSON.stringify({ protocolVersion: 1, success: true, png: bytes.toString('base64'), width, height, ...displayDimensions, diagnostics: [] });
}
function fixture(execute = async () => png()) {
  const stats = { loads: 0, disposed: 0, calls: [] };
  const native = { abiVersion: '1.0.0',
    execute: (json, context) => { const request = JSON.parse(json); stats.calls.push(request); return execute(request, context); },
    dispose: () => { stats.disposed++; },
  };
  const options = { loadRuntime: async () => { stats.loads++; return native; } };
  return { stats, native, options };
}
const view = (options, source, props = {}) => h(TextGraphProvider, { options }, h(TextGraph, { source, ...props }));
const render = async element => act(async () => root.render(element));

test('SSR renders a deterministic placeholder without starting WASM', () => {
  const f = fixture();
  const html = renderToString(view(f.options, 'A -> B', { loading: 'Loading graph' }));
  assert.match(html, /role="status"/);
  assert.match(html, /Loading graph/);
  assert.equal(f.stats.loads, 0);
});

test('StrictMode diagrams share one initialization and dispose only after their owner unmounts', async () => {
  const f = fixture();
  await render(h(StrictMode, null, h(TextGraphProvider, { options: f.options },
    h(TextGraph, { source: 'A -> B', alt: 'First' }), h(TextGraph, { source: 'C -> D', alt: 'Second' }))));
  assert.equal(f.stats.loads, 1);
  assert.deepEqual(f.stats.calls.map(call => call.source), ['A -> B', 'C -> D']);
  assert.equal(container.querySelectorAll('img').length, 2);
  assert.equal(container.querySelector('img').alt, 'First');
  await render(h(StrictMode, null, h(TextGraphProvider, { options: f.options }, h(TextGraph, { source: 'A -> B' }))));
  assert.equal(f.stats.disposed, 0);
  await render(null);
  assert.equal(f.stats.disposed, 1);
});

test('new DSL hides old output and cancels stale work before it can publish', async () => {
  const old = deferred();
  let oldSignal;
  const f = fixture((request, context) => {
    if (request.source === 'old') { oldSignal = context.signal; return old.promise; }
    return png(20);
  });
  await render(view(f.options, 'old'));
  assert.ok(container.querySelector('[role=status]'));
  await render(view(f.options, 'new', { className: 'diagram', alt: 'Latest' }));
  assert.equal(oldSignal.aborted, true);
  assert.equal(container.querySelector('img'), null);
  await act(async () => old.resolve(png(5)));
  assert.equal(container.querySelector('img').width, 20);
  assert.equal(container.querySelector('img').alt, 'Latest');
  assert.equal(container.querySelector('img').className, 'diagram');
});

test('render settings update the image while equivalent options and alt changes reuse output', async () => {
  const f = fixture(request => png(request.export.scale));
  await render(view(f.options, 'A', { renderOptions: { scale: 3 } }));
  await render(view(f.options, 'A', { renderOptions: { scale: 3 }, alt: 'Updated label' }));
  assert.equal(f.stats.calls.length, 1);
  assert.equal(container.querySelector('img').alt, 'Updated label');
  await render(view(f.options, 'A', { renderOptions: { scale: 4 } }));
  assert.equal(container.querySelector('img').width, 1);
  assert.equal(f.stats.loads, 1);
});

test('web defaults render at scale one and display responsively at logical size', async () => {
  const f = fixture(request => png(100 * request.export.scale, 40 * request.export.scale));
  await render(view(f.options, 'A'));
  const image = container.querySelector('img');
  assert.equal(f.stats.calls[0].export.scale, 1);
  assert.equal(image.width, 100);
  assert.equal(image.height, 40);
  assert.equal(image.style.maxWidth, '100%');
  assert.equal(image.style.height, 'auto');
  await render(view(f.options, 'A', { renderOptions: { scale: 3 } }));
  assert.equal(container.querySelector('img').width, 100);
  assert.equal(container.querySelector('img').height, 40);
});

test('web sizing uses native display dimensions when maxWidth reduces raster density', async () => {
  const f = fixture(() => png(100, 40, { displayWidth: 250, displayHeight: 100 }));
  await render(view(f.options, 'A', { renderOptions: { scale: 2, maxWidth: 100 } }));
  const image = container.querySelector('img');
  assert.equal(image.width, 250);
  assert.equal(image.height, 100);
  assert.equal(f.stats.calls.length, 1);
});

test('explicit image dimensions and styles override web defaults without dropping responsive styles', async () => {
  const f = fixture();
  await render(view(f.options, 'A', { width: 300, height: 200, style: { maxWidth: '80%', borderRadius: '4px' } }));
  const image = container.querySelector('img');
  assert.equal(image.width, 300);
  assert.equal(image.height, 200);
  assert.equal(image.style.maxWidth, '80%');
  assert.equal(image.style.height, '');
  assert.equal(image.style.borderRadius, '4px');
  await render(view(f.options, 'A', { style: { height: '150px' } }));
  assert.equal(container.querySelector('img').style.height, '150px');
});

test('DSL diagnostics and operational errors replace images, and corrected input recovers', async () => {
  const f = fixture(request => {
    if (request.source === 'invalid') return JSON.stringify({ protocolVersion: 1, success: false, diagnostics: [
      { code: 'TG_PARSE_ERROR', severity: 'error', stage: 'parse', message: '<script>invalid DSL</script>' },
    ] });
    if (request.source === 'failure') throw new Error('Render failed');
    return png();
  });
  await render(view(f.options, 'A'));
  assert.ok(container.querySelector('img'));
  await render(view(f.options, 'invalid'));
  assert.equal(container.querySelector('img'), null);
  assert.equal(container.querySelector('script'), null);
  assert.match(container.querySelector('[role=alert]').textContent, /invalid DSL/);
  await render(view(f.options, 'failure'));
  assert.match(container.querySelector('[role=alert]').textContent, /could not execute/);
  await render(view(f.options, 'B'));
  assert.ok(container.querySelector('img'));
});

test('a runtime that finishes initializing after unmount is disposed without rendering', async () => {
  const ready = deferred();
  const f = fixture();
  await render(view({ loadRuntime: () => ready.promise }, 'A'));
  await render(null);
  await act(async () => ready.resolve(f.native));
  assert.equal(f.stats.calls.length, 0);
  assert.equal(f.stats.disposed, 1);
});

test('changing provider options retires the old runtime and updates the image', async () => {
  const first = fixture(() => png(10));
  const second = fixture(() => png(20));
  await render(view(first.options, 'A'));
  await render(view(second.options, 'A'));
  assert.equal(first.stats.disposed, 1);
  assert.equal(second.stats.loads, 1);
  assert.equal(container.querySelector('img').width, 20);
});

test('initialization failures are shown and a later source change retries', async () => {
  const f = fixture();
  let attempts = 0;
  const options = { loadRuntime: async () => { if (++attempts === 1) throw new Error('Missing assets'); return f.native; } };
  await render(view(options, 'A'));
  assert.match(container.querySelector('[role=alert]').textContent, /Missing assets/);
  await render(view(options, 'B'));
  assert.equal(attempts, 2);
  assert.ok(container.querySelector('img'));
});

test('non-Error initialization failures remain visible instead of breaking React render', async () => {
  for (const failure of ['Missing assets', null, undefined]) {
    await render(view({ loadRuntime: async () => { throw failure; } }, 'A'));
    assert.match(container.querySelector('[role=alert]').textContent, /Missing assets|Could not render diagram/);
  }
});
