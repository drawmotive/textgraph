import { initializeTextGraph } from '@drawmotive/textgraph/node';
const runtime = await initializeTextGraph();
try { console.log(await runtime.validate(process.argv[2] ?? 'A -> B')); }
finally { await runtime.dispose(); }
