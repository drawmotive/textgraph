import {
  initializeTextGraph,
  type TextGraphInstance,
  type TextGraphInitializeOptions,
  type TextGraphRuntimeManifest,
} from '../src/index.js';
import { createTextGraphRuntimeLoader, platform as browserPlatform } from '@drawmotive/textgraph/browser';
import { platform as nodePlatform } from '@drawmotive/textgraph/node';
import { createTextGraphRuntimeLoader as createWorkerLoader, platform as workerPlatform } from '@drawmotive/textgraph/worker';
// @ts-expect-error The Node entry deliberately excludes the browser/worker asset loader.
import { createTextGraphRuntimeLoader as createNodeLoader } from '@drawmotive/textgraph/node';

const options: TextGraphInitializeOptions = {
  loadRuntime: async () => ({ abiVersion: '1.0.0' }),
};

const instance: Promise<TextGraphInstance> = initializeTextGraph(options);
const manifest: TextGraphRuntimeManifest = {
  packageName: '@drawmotive/textgraph',
  packageVersion: '0.0.0-development',
  abiVersion: '1.0.0',
};

void instance;
void manifest;
const browser: 'browser' = browserPlatform;
const node: 'node' = nodePlatform;
const worker: 'worker' = workerPlatform;
void createTextGraphRuntimeLoader;
void createWorkerLoader;
void createNodeLoader;
void browser;
void node;
void worker;
