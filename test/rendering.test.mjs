import assert from 'node:assert/strict';
import test from 'node:test';
import { initializeTextGraph, DrawMotiveError } from '../src/index.js';

const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==';
const pngBytes = () => Uint8Array.from(Buffer.from(pngBase64, 'base64'));
const envelope = { protocolVersion: 2, success: true, width: 1, height: 1, diagnostics: [] };
// One native call: the JSON envelope plus the PNG the host copied out of WASM memory for it.
const respond = (value = envelope, png = value.success ? pngBytes() : undefined) => ({ json: JSON.stringify(value), ...(png === undefined ? {} : { png }) });
const valid = { protocolVersion: 2, valid: true, diagnostics: [] };
const create = (execute = () => respond(), extras = {}, options = {}) => initializeTextGraph({
  ...options, loadRuntime: async () => ({ abiVersion: '1.0.0', execute, validate: () => JSON.stringify(valid), ...extras }),
});

test('renderPng publishes the native PNG bytes and documented export defaults', async () => {
  const requests = [];
  const delivered = [];
  const instance = await create(request => {
    requests.push(JSON.parse(request));
    const response = respond();
    delivered.push(response.png);
    return response;
  });
  const first = await instance.renderPng('A -> B');
  assert.equal(first.success, true);
  assert.ok(first.png instanceof Uint8Array);
  // The host already copied the bytes out of WASM memory for this call; the wrapper adds no copy.
  assert.equal(first.png, delivered[0]);
  assert.deepEqual(first.png, pngBytes());
  assert.equal(first.width, 1);
  assert.equal(first.height, 1);
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.diagnostics));
  first.png[0] = 0;
  assert.equal((await instance.renderPng('A')).png[0], 137);
  assert.deepEqual(requests[0], { protocolVersion: 2, operation: 'render', source: 'A -> B', export: { format: 'png', scale: 1, padding: 10 } });
  assert.equal(instance.info.protocolVersion, 2);
  assert.ok(instance.info.capabilities.includes('textgraph-render-v1'));
  await instance.dispose();
});

test('renderPng preserves native display dimensions independently of raster size', async () => {
  const instance = await create(() => respond({ ...envelope, displayWidth: 2.5, displayHeight: 2.5 }));
  const result = await instance.renderPng('A', { scale: 2, maxWidth: 1 });
  assert.equal(result.width, 1);
  assert.equal(result.height, 1);
  assert.equal(result.displayWidth, 2.5);
  assert.equal(result.displayHeight, 2.5);
  await instance.dispose();
});

test('render responses remain valid without display dimensions', async () => {
  const instance = await create();
  const result = await instance.renderPng('A');
  assert.equal(Object.hasOwn(result, 'displayWidth'), false);
  assert.equal(Object.hasOwn(result, 'displayHeight'), false);
  await instance.dispose();
});

test('render response rejects incomplete or invalid display dimensions', async () => {
  for (const dimensions of [
    { displayWidth: 2 }, { displayHeight: 2 },
    { displayWidth: 0, displayHeight: 2 }, { displayWidth: 2, displayHeight: -1 },
    { displayWidth: null, displayHeight: 2 }, { displayWidth: 2, displayHeight: '2' },
  ]) {
    const instance = await create(() => respond({ ...envelope, ...dimensions }));
    await assert.rejects(instance.renderPng('A'), { code: 'INVALID_RESPONSE' });
    await instance.dispose();
  }
  const instance = await create(() => respond({ protocolVersion: 2, success: false, displayWidth: 2, displayHeight: 2,
    diagnostics: [{ code: 'TG_ERROR', severity: 'error', stage: 'render', message: 'Cannot render' }] }));
  await assert.rejects(instance.renderPng('A'), { code: 'INVALID_RESPONSE' });
  await instance.dispose();
});

