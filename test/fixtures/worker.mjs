import { parentPort } from 'node:worker_threads';
import { initializeTextGraph, platform } from '@drawmotive/textgraph/worker';

const instance = await initializeTextGraph({ loadRuntime: async () => ({ abiVersion: '1.0.0' }) });
parentPort.postMessage({ platform, state: instance.state });
