import assert from 'node:assert/strict';
import test from 'node:test';
import { initializeTextGraph } from '../src/index.js';

const valid = { protocolVersion: 1, valid: true, diagnostics: [] };
const create = (validate = () => JSON.stringify(valid), extras = {}) => initializeTextGraph({
  loadRuntime: async () => ({ abiVersion: '1.0.0', validate, ...extras }),
});

test('validate returns an immutable detached result and actual runtime capabilities', async () => {
  const instance = await create();
  assert.deepEqual(await instance.validate('A -> B'), { valid: true, diagnostics: [] });
  assert.ok(instance.info.capabilities.includes('textgraph-validate-v1'));
  assert.ok(Object.isFrozen(instance.info.capabilities));
  assert.ok(Object.isFrozen((await instance.validate('')).diagnostics));
  await instance.dispose();
});

test('DSL errors resolve as diagnostics with zero-based source locations', async () => {
  const diagnostic = { code: 'TG_PARSE_ERROR', severity: 'error', stage: 'parse', message: 'Expected identifier', location: { line: 0, column: 4 } };
  const instance = await create(() => JSON.stringify({ protocolVersion: 1, valid: false, diagnostics: [diagnostic] }));
  assert.deepEqual(await instance.validate('A ->'), { valid: false, diagnostics: [diagnostic] });
  await instance.dispose();
});

test('invalid arguments do not reach the runtime', async () => {
  let calls = 0;
  const instance = await create(() => { calls++; return JSON.stringify(valid); });
  for (const source of [null, 42, {}, undefined]) await assert.rejects(instance.validate(source), { code: 'INVALID_ARGUMENT' });
  await assert.rejects(instance.validate('A', { signal: {} }), { code: 'INVALID_ARGUMENT' });
  assert.equal(calls, 0);
  await instance.dispose();
});

test('malformed or inconsistent bridge responses fail at the protocol boundary', async () => {
  for (const response of ['not JSON', {}, { ...valid, protocolVersion: 2 }, { ...valid, valid: false }, { ...valid, diagnostics: [{ severity: 'error' }] }]) {
    const instance = await create(() => typeof response === 'string' ? response : JSON.stringify(response));
    await assert.rejects(instance.validate('A'), { code: 'INVALID_RESPONSE' });
    await instance.dispose();
  }
});

test('validation is serialized, skips cancelled queued work and drains before disposal', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const calls = [];
  const instance = await create(async source => { calls.push(source); await gate; return JSON.stringify(valid); });
  const first = instance.validate('first');
  const controller = new AbortController();
  const second = instance.validate('second', { signal: controller.signal });
  controller.abort();
  const cancelled = assert.rejects(second, { name: 'AbortError' });
  const disposing = instance.dispose();
  await assert.rejects(instance.validate('late'), { code: 'INSTANCE_DISPOSED' });
  release();
  await Promise.all([first, cancelled, disposing]);
  assert.deepEqual(calls, ['first']);
  assert.equal(instance.state, 'disposed');
});

test('failed cleanup still closes the instance and preserves idempotent disposal', async () => {
  const instance = await create(undefined, { dispose() { throw new Error('cleanup'); } });
  const first = instance.dispose();
  assert.equal(first, instance.dispose());
  await assert.rejects(first, /cleanup/);
  assert.equal(instance.state, 'disposed');
});

test('an aborted running call retains AbortError when its runtime rejects', async () => {
  const controller = new AbortController();
  const instance = await create(async () => { controller.abort(); throw new Error('interrupted'); });
  await assert.rejects(instance.validate('A', { signal: controller.signal }), { name: 'AbortError' });
  await instance.dispose();
});
