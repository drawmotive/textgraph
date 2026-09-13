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
  // prepack inherits npm_config_dry_run from npm pack --dry-run. These isolated
  // fixture operations must create actual tarballs and installed files.
  const runNpm = (args, cwd) => exec(process.execPath, [npm, ...args, '--dry-run=false'], { cwd });
  try {
    const packageRoot = path.resolve(import.meta.dirname, '..');
    const { stdout } = await runNpm(['pack', '--ignore-scripts', '--json', '--workspaces=false', '--pack-destination', root], packageRoot);
    const [packed] = JSON.parse(stdout);
    assert.ok(packed.files.some(file => file.path === 'generated/wasm-manifest.js'));
    assert.ok(packed.files.some(file => file.path === 'schemas/validation.schema.json'));
    assert.deepEqual(packed.files.filter(file => file.path.endsWith('.ttf')).map(file => file.path).sort(), [
      'generated/wasm/FuzzyBubbles-Regular.ttf', 'generated/wasm/NotoSans-Regular.ttf',
    ]);
    assert.ok(packed.files.every(file => !file.path.startsWith('language-packs/')));
    assert.ok(packed.files.every(file => !file.path.startsWith('samples/')));
    assert.ok(packed.files.some(file => file.path === 'src/react/index.js'));
    assert.ok(packed.files.some(file => file.path === 'scripts/copy-assets.mjs'));
    assert.ok(packed.files.some(file => file.path === 'generated/wasm/NotoSans-LICENSE.txt'));
    assert.ok(packed.files.some(file => file.path === 'generated/wasm/FuzzyBubbles-LICENSE.txt'));
    assert.ok(packed.files.every(file => !/[.](pdb|map|cs)$/.test(file.path) && !file.path.startsWith('.local/')));
    const consumer = path.join(root, 'consumer');
    await mkdir(consumer);
    await writeFile(path.join(consumer, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
    await runNpm(['install', '--ignore-scripts', '--no-audit', '--no-fund', path.join(root, packed.filename)], consumer);
    const program = "import {initializeTextGraph} from '@drawmotive/textgraph'; const r=await initializeTextGraph(); console.log(JSON.stringify(await r.validate('A -> B'))); await r.dispose();";
    const result = await exec(process.execPath, ['--input-type=module', '-e', program], { cwd: consumer });
    assert.deepEqual(JSON.parse(result.stdout), { valid: true, diagnostics: [] });
    const lock = JSON.parse(await readFile(path.join(consumer, 'package-lock.json'), 'utf8'));
    assert.deepEqual(Object.keys(lock.packages).sort(), ['', 'node_modules/@drawmotive/textgraph']);
    const cli = path.join(consumer, 'node_modules/@drawmotive/textgraph/scripts/copy-assets.mjs');
    await exec(process.execPath, [cli, 'public/textgraph/wasm'], { cwd: consumer });
    assert.deepEqual(await readFile(path.join(consumer, 'public/textgraph/wasm/dotnet.native.wasm')),
      await readFile(path.join(packageRoot, 'generated/wasm/dotnet.native.wasm')));
    const { stdout: fontPackOutput } = await runNpm(['pack', '--ignore-scripts', '--json', '--workspaces=false', '--pack-destination', root], path.join(packageRoot, 'language-packs/zh-cn'));
    const [fontPack] = JSON.parse(fontPackOutput);
    assert.ok(fontPack.files.some(file => file.path === 'fonts/NotoSansSC-Regular.ttf'));
    assert.ok(fontPack.files.some(file => file.path === 'OFL.txt'));
    assert.ok(fontPack.files.every(file => !file.path.endsWith('.wasm')));
    await runNpm(['install', '--ignore-scripts', '--no-audit', '--no-fund', path.join(root, fontPack.filename)], consumer);
    const pngProgram = "import {initializeTextGraph} from '@drawmotive/textgraph'; import {zhCN} from '@drawmotive/textgraph-fonts-zh-cn'; const r=await initializeTextGraph({languagePacks:[zhCN]}); const p=await r.renderPng('A: 开始\\nB: 完成\\nA -> B'); console.log(JSON.stringify({success:p.success,signature:Array.from(p.png?.slice(0,8)??[]),diagnostics:p.diagnostics})); await r.dispose();";
    // Font caches must not keep a host process alive after wrapper disposal.
    const pngResult = await exec(process.execPath, ['--input-type=module', '-e', pngProgram], { cwd: consumer, timeout: 30000 });
    assert.deepEqual(JSON.parse(pngResult.stdout), {success:true,signature:[137,80,78,71,13,10,26,10],diagnostics:[]});
  } finally { await rm(root, { recursive: true, force: true }); }
});
