import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { initializeTextGraph } from '@drawmotive/textgraph/node';

const sourcePath = process.argv[2] ?? new URL('./diagram.textgraph', import.meta.url);
const destination = path.resolve(process.argv[3] ?? 'output/diagram.png');
const source = await readFile(sourcePath, 'utf8');
// Node reads the runtime directly from the installed package; no asset copy or HTTP server is needed.
const textgraph = await initializeTextGraph();
try {
  const result = await textgraph.renderPng(source, { maxWidth: 1600 });
  if (!result.success) throw new Error(result.diagnostics.map(item => item.message).join('\n'));
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, result.png);
  console.log(`Wrote ${result.width} × ${result.height} PNG to ${destination}`);
} finally {
  await textgraph.dispose();
}
