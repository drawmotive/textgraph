import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv from 'ajv/dist/2020.js';
import manifest from '../generated/wasm-manifest.js';
const read = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));

test('JSON and ESM manifest projections match and conform to the shipped schema', async () => {
  const json = await read('../generated/wasm-manifest.json');
  assert.deepEqual(manifest, json);
  const pkg = await read('../package.json');
  assert.equal(json.packageVersion, pkg.version);
  const validate = new Ajv({ strict: true }).compile(await read('../schemas/wasm-manifest.schema.json'));
  assert.equal(validate(json), true, JSON.stringify(validate.errors));
  assert.equal(validate({ ...json, privateSource: {} }), false);
});

test('validation protocol accepts diagnostics and rejects invalid source positions', async () => {
  const validate = new Ajv({ strict: true }).compile(await read('../schemas/validation.schema.json'));
  const diagnostic = { code: 'TG_PARSE_ERROR', severity: 'error', stage: 'parse', message: 'Bad source', location: { line: 0, column: 4 } };
  const result = { protocolVersion: 1, valid: false, diagnostics: [diagnostic] };
  assert.equal(validate(result), true);
  diagnostic.location.column = -1;
  assert.equal(validate(result), false);
});
