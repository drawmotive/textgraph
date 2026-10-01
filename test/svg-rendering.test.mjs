import assert from 'node:assert/strict';
import test from 'node:test';
import { initializeTextGraph, DrawMotiveError } from '../src/index.js';

const svg = '<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40.5 20.25"><path d="M0 0L20 10"/></svg>';
const success = { protocolVersion: 1, success: true, svg, displayWidth: 40.5, displayHeight: 20.25, diagnostics: [] };
const valid = { protocolVersion: 1, valid: true, diagnostics: [] };
const error = { code: 'TG_RENDER_ERROR', severity: 'error', stage: 'render', message: 'Cannot render' };
const warning = { code: 'TG_FONT_WARNING', severity: 'warning', stage: 'font', message: 'Missing glyph', location: { line: 0, column: 2 } };
const create = (execute = () => JSON.stringify(success), extras = {}) => initializeTextGraph({
  loadRuntime: async () => ({ abiVersion: '1.0.0', capabilities: ['textgraph-validate-v1', 'textgraph-render-v1', 'textgraph-render-svg-v1'],
    execute, validate: () => JSON.stringify(valid), ...extras }),
});

test('renderSvg returns frozen vector output and sends only SVG export defaults', async () => {
  const requests = [];
  const instance = await create(request => { requests.push(JSON.parse(request)); return JSON.stringify({ ...success, diagnostics: [warning] }); });
  try {
    const result = await instance.renderSvg('A -> B');
    assert.deepEqual(result, { success: true, svg, displayWidth: 40.5, displayHeight: 20.25, diagnostics: [warning] });
    assert.ok(Object.isFrozen(result));
    assert.ok(Object.isFrozen(result.diagnostics));
    assert.ok(Object.isFrozen(result.diagnostics[0]));
    assert.ok(Object.isFrozen(result.diagnostics[0].location));
    assert.deepEqual(requests[0], { protocolVersion: 1, operation: 'render', source: 'A -> B', export: { format: 'svg', padding: 10 } });
    await instance.renderSvg('A: 日本語', { padding: 0, language: 'ja' });
    assert.deepEqual(requests[1], { protocolVersion: 1, operation: 'render', source: 'A: 日本語', language: 'ja', export: { format: 'svg', padding: 0 } });
  } finally { await instance.dispose(); }
});

test('renderSvg requires explicit SVG capability before executing any work', async () => {
  for (const capabilities of [undefined, [], ['textgraph-render-v1']]) {
    let calls = 0;
    const instance = await create(() => { calls++; return JSON.stringify(success); }, { capabilities });
    try {
      await assert.rejects(instance.renderSvg('A'), { code: 'UNSUPPORTED_CAPABILITY' });
      assert.equal(calls, 0);
      assert.equal((await instance.validate('A')).valid, true);
    } finally { await instance.dispose(); }
  }
  const missingExecute = await create(undefined, { execute: undefined });
  try { await assert.rejects(missingExecute.renderSvg('A'), { code: 'UNSUPPORTED_CAPABILITY' }); }
  finally { await missingExecute.dispose(); }
});

test('SVG options reject PNG settings, unknown properties and invalid values before execution', async () => {
  let calls = 0;
  const instance = await create(() => { calls++; return JSON.stringify(success); });
  try {
    for (const source of [undefined, null, 42, {}]) await assert.rejects(instance.renderSvg(source), { code: 'INVALID_ARGUMENT' });
    for (const options of [null, [], 42, { encoding: 'bytes' }, { scale: 1 }, { maxWidth: 100 }, { format: 'svg' }, { unknown: undefined },
      { padding: -1 }, { padding: NaN }, { padding: Infinity }, { padding: 1e100 }, { padding: '10' },
      { language: '' }, { language: 'not a tag' }, { language: 1 }, { signal: {} }]) {
      await assert.rejects(instance.renderSvg('A', options), { code: 'INVALID_ARGUMENT' });
    }
    assert.equal(calls, 0);
  } finally { await instance.dispose(); }
});

