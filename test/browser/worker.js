import { initializeTextGraph } from '../../src/platform/worker.js';
try {
  const runtime = await initializeTextGraph();
  const result = await runtime.validate('A -> B');
  await runtime.dispose();
  postMessage({ result, state: runtime.state });
} catch (error) { postMessage({ error: String(error), cause: String(error.cause) }); }
