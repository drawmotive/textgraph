#!/usr/bin/env node
import { cp, mkdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../generated/wasm/', import.meta.url));

/** Resolve existing ancestors too, so an output symlink cannot point into the installed runtime. */
async function canonicalPath(directory) {
  try {
    return await realpath(directory);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return path.join(await canonicalPath(path.dirname(directory)), path.basename(directory));
  }
}

function contains(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

/** Copy the complete installed runtime, including scripts, fonts and licenses, without deleting output. */
export async function copyRuntimeAssets(destination) {
  if (typeof destination !== 'string' || destination.trim() === '') {
    throw new Error('Usage: textgraph-copy-assets <destination>');
  }
  const runtime = await realpath(source);
  const output = await canonicalPath(path.resolve(destination));
  if (output === path.parse(output).root || contains(runtime, output) || contains(output, runtime)) {
    throw new Error('Choose a destination outside the installed runtime and below a static asset directory.');
  }
  await mkdir(output, { recursive: true });
  await cp(runtime, output, { recursive: true, force: true });
  return output;
}

// Canonicalize both paths: Windows short temp paths and directory aliases can
// give argv and the ESM loader different spellings for the same executable.
if (process.argv[1] && await realpath(process.argv[1]) === await realpath(fileURLToPath(import.meta.url))) {
  try {
    const [destination, ...extra] = process.argv.slice(2);
    if (extra.length) throw new Error('Usage: textgraph-copy-assets <destination>');
    console.log(`TextGraph runtime copied to ${await copyRuntimeAssets(destination)}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
