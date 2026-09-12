import { initializeTextGraph } from '../src/platform/browser.js';
const runtime = await initializeTextGraph();
try { document.querySelector('#result').textContent = JSON.stringify(await runtime.validate('A -> B'), null, 2); }
finally { await runtime.dispose(); }
