import { parentPort } from 'node:worker_threads';
import { initializeTextGraph } from '@drawmotive/textgraph/node';
try {
  const runtime = await initializeTextGraph();
  const result = await runtime.validate('A -> B');
  await runtime.dispose();
  parentPort.postMessage({ result, state: runtime.state });
} catch (error) { parentPort.postMessage({ error: String(error), cause: String(error.cause) }); }
