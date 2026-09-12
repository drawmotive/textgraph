import { initializeTextGraph } from '../src/platform/worker.js';
const runtime = await initializeTextGraph();
self.onmessage = async event => {
  try { self.postMessage({ id: event.data.id, result: await runtime.validate(event.data.source) }); }
  catch (error) { self.postMessage({ id: event.data.id, error: { name: error.name, code: error.code, message: error.message } }); }
};
