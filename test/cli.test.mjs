import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import test from 'node:test';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const root = path.resolve(import.meta.dirname, '..');
const executable = path.join(root, 'scripts/textgraph.mjs');
async function fixture(t) {
  const directory = await mkdtemp(path.join(tmpdir(), 'textgraph-cli-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const input = path.join(directory, 'diagram.textgraph');
  await writeFile(input, 'A -> B');
  return { directory, input };
}
function runtimeFixture(result) {
  const calls = [];
  let disposed = 0;
  const runtime = {
    renderPng: async (...args) => { calls.push(['png', ...args]); return result; },
    renderSvg: async (...args) => { calls.push(['svg', ...args]); return result; },
    dispose: async () => { disposed++; },
  };
  const messages = [];
  return { calls, messages, get disposed() { return disposed; },
    options: { initialize: async () => runtime, stdout: { write: value => messages.push(value) }, stderr: { write: value => messages.push(value) } },
  };
}

test('render CLI is registered and included in published files', async () => {
  const metadata = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(metadata.bin.textgraph, './scripts/textgraph.mjs');
  assert.ok(metadata.files.includes('scripts/textgraph.mjs'));
});

test('render CLI forwards dark and language for PNG and SVG and disposes resources', async t => {
  const { runCli } = await import('../scripts/textgraph.mjs');
  const { input, directory } = await fixture(t);
  for (const format of ['png', 'svg']) {
    const data = format === 'png' ? new Uint8Array([137, 80, 78, 71]) : '<svg/>';
    const f = runtimeFixture({ success: true, [format]: data, diagnostics: [] });
    const output = path.join(directory, `dark.${format}`);
    assert.equal(await runCli(['render', input, '--output', output, '--dark', '--language', 'ja'], f.options), 0);
    assert.deepEqual(f.calls, [[format, 'A -> B', { dark: true, language: 'ja' }]]);
    assert.deepEqual(await readFile(output), Buffer.from(data));
    assert.equal(f.disposed, 1);
  }
});

test('render CLI reads explicit standard input and leaves light options at SDK defaults', async t => {
  const { runCli } = await import('../scripts/textgraph.mjs');
  const { directory } = await fixture(t);
  const f = runtimeFixture({ success: true, svg: '<svg/>', diagnostics: [] });
  const output = path.join(directory, 'stdin.SVG');
  const text = Buffer.from('A: 日本語');
  assert.equal(await runCli(['render', '-', '-o', output], { ...f.options, stdin: Readable.from([text.subarray(0, 4), text.subarray(4)]) }), 0);
  assert.deepEqual(f.calls, [['svg', 'A: 日本語', {}]]);
  assert.equal(await readFile(output, 'utf8'), '<svg/>');
  assert.equal(f.disposed, 1);
});

test('render CLI rejects invalid arguments before starting the runtime', async t => {
  const { runCli } = await import('../scripts/textgraph.mjs');
  const { input, directory } = await fixture(t);
  let loads = 0;
  for (const args of [[], ['validate', input], ['render'], ['render', input],
    ['render', input, '--output', path.join(directory, 'invalid.txt')],
    ['render', input, '--output', path.join(directory, 'out.png'), '--unknown'],
    ['render', input, '--output', path.join(directory, 'out.png'), '--dark=false'],
    ['render', input, '--output', path.join(directory, 'out.png'), '--dark', 'false'],
    ['render', input, 'extra', '--output', path.join(directory, 'out.png')]]) {
    await assert.rejects(runCli(args, { initialize: async () => { loads++; throw new Error('Unexpected initialization'); } }));
  }
  assert.equal(loads, 0);
});

test('render CLI reports diagnostics and does not overwrite output on failed rendering', async t => {
  const { runCli } = await import('../scripts/textgraph.mjs');
  const { input, directory } = await fixture(t);
  const f = runtimeFixture({ success: false, diagnostics: [{ severity: 'error', stage: 'parse', code: 'TG_PARSE_ERROR', message: 'Invalid source' }] });
  const output = path.join(directory, 'existing.png');
  await writeFile(output, 'existing image');
  assert.equal(await runCli(['render', input, '-o', output], f.options), 1);
  assert.equal(await readFile(output, 'utf8'), 'existing image');
  assert.match(f.messages.join(''), /TG_PARSE_ERROR.*Invalid source/);
  assert.equal(f.disposed, 1);
});

test('render CLI disposes runtime after execution and output failures', async t => {
  const { runCli } = await import('../scripts/textgraph.mjs');
  const { input, directory } = await fixture(t);
  let disposed = 0;
  const failure = new Error('Render failed');
  await assert.rejects(runCli(['render', input, '-o', path.join(directory, 'out.png')], { initialize: async () => ({
    renderPng: async () => { throw failure; }, dispose: async () => { disposed++; },
  }) }), failure);
  assert.equal(disposed, 1);
  const f = runtimeFixture({ success: true, png: new Uint8Array([137]), diagnostics: [] });
  await assert.rejects(runCli(['render', input, '-o', path.join(directory, 'missing', 'out.png')], f.options), { code: 'ENOENT' });
  assert.equal(f.disposed, 1);
});

test('render CLI writes actual PNG and SVG with the bundled runtime', async t => {
  const { input, directory } = await fixture(t);
  for (const format of ['png', 'svg']) {
    const output = path.join(directory, `actual.${format}`);
    const result = await exec(process.execPath, [executable, 'render', input, '--output', output], { cwd: directory, timeout: 30000 });
    assert.match(result.stdout, /Saved/);
    const bytes = await readFile(output);
    if (format === 'png') assert.deepEqual([...bytes.slice(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    else assert.ok(bytes.toString('utf8').includes('xmlns="http://www.w3.org/2000/svg"'));
  }
});

test('render CLI help and diagnostics use meaningful process exit codes', async t => {
  const { directory } = await fixture(t);
  const help = await exec(process.execPath, [executable, '--help'], { cwd: directory });
  assert.match(help.stdout, /textgraph render <input> --output <file>.*--dark/);
  const input = path.join(directory, 'invalid.textgraph');
  const output = path.join(directory, 'invalid.png');
  await writeFile(input, 'A ->');
  await assert.rejects(exec(process.execPath, [executable, 'render', input, '-o', output], { cwd: directory, timeout: 30000 }), error => {
    assert.equal(error.code, 1);
    assert.match(error.stderr, /TG_/);
    return true;
  });
  await assert.rejects(stat(output), { code: 'ENOENT' });
});
