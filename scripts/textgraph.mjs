#!/usr/bin/env node
import { readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { initializeTextGraph } from '../src/platform/node.js';

const usage = 'Usage: textgraph render <input> --output <file> [--dark] [--language <tag>]';
const help = `${usage}

Render a TextGraph source file as PNG or SVG, selected by the output extension.
Use - as input to read UTF-8 source from standard input.

  -o, --output <file>  Output .png or .svg file
      --dark           Render with the native dark theme (default: light)
      --language <tag> Language hint for font selection, such as ja or zh-CN
  -h, --help           Show this help
`;

/** CLI owns one SDK instance; injected host streams and initialization share the same lifecycle. */
export async function runCli(argv, { initialize = initializeTextGraph, stdin = process.stdin, stdout = process.stdout, stderr = process.stderr } = {}) {
  if (argv.length === 1 && ['--help', '-h'].includes(argv[0])) { stdout.write(help); return 0; }
  if (argv[0] !== 'render') throw new Error(usage);
  const { values, positionals } = parseArgs({ args: argv.slice(1), allowPositionals: true, strict: true, options: {
    output: { type: 'string', short: 'o' }, dark: { type: 'boolean' }, language: { type: 'string' }, help: { type: 'boolean', short: 'h' },
  } });
  if (values.help) { stdout.write(help); return 0; }
  if (positionals.length !== 1 || !values.output) throw new Error(usage);
  const format = path.extname(values.output).slice(1).toLowerCase();
  if (!['png', 'svg'].includes(format)) throw new Error('Output must have a .png or .svg extension');
  let source;
  if (positionals[0] === '-') {
    // Join bytes before decoding so a multi-byte character may span stdin chunks.
    const chunks = [];
    for await (const chunk of stdin) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    source = Buffer.concat(chunks).toString('utf8');
  } else source = await readFile(positionals[0], 'utf8');
  const options = { ...(values.dark === undefined ? {} : { dark: values.dark }),
    ...(values.language === undefined ? {} : { language: values.language }) };
  const runtime = await initialize();
  try {
    const result = await (format === 'png' ? runtime.renderPng(source, options) : runtime.renderSvg(source, options));
    for (const diagnostic of result.diagnostics) stderr.write(`${diagnostic.severity}: ${diagnostic.code}: ${diagnostic.message}\n`);
    if (!result.success) return 1;
    await writeFile(values.output, result[format]);
    stdout.write(`Saved ${values.output}\n`);
    return 0;
  } finally { await runtime.dispose(); }
}

// Package bin shims and aliased installations may spell the same entry point differently.
if (process.argv[1] && await realpath(process.argv[1]) === await realpath(fileURLToPath(import.meta.url))) {
  try { process.exitCode = await runCli(process.argv.slice(2)); }
  catch (error) {
    console.error(`${error.code ? `${error.code}: ` : ''}${error.message}`);
    process.exitCode = 1;
  }
}
