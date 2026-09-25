import {
  initializeTextGraph,
  type TextGraphInstance,
  type TextGraphInitializeOptions,
  type TextGraphRuntimeManifest,
  type TextGraphLanguagePack,
  type TextGraphPngEncoding,
  type TextGraphRenderPngOptions,
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

async function stableApi() {
  const runtime = await initializeTextGraph();
  const result = await runtime.validate('A -> B', { signal: new AbortController().signal });
  for (const diagnostic of result.diagnostics) { const stage: 'parse' | 'semantic' = diagnostic.stage; void stage; }
  const valid: boolean = result.valid;
  const capabilities: readonly string[] = runtime.info.capabilities;
  // @ts-expect-error Source must be a string.
  await runtime.validate(42);
  // @ts-expect-error Diagnostics are readonly.
  result.diagnostics.push({});
  void valid; void capabilities;
  await runtime.dispose();
}
void stableApi;

async function renderingApi(encoding: TextGraphPngEncoding, options: TextGraphRenderPngOptions) {
  const languagePack: TextGraphLanguagePack = { fonts: [{ family: 'Chinese', source: new URL('https://example.test/font.ttf') }], fallbackFamilies: ['Chinese'] };
  const runtime = await initializeTextGraph({ languagePacks: [languagePack], fontAssets: { fallback: false } });
  await runtime.renderPng('A: 日本語', { language: 'ja' });
  const bytes = await runtime.renderPng('A -> B');
  if (bytes.success) {
    const image: Uint8Array = bytes.png;
    const width: number = bytes.width;
    const displayWidth: number | undefined = bytes.displayWidth;
    const displayHeight: number | undefined = bytes.displayHeight;
    // @ts-expect-error Byte results are not base64 strings.
    const base64: string = bytes.png;
    void image; void width; void displayWidth; void displayHeight; void base64;
  } else {
    // @ts-expect-error Failure results do not contain PNG data.
    void bytes.png;
  }
  const highResolution = await runtime.renderPng('A', { scale: 3, padding: 20 });
  if (highResolution.success) { const image: Uint8Array = highResolution.png; void image; }
  const base64 = await runtime.renderPng('A', { encoding: 'base64', maxWidth: 1024 });
  if (base64.success) { const image: string = base64.png; void image; }
  const union = await runtime.renderPng('A', { encoding });
  if (union.success) {
    const image: string | Uint8Array = union.png;
    // @ts-expect-error A variable encoding cannot guarantee bytes.
    const onlyBytes: Uint8Array = union.png;
    void image; void onlyBytes;
  }
  const optionalUnion = await runtime.renderPng('A', options);
  if (optionalUnion.success) {
    const image: string | Uint8Array = optionalUnion.png;
    // @ts-expect-error Broad options cannot guarantee bytes.
    const onlyBytes: Uint8Array = optionalUnion.png;
    void image; void onlyBytes;
  }
  // @ts-expect-error Encoding must be bytes or base64.
  await runtime.renderPng('A', { encoding: 'data-url' });
  // @ts-expect-error Font paths must use URL objects rather than ambiguous strings.
  await initializeTextGraph({ languagePacks: [{ fonts: [{ family: 'A', source: './font.ttf' }] }] });
  await runtime.dispose();
}
void renderingApi;
