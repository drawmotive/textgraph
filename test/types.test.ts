import {
  initializeTextGraph,
  type TextGraphInstance,
  type TextGraphInitializeOptions,
  type TextGraphRuntimeManifest,
} from '../src/index.js';

const options: TextGraphInitializeOptions = {
  loadRuntime: async (): Promise<TextGraphInstance> => ({
    readonly: async (operation) => operation(),
    mutate: async (operation) => operation(),
    dispose: async () => undefined,
  }),
};

const instance: Promise<TextGraphInstance> = initializeTextGraph(options);
const manifest: TextGraphRuntimeManifest = {
  packageName: '@drawmotive/textgraph',
  packageVersion: '0.0.0-development',
  abiVersion: '1.0.0',
};

void instance;
void manifest;