test('renderPng forwards explicit export options', async () => {
  const instance = await create(request => {
    assert.deepEqual(JSON.parse(request).export, { format: 'png', scale: 3, padding: 0, maxWidth: 640 });
    return respond();
  });
  assert.deepEqual((await instance.renderPng('A', { scale: 3, padding: 0, maxWidth: 640 })).png, pngBytes());
  await instance.dispose();
});

test('render diagnostics resolve as frozen failure results without PNG data', async () => {
  for (const stage of ['parse', 'semantic', 'layout', 'render', 'font']) {
    const diagnostic = { code: 'TG_ERROR', severity: 'error', stage, message: 'Cannot render' };
    const instance = await create(() => respond({ protocolVersion: 2, success: false, diagnostics: [diagnostic] }));
    assert.deepEqual(await instance.renderPng('A'), { success: false, diagnostics: [diagnostic] });
    assert.ok(Object.isFrozen((await instance.renderPng('A')).diagnostics[0]));
    await instance.dispose();
  }
});

test('render options reject invalid values, including the removed encoding, before calling the runtime', async () => {
  let calls = 0;
  const instance = await create(() => { calls++; return respond(); });
  for (const source of [null, 1, {}, undefined]) await assert.rejects(instance.renderPng(source), { code: 'INVALID_ARGUMENT' });
  for (const options of [null, [], 1, { encoding: 'bytes' }, { encoding: 'base64' }, { encoding: undefined }, { scale: 0 }, { scale: NaN }, { scale: Infinity },
    { scale: 1e100 }, { scale: Number.MIN_VALUE }, { padding: 1e100 },
    { padding: -1 }, { padding: NaN }, { maxWidth: 0 }, { maxWidth: 1.5 }, { maxWidth: Infinity }, { signal: {} }, { onPreview: true }]) {
    await assert.rejects(instance.renderPng('A', options), { code: 'INVALID_ARGUMENT' });
  }
  assert.equal(calls, 0);
  await instance.dispose();
});

test('preview callbacks receive validated PNG bytes before final completion', async () => {
  const gate = Promise.withResolvers();
  const published = Promise.withResolvers();
  const runtime = await create(async (_request, context) => {
    context.onPreview(respond());
    await gate.promise;
    return respond();
  });
  const rendering = runtime.renderPng('A', { onPreview: result => published.resolve(result) });
  try {
    const result = await published.promise;
    assert.ok(Object.isFrozen(result));
    assert.ok(result.png instanceof Uint8Array);
    assert.equal(result.success, true);
  } finally { gate.resolve(); }
  await rendering;
  await runtime.dispose();
});

test('render response rejects malformed PNG payloads, dimensions and envelopes', async () => {
  const error = [{ code: 'X', severity: 'error', stage: 'render', message: 'bad' }];
  for (const response of [undefined, 'legacy JSON string', {}, { json: 'not JSON' }, { json: '{}' },
    respond({ ...envelope, protocolVersion: 1 }), respond({ ...envelope, width: 0 }),
    respond({ ...envelope, width: 2 }), respond({ ...envelope, height: 1.5 }),
    // Protocol 2 envelopes never carry image data, even beside a valid payload.
    respond({ ...envelope, png: pngBase64 }), respond({ ...envelope, svg: '<svg/>' }),
    { json: JSON.stringify(envelope) }, respond(envelope, Array.from(pngBytes())), respond(envelope, pngBytes().buffer),
    respond(envelope, Uint8Array.from(Buffer.from('not a png'))), respond(envelope, pngBytes().subarray(0, 24)),
    { ...respond(), svg: '<svg xmlns="http://www.w3.org/2000/svg"/>' },
    respond({ ...envelope, diagnostics: error }),
    respond({ protocolVersion: 2, success: false, diagnostics: [] }),
    respond({ protocolVersion: 2, success: false, diagnostics: error }, pngBytes()),
    respond({ ...envelope, diagnostics: [{ code: 'X', severity: 'warning', stage: 'unknown', message: 'bad' }] })]) {
    const instance = await create(() => response);
    await assert.rejects(instance.renderPng('A'), { code: 'INVALID_RESPONSE' });
    await instance.dispose();
  }
});

