import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv from 'ajv/dist/2020.js';
import manifest from '../generated/wasm-manifest.js';
const schema = async name => new Ajv({ strict: true }).compile(JSON.parse(await readFile(new URL(`../schemas/${name}.schema.json`, import.meta.url), 'utf8')));

test('manifest schema requires resource declarations and Execute when rendering is advertised', async () => {
  const validate = await schema('wasm-manifest');
  const valid = { ...manifest, bridge: { ...manifest.bridge, execute: 'Execute' },
    capabilities: [...new Set([...manifest.capabilities, 'textgraph-render-v1'])],
    rendering: { theme: 'wasm/themes.css', fonts: [{ family: 'NotoSans-Regular', asset: 'wasm/NotoSans-Regular.ttf' }] },
  };
  assert.equal(validate(valid), true, JSON.stringify(validate.errors));
  const { rendering, ...missingResources } = valid;
  assert.equal(validate(missingResources), false);
  assert.equal(validate({ ...valid, bridge: { ...valid.bridge, execute: undefined } }), false);
  assert.equal(validate({ ...valid, rendering: { ...rendering, fonts: [] } }), false);
});

test('render protocol schema separates successes and failures and enforces PNG metadata', async () => {
  const validate = await schema('render');
  const success = { protocolVersion: 1, success: true, png: 'iVBORw0KGgo=', width: 1, height: 1, diagnostics: [] };
  const error = { code: 'TG_LAYOUT_ERROR', severity: 'error', stage: 'layout', message: 'Cannot arrange nodes' };
  assert.equal(validate(success), true, JSON.stringify(validate.errors));
  assert.equal(validate({ protocolVersion: 1, success: false, diagnostics: [error] }), true, JSON.stringify(validate.errors));
  for (const value of [{ ...success, width: 0 }, { ...success, height: 1.5 }, { ...success, png: 'invalid' },
    { ...success, diagnostics: [error] }, { ...success, success: false }, { protocolVersion: 1, success: false, diagnostics: [] }]) assert.equal(validate(value), false);
});
