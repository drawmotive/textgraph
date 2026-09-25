#!/usr/bin/env node
import { cp, mkdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyFontAssets } from './font-assets.mjs';

/** Copies the complete offline font distribution; this does not preload it in a browser. */
export async function copyFonts(destination) {
  if (!destination) throw new Error('Usage: textgraph-copy-fonts <destination>');
  const source = path.resolve(fileURLToPath(new URL('../assets/', import.meta.url)));
  const target = path.resolve(destination);
  await verifyFontAssets();
  await mkdir(target, { recursive: true });
  const resolvedTarget = await realpath(target);
  if (resolvedTarget === source || resolvedTarget.startsWith(`${source}${path.sep}`)) throw new Error('Destination must be outside the package assets directory');
  await cp(source, target, { recursive: true, force: true });
  return target;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) throw new Error('Usage: textgraph-copy-fonts <destination>');
  console.log(`Copied TextGraph fonts to ${await copyFonts(process.argv[2])}`);
}
