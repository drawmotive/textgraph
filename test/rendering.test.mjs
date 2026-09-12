import assert from 'node:assert/strict';
import test from 'node:test';
import { initializeTextGraph, DrawMotiveError } from '../src/index.js';

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==';
const success = { protocolVersion: 1, success: true, png, width: 1, height: 1, diagnostics: [] };
const valid = { protocolVersion: 1, valid: true, diagnostics: [] };
const create = (execute = () => JSON.stringify(success), extras = {}, options = {}) => initializeTextGraph({
  ...options, loadRuntime: async () => ({ abiVersion: '1.0.0', execute, validate: () => JSON.stringify(valid), ...extras }),
});

test('renderPng defaults to detached PNG bytes and documented export defaults', async () => {
  const requests = [];
  const instance = await create(request => { requests.push(JSON.parse(request)); return JSON.stringify(success); });
  const first = await instance.renderPng('A -> B');
  assert.equal(first.success, true);
  assert.ok(first.png instanceof Uint8Array);
  assert.deepEqual(first.png, Uint8Array.from(Buffer.from(png, 'base64')));
  assert.equal(first.width, 1);
  assert.equal(first.height, 1);
  assert.ok(Object.isFrozen(first));
  assert.ok(Object.isFrozen(first.diagnostics));
  first.png[0] = 0;
  assert.equal((await instance.renderPng('A')).png[0], 137);
  assert.deepEqual(requests[0], { protocolVersion: 1, operation: 'render', source: 'A -> B', export: { format: 'png', scale: 2, padding: 10 } });
  assert.ok(instance.info.capabilities.includes('textgraph-render-v1'));
  await instance.dispose();
});

test('renderPng supports base64 and forwards explicit export options', async () => {
  const instance = await create(request => {
    assert.deepEqual(JSON.parse(request).export, { format: 'png', scale: 3, padding: 0, maxWidth: 640 });
    return JSON.stringify(success);
  });
  assert.equal((await instance.renderPng('A', { encoding: 'base64', scale: 3, padding: 0, maxWidth: 640 })).png, png);
  await instance.dispose();
});

test('render diagnostics resolve as frozen failure results without PNG data', async () => {
  for (const stage of ['parse', 'semantic', 'layout', 'render', 'font']) {
    const diagnostic = { code: 'TG_ERROR', severity: 'error', stage, message: 'Cannot render' };
    const instance = await create(() => JSON.stringify({ protocolVersion: 1, success: false, diagnostics: [diagnostic] }));
    assert.deepEqual(await instance.renderPng('A'), { success: false, diagnostics: [diagnostic] });
    assert.ok(Object.isFrozen((await instance.renderPng('A')).diagnostics[0]));
    await instance.dispose();
  }
});

test('render options reject invalid values before calling the runtime', async () => {
  let calls = 0;
  const instance = await create(() => { calls++; return JSON.stringify(success); });
  for (const source of [null, 1, {}, undefined]) await assert.rejects(instance.renderPng(source), { code: 'INVALID_ARGUMENT' });
  for (const options of [null, [], 1, { encoding: 'url' }, { scale: 0 }, { scale: NaN }, { scale: Infinity },
    { scale: 1e100 }, { scale: Number.MIN_VALUE }, { padding: 1e100 },
    { padding: -1 }, { padding: NaN }, { maxWidth: 0 }, { maxWidth: 1.5 }, { maxWidth: Infinity }, { signal: {} }]) {
    await assert.rejects(instance.renderPng('A', options), { code: 'INVALID_ARGUMENT' });
  }
  assert.equal(calls, 0);
  await instance.dispose();
});

test('render response rejects malformed base64, PNG headers, dimensions and envelopes', async () => {
  for (const response of ['not JSON', {}, { ...success, protocolVersion: 2 }, { ...success, width: 0 },
    { ...success, width: 2 }, { ...success, height: 1.5 }, { ...success, png: '@@==' },
    { ...success, png: png.slice(0, -1) }, { ...success, png: Buffer.from('not a png').toString('base64') },
    { ...success, png: png.slice(0, 24) }, { ...success, diagnostics: [{ code: 'X', severity: 'error', stage: 'render', message: 'bad' }] },
    { protocolVersion: 1, success: false, diagnostics: [] },
    { ...success, diagnostics: [{ code: 'X', severity: 'warning', stage: 'unknown', message: 'bad' }] }]) {
    const instance = await create(() => typeof response === 'string' ? response : JSON.stringify(response));
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
  const instance = await create(async request => { order.push(JSON.parse(request).source); await gate; return JSON.stringify(success); }, {
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
    const instance = await create(() => { controller.abort(); if (fails) throw new Error('native'); return JSON.stringify(success); });
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
    [{ fonts: [{ family: 'NotoSans-Regular', source: bytes }] }]]) {
    await assert.rejects(create(undefined, {}, { languagePacks }), { code: 'INVALID_ARGUMENT' });
  }
});
