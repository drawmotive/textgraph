import { mkdir, rename } from 'node:fs/promises';
import path from 'node:path';
import { command } from '../scripts/command.mjs';

const root = path.resolve(import.meta.dirname, '..');
const artifacts = path.join(import.meta.dirname, '.artifacts');
const available = ['browser', 'react-vite', 'worker', 'node'];
const selected = process.argv.slice(2);
const samples = selected.length ? selected : available;
for (const sample of samples) {
  if (!available.includes(sample)) throw new Error(`Unknown sample: ${sample}. Choose ${available.join(', ')}.`);
}

// Local samples exercise npm's published file list before release readiness. This
// development tarball is never a release receipt: normal prepack/release commands
// still enforce the coordinated target and native provenance without overrides.
await mkdir(artifacts, { recursive: true });
const { stdout: output } = await command('npm', ['pack', '--ignore-scripts', '--json', '--workspaces=false', '--pack-destination', artifacts], root);
const [packed] = JSON.parse(output);
await rename(path.join(artifacts, packed.filename), path.join(artifacts, 'textgraph.tgz'));
for (const sample of samples) {
  await command('npm', ['install', '../.artifacts/textgraph.tgz', '--save-exact', '--ignore-scripts', '--workspaces=false', '--no-audit', '--no-fund'], path.join(import.meta.dirname, sample), { interactive: true });
}
console.log(`Prepared ${samples.join(', ')} from ${packed.name}@${packed.version}.`);
