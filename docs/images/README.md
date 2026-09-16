# README preview

`service-flow.png` is actual output from the package's bundled renderer, using
`examples/service-flow.textgraph`. Keep the root README's source block and
playground link synchronized with that file.

Regenerate from the repository root with Node.js 22+:

```bash
node --input-type=module <<'JS'
import { readFile, writeFile } from 'node:fs/promises';
import { initializeTextGraph } from '@drawmotive/textgraph/node';

const textgraph = await initializeTextGraph();
try {
  const source = await readFile('examples/service-flow.textgraph', 'utf8');
  const result = await textgraph.renderPng(source, { scale: 2, padding: 24 });
  if (!result.success) throw new Error(JSON.stringify(result.diagnostics));
  await writeFile('docs/images/service-flow.png', result.png);
} finally {
  await textgraph.dispose();
}
JS
```

The root README uses an absolute GitHub raw URL so the image works on npm as well
as GitHub. Push the image and source to the public repository before publishing
the next npm version; npm refreshes its displayed README on publication.