test('SVG diagnostics resolve as frozen failures without image fields', async () => {
  for (const stage of ['parse', 'semantic', 'layout', 'render', 'font']) {
    const diagnostic = { ...error, stage, location: { line: 1, column: 3 } };
    const instance = await create(() => JSON.stringify({ protocolVersion: 1, success: false, diagnostics: [diagnostic] }));
    try {
      const result = await instance.renderSvg('invalid');
      assert.deepEqual(result, { success: false, diagnostics: [diagnostic] });
      assert.ok(Object.isFrozen(result));
      assert.ok(Object.isFrozen(result.diagnostics[0].location));
    } finally { await instance.dispose(); }
  }
});

test('SVG responses reject invalid envelopes, document roots, dimensions and diagnostic consistency', async () => {
  const failure = { protocolVersion: 1, success: false, diagnostics: [error] };
  for (const response of ['not JSON', {}, { ...success, protocolVersion: 2 }, { ...success, success: 'true' },
    { ...success, svg: '' }, { ...success, svg: '   ' }, { ...success, svg: null },
    { ...success, svg: '<svg></svg>' }, { ...success, svg: '<svg xmlns="urn:other"></svg>' },
    { ...success, svg: `<svg label=" xmlns='http://www.w3.org/2000/svg'"/>` },
    { ...success, svg: '<html xmlns="http://www.w3.org/2000/svg"></html>' },
    { ...success, svg: '<svg xmlns="http://www.w3.org/2000/svg">' },
    { ...success, svg: svg + '<html/>' }, { ...success, svg: 'prefix' + svg },
    { ...success, displayWidth: 0 }, { ...success, displayHeight: -1 }, { ...success, displayWidth: '40.5' },
    { ...success, displayHeight: null }, { ...success, displayWidth: undefined }, { ...success, displayHeight: undefined },
    { ...success, diagnostics: [error] }, { ...success, diagnostics: [ { ...warning, stage: 'unknown' } ] },
    { ...success, diagnostics: [ { ...warning, location: { line: -1, column: 0 } } ] },
    { ...failure, diagnostics: [] }, { ...failure, diagnostics: [warning] },
    ...['svg', 'displayWidth', 'displayHeight', 'png', 'width', 'height'].map(key => ({ ...failure, [key]: null }))]) {
    const instance = await create(() => typeof response === 'string' ? response : JSON.stringify(response));
    try { await assert.rejects(instance.renderSvg('A'), { code: 'INVALID_RESPONSE' }); }
    finally { await instance.dispose(); }
  }
});

test('SVG rendering shares the validation queue and skips cancelled or disposed work', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const order = [];
  const instance = await create(async request => { order.push(JSON.parse(request).source); await gate; return JSON.stringify(success); }, {
    validate: () => { order.push('validate'); return JSON.stringify(valid); },
    dispose: () => { order.push('dispose'); },
  });
  const first = instance.renderSvg('first');
  const second = instance.validate('A');
  const controller = new AbortController();
  const cancelled = assert.rejects(instance.renderSvg('cancelled', { signal: controller.signal }), { name: 'AbortError' });
  controller.abort();
  const disposing = instance.dispose();
  await assert.rejects(instance.renderSvg('late'), { code: 'INSTANCE_DISPOSED' });
  release();
  await Promise.all([first, second, cancelled, disposing]);
  assert.deepEqual(order, ['first', 'validate', 'dispose']);
});

test('SVG rendering preserves operational errors and cancellation precedence', async () => {
  for (const [cause, code] of [[new Error('native'), 'RUNTIME_FAILED'], [new DrawMotiveError('RESOURCE_NOT_FOUND', 'font missing'), 'RESOURCE_NOT_FOUND']]) {
    const instance = await create(() => { throw cause; });
    try { await assert.rejects(instance.renderSvg('A'), { code }); }
    finally { await instance.dispose(); }
  }
  for (const fails of [false, true]) {
    const controller = new AbortController();
    const instance = await create((_request, context) => {
      assert.equal(context.signal, controller.signal);
      controller.abort();
      if (fails) throw new Error('native');
      return JSON.stringify(success);
    });
    try { await assert.rejects(instance.renderSvg('A', { signal: controller.signal }), { name: 'AbortError' }); }
    finally { await instance.dispose(); }
  }
});
