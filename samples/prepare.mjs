import { spawn } from 'node:child_process';
import { mkdir, rename } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const artifacts = path.join(import.meta.dirname, '.artifacts');
const available = ['browser', 'react-vite', 'worker', 'node'];
const selected = process.argv.slice(2);
const samples = selected.length ? selected : available;
for (const sample of samples) {
  if (!available.includes(sample)) throw new Error(`Unknown sample: ${sample}. Choose ${available.join(', ')}.`);
}

function npm(args, cwd, capture = false) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', args, {
      cwd, stdio: capture ? ['inherit', 'pipe', 'inherit'] : 'inherit', shell: process.platform === 'win32',
    });
    let output = '';
    if (capture) child.stdout.on('data', chunk => { output += chunk; });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve(output) : reject(new Error(`npm ${args[0]} exited ${code}`)));
  });
}

// Consumers install the public tarball: no source aliases, private bridge build, or registry SDK fallback.
await mkdir(artifacts, { recursive: true });
const output = await npm(['pack', '--ignore-scripts', '--json', '--workspaces=false', '--pack-destination', artifacts], root, true);
const [packed] = JSON.parse(output);
await rename(path.join(artifacts, packed.filename), path.join(artifacts, 'textgraph.tgz'));
for (const sample of samples) {
  await npm(['install', '../.artifacts/textgraph.tgz', '--save-exact', '--ignore-scripts', '--workspaces=false', '--no-audit', '--no-fund'], path.join(import.meta.dirname, sample));
}
console.log(`Prepared ${samples.join(', ')} from ${packed.name}@${packed.version}.`);
