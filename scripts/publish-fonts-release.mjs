import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { command } from './command.mjs';
import { assertRegistryState, assertPublishedState } from './release-policy.mjs';
import { readPublicRegistry, waitForPublication } from './publish-release.mjs';
import { fontsRoot, verifyFontsArtifact, verifyFontsPackage } from './fonts-release.mjs';

/** Bootstrap and OIDC publish the same verified artifact, preserving existing latest. */
export async function publishFontsRelease({ directory, expected, dryRun = false, readRegistry = () => readPublicRegistry('@drawmotive/textgraph-fonts'), run = command }) {
  const release = await verifyFontsArtifact(directory, expected);
  const before = await readRegistry();
  assertRegistryState(release.version, before);
  if (before?.versions?.[release.version]) {
    assertPublishedState(release, before, before);
    return { ...release, status: 'already-published' };
  }
  const args = ['publish', path.join(directory, release.filename), '--ignore-scripts', '--access', 'public', '--tag', release.tag, '--registry', 'https://registry.npmjs.org/'];
  if (dryRun) args.push('--dry-run');
  await run('npm', args, fontsRoot, { interactive: !dryRun });
  if (!dryRun) await waitForPublication(release, before, readRegistry);
  return { ...release, status: dryRun ? 'dry-run' : 'published' };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--dry-run')) throw new Error('Usage: node scripts/publish-fonts-release.mjs [--dry-run]');
  const expected = await verifyFontsPackage(fontsRoot, process.env.RELEASE_TAG);
  const result = await publishFontsRelease({ directory: path.join(fontsRoot, '.release'), expected, dryRun: args.includes('--dry-run') });
  console.log(JSON.stringify(result, null, 2));
}
