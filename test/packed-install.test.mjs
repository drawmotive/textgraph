import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';
const exec = promisify(execFile);

test('npm tarball works outside the private workspace with no development dependencies', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'textgraph-packed-'));
  const npm = process.env.npm_execpath ?? path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
  try {
    const packageRoot = path.resolve(import.meta.dirname, '..');
    const { stdout } = await exec(process.execPath, [npm, 'pack', '--ignore-scripts', '--json', '--workspaces=false', '--pack-destination', root], { cwd: packageRoot });
    const [packed] = JSON.parse(stdout);
    assert.ok(packed.files.some(file => file.path === 'generated/wasm-manifest.js'));
    assert.ok(packed.files.some(file => file.path === 'schemas/validation.schema.json'));
    assert.ok(packed.files.every(file => !/[.](pdb|map|cs)$/.test(file.path) && !file.path.startsWith('.local/')));
    const consumer = path.join(root, 'consumer');
    await mkdir(consumer);
    await writeFile(path.join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
    await exec(process.execPath, [npm, 'install', '--ignore-scripts', '--no-audit', '--no-fund', path.join(root, packed.filename)], { cwd: consumer });
    const program = "import {initializeTextGraph} from '@drawmotive/textgraph'; const r=await initializeTextGraph(); console.log(JSON.stringify(await r.validate('A -> B'))); await r.dispose();";
    const result = await exec(process.execPath, ['--input-type=module', '-e', program], { cwd: consumer });
    assert.deepEqual(JSON.parse(result.stdout), { valid: true, diagnostics: [] });
    const lock = JSON.parse(await readFile(path.join(consumer, 'package-lock.json'), 'utf8'));
    assert.deepEqual(Object.keys(lock.packages).sort(), ['', 'node_modules/@drawmotive/textgraph']);
  } finally { await rm(root, { recursive: true, force: true }); }
});