test('render wraps runtime errors and preserves structured operational errors', async () => {
  for (const [cause, code] of [[new Error('native'), 'RUNTIME_FAILED'], [new DrawMotiveError('RESOURCE_NOT_FOUND', 'font missing'), 'RESOURCE_NOT_FOUND']]) {
    const instance = await create(() => { throw cause; });
    await assert.rejects(instance.renderPng('A'), { code });
    await instance.dispose();
  }
  const legacy = await create(undefined, { execute: undefined });
  await assert.rejects(legacy.renderPng('A'), { code: 'UNSUPPORTED_CAPABILITY' });
  assert.equal((await legacy.validate('A')).valid, true);
  await legacy.dispose();
});

test('validate, render and disposal share a queue and skip cancelled render work', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const order = [];
  const instance = await create(async request => { order.push(JSON.parse(request).source); await gate; return respond(); }, {
    validate: () => { order.push('validate'); return JSON.stringify(valid); },
    dispose: () => { order.push('dispose'); },
  });
  const first = instance.renderPng('first');
  const second = instance.validate('A');
  const controller = new AbortController();
  const cancelled = assert.rejects(instance.renderPng('cancelled', { signal: controller.signal }), { name: 'AbortError' });
  controller.abort();
  const disposing = instance.dispose();
  await assert.rejects(instance.renderPng('late'), { code: 'INSTANCE_DISPOSED' });
  release();
  await Promise.all([first, second, cancelled, disposing]);
  assert.deepEqual(order, ['first', 'validate', 'dispose']);
});

test('running render cancellation takes precedence over native completion and failure', async () => {
  for (const fails of [false, true]) {
    const controller = new AbortController();
    const instance = await create(() => { controller.abort(); if (fails) throw new Error('native'); return respond(); });
    await assert.rejects(instance.renderPng('A', { signal: controller.signal }), { name: 'AbortError' });
    await instance.dispose();
  }
});

test('language packs validate eagerly, copy bytes and URLs, and perform no I/O for validate', async () => {
  let normalized;
  const bytes = new Uint8Array([1, 2, 3]);
  const url = new URL('https://fonts.example/chinese.ttf');
  const packs = [{ fonts: [{ family: 'Japanese', source: bytes }, { family: 'Chinese', source: url }], fallbackFamilies: ['Chinese', 'Japanese'] }];
  const instance = await initializeTextGraph({ languagePacks: packs,
    fetch: () => { throw new Error('must not fetch'); },
    loadRuntime: async options => { normalized = options.languagePacks; return { abiVersion: '1.0.0', validate: () => JSON.stringify(valid) }; },
  });
  bytes[0] = 9; url.pathname = '/changed'; packs[0].fallbackFamilies.reverse();
  assert.deepEqual([...normalized[0].fonts[0].source], [1, 2, 3]);
  assert.equal(normalized[0].fonts[1].source.href, 'https://fonts.example/chinese.ttf');
  assert.deepEqual(normalized[0].fallbackFamilies, ['Chinese', 'Japanese']);
  assert.equal((await instance.validate('A')).valid, true);
  await instance.dispose();
  for (const languagePacks of [null, {}, [null], [{ fonts: [] }], [{ fonts: [{ family: '', source: bytes }] }],
    [{ fonts: [{ family: 'A', source: './font.ttf' }] }], [{ fonts: [{ family: 'A', source: new Uint8Array() }] }],
    [{ fonts: [{ family: 'A', source: bytes }], fallbackFamilies: ['missing'] }],
    [{ fonts: [{ family: 'A', source: bytes }, { family: 'A', source: bytes }] }],
    [{ fonts: [{ family: 'Noto Sans', source: bytes }] }],
    [{ fonts: [{ family: 'Fuzzy Bubbles', source: bytes }] }]]) {
    await assert.rejects(create(undefined, {}, { languagePacks }), { code: 'INVALID_ARGUMENT' });
  }
});
