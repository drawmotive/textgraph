import {
  initializeTextGraph,
  type TextGraphInstance,
  type TextGraphInitializeOptions,
  type TextGraphRuntimeManifest,
  type TextGraphLanguagePack,
  type TextGraphNativeResponse,
  type TextGraphRenderPngOptions,
  type TextGraphRenderSvgOptions,
  type TextGraphRenderSvgResult,
} from '../src/index.js';
import { createTextGraphRuntimeLoader, platform as browserPlatform } from '@drawmotive/textgraph/browser';
import { platform as nodePlatform } from '@drawmotive/textgraph/node';
import { createTextGraphRuntimeLoader as createWorkerLoader, platform as workerPlatform } from '@drawmotive/textgraph/worker';
// @ts-expect-error The Node entry deliberately excludes the browser/worker asset loader.
import { createTextGraphRuntimeLoader as createNodeLoader } from '@drawmotive/textgraph/node';

const options: TextGraphInitializeOptions = {
  loadRuntime: async () => ({ abiVersion: '1.0.0' }),
};
// Protocol 2 adapters return the JSON envelope with the image payload beside it.
const nativeResponse: TextGraphNativeResponse = { json: '{}', png: new Uint8Array(0) };
const nativeAdapter: TextGraphInitializeOptions = {
  loadRuntime: async () => ({ abiVersion: '1.0.0', execute: (_request, context) => { context?.onPreview?.(nativeResponse); return nativeResponse; } }),
};
// @ts-expect-error Native adapters no longer return bare JSON strings.
const legacyAdapter: TextGraphInitializeOptions = { loadRuntime: async () => ({ abiVersion: '1.0.0', execute: () => '{}' }) };
void nativeAdapter; void legacyAdapter;

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

async function renderingApi(options: TextGraphRenderPngOptions) {
  const languagePack: TextGraphLanguagePack = { fonts: [{ family: 'Chinese', source: new URL('https://example.test/font.ttf') }], fallbackFamilies: ['Chinese'] };
  const runtime = await initializeTextGraph({ languagePacks: [languagePack], fontAssets: { fallback: false } });
  await runtime.renderPng('A: 日本語', { language: 'ja', dark: true });
  await runtime.renderPng('A', { dark: false });
  // @ts-expect-error Dark rendering requires a boolean.
  await runtime.renderPng('A', { dark: 'true' });
  await runtime.renderPng('A: 中文', { onPreview: preview => { const png: Uint8Array = preview.png; void png; } });
  const bytes = await runtime.renderPng('A -> B');
  if (bytes.success) {
    const image: Uint8Array = bytes.png;
    const width: number = bytes.width;
    const displayWidth: number | undefined = bytes.displayWidth;
    const displayHeight: number | undefined = bytes.displayHeight;
    // @ts-expect-error PNG results are always bytes.
    const base64: string = bytes.png;
    void image; void width; void displayWidth; void displayHeight; void base64;
  } else {
    // @ts-expect-error Failure results do not contain PNG data.
    void bytes.png;
  }
  const highResolution = await runtime.renderPng('A', { scale: 3, padding: 20, maxWidth: 1024 });
  if (highResolution.success) { const image: Uint8Array = highResolution.png; void image; }
  const configured = await runtime.renderPng('A', options);
  if (configured.success) { const image: Uint8Array = configured.png; void image; }
  // @ts-expect-error Protocol 2 removed text encodings of PNG output.
  await runtime.renderPng('A', { encoding: 'base64' });
  // @ts-expect-error Font paths must use URL objects rather than ambiguous strings.
  await initializeTextGraph({ languagePacks: [{ fonts: [{ family: 'A', source: './font.ttf' }] }] });
  await runtime.dispose();
}
void renderingApi;

async function svgRenderingApi(options: TextGraphRenderSvgOptions) {
  const runtime = await initializeTextGraph();
  const result: TextGraphRenderSvgResult = await runtime.renderSvg('A: 日本語', { padding: 0, language: 'ja', dark: true, signal: new AbortController().signal });
  await runtime.renderSvg('A', { dark: false });
  // @ts-expect-error Dark rendering requires a boolean.
  await runtime.renderSvg('A', { dark: 1 });
  await runtime.renderSvg('A -> B', options);
  await runtime.renderSvg('A: 中文', { onPreview: preview => { const svg: string = preview.svg; void svg; } });
  if (result.success) {
    const vector: string = result.svg;
    const width: number = result.displayWidth;
    const height: number = result.displayHeight;
    // @ts-expect-error SVG results carry logical display dimensions rather than raster pixels.
    void result.width;
    // @ts-expect-error SVG results are immutable.
    result.svg = 'other';
    void vector; void width; void height;
  } else {
    // @ts-expect-error SVG failures do not carry image data.
    void result.svg;
    // @ts-expect-error SVG failures do not carry dimensions.
    void result.displayWidth;
  }
  // @ts-expect-error SVG options exclude PNG encoding.
  await runtime.renderSvg('A', { encoding: 'base64' });
  // @ts-expect-error SVG options exclude raster scale.
  await runtime.renderSvg('A', { scale: 2 });
  // @ts-expect-error SVG options exclude raster maxWidth.
  await runtime.renderSvg('A', { maxWidth: 100 });
  // @ts-expect-error SVG options exclude unknown keys.
  await runtime.renderSvg('A', { format: 'svg' });
  // @ts-expect-error Diagnostics are immutable.
  result.diagnostics.push({});
  await runtime.dispose();
}
void svgRenderingApi;
