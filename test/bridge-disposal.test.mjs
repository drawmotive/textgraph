import assert from 'node:assert/strict';
import test from 'node:test';
import { createBridgeRuntime } from '../src/runtime/dotnet.js';
import { initializeTextGraph } from '../src/index.js';

const manifest = { capabilities: ['textgraph-validate-v1', 'textgraph-render-v1'], bridge: { validate: 'Validate', execute: 'Execute' } };
const info = { abiVersion: '1.0.0', capabilities: manifest.capabilities };
const success = JSON.stringify({ protocolVersion: 1, success: true, diagnostics: [] });
const validation = JSON.stringify({ protocolVersion: 1, valid: true, diagnostics: [] });

test('render-capable loader disposes native resources without preparing fonts and releases bridge references', async () => {
  const calls = [];
  const runtime = createBridgeRuntime({ manifest, info, options: {},
    readAsset: () => { throw new Error('Disposal must not read fonts'); },
    bridge: { Validate: () => validation, Execute: request => { calls.push(JSON.parse(request)); return success; } },
  });
  await runtime.dispose();
  await runtime.dispose();
  assert.deepEqual(calls, [{ protocolVersion: 1, operation: 'dispose' }]);
  assert.throws(() => runtime.validate('A'));
});

test('native cleanup protocol failures release references and keep managed disposal idempotent', async () => {
  for (const [response, code] of [['not JSON', 'INVALID_RESPONSE'], [JSON.stringify({ protocolVersion: 1, success: false, diagnostics: [{ code: 'TG_ERROR', stage: 'render', severity: 'error', message: 'cleanup failed' }] }), 'RUNTIME_FAILED']]) {
    let calls = 0;
    const runtime = createBridgeRuntime({ manifest, info, options: {},
      bridge: { Validate: () => validation, Execute: () => { calls++; return response; } },
    });
    const instance = await initializeTextGraph({ loadRuntime: async () => runtime });
    const disposing = instance.dispose();
    assert.equal(instance.dispose(), disposing);
    await assert.rejects(disposing, { code });
    assert.equal(instance.state, 'disposed');
    await runtime.dispose();
    assert.equal(calls, 1);
    assert.throws(() => runtime.validate('A'));
  }
});

test('legacy bridge disposal retains reference-only cleanup without Execute', async () => {
  const legacy = { ...manifest, capabilities: ['textgraph-validate-v1'], bridge: { validate: 'Validate' } };
  const runtime = createBridgeRuntime({ manifest: legacy, info: { ...info, capabilities: legacy.capabilities }, options: {}, bridge: { Validate: () => validation } });
  assert.equal(runtime.execute, undefined);
  await runtime.dispose();
  assert.throws(() => runtime.validate('A'));
});

test('native cleanup exceptions become operational errors and still release references', async () => {
  const runtime = createBridgeRuntime({ manifest, info, options: {}, bridge: {
    Validate: () => validation, Execute: () => { throw new Error('native cleanup'); },
  } });
  await assert.rejects(runtime.dispose(), { code: 'RUNTIME_FAILED' });
  await runtime.dispose();
  assert.throws(() => runtime.validate('A'));
});

test('managed disposal waits for native validation before sending cleanup', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const calls = [];
  const runtime = createBridgeRuntime({ manifest, info, options: {}, bridge: {
    Validate: async () => { calls.push('validate:start'); await gate; calls.push('validate:end'); return validation; },
    Execute: request => { calls.push(JSON.parse(request).operation); return success; },
  } });
  const instance = await initializeTextGraph({ loadRuntime: async () => runtime });
  const validating = instance.validate('A');
  const disposing = instance.dispose();
  release();
  await Promise.all([validating, disposing]);
  assert.deepEqual(calls, ['validate:start', 'validate:end', 'dispose']);
});
