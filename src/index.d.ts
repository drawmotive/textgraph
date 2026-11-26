export interface TextGraphRuntimeManifest {
  readonly packageName: '@drawmotive/textgraph';
  readonly packageVersion: string;
  readonly abiVersion: string;
}

export interface TextGraphAbiManifest extends TextGraphRuntimeManifest {
  readonly schemaVersion: 1;
  readonly protocolVersion: 2;
  readonly targetFramework: 'net10.0' | 'net11.0';
  readonly privateSource: { readonly commit: string; readonly project: string };
  readonly entryAssembly: string;
  readonly runtimeWasm: string;
  readonly runtimeConfig: string;
  readonly runtimeModule: string;
  readonly bridge: { readonly assembly: string; readonly type: string; readonly info: string; readonly validate: string; readonly execute?: string };
  readonly rendering?: {
    readonly theme: string;
    readonly fonts: readonly { readonly family: string; readonly asset: string }[];
  };
  readonly capabilities: readonly string[];
  readonly assets: readonly Required<RuntimeAsset>[];
}

export interface RuntimeAsset {
  readonly path: string;
  readonly mediaType?: string;
  readonly bytes?: number;
  readonly sha256?: string;
}

export interface RuntimeAssetManifest {
  readonly assets: readonly RuntimeAsset[];
}

export interface ResolvedRuntimeAsset {
  readonly asset: RuntimeAsset;
  readonly url: URL;
}

export interface LoadedRuntimeAsset extends Omit<RuntimeAsset, 'bytes'> {
  readonly url: URL;
  readonly bytes: Uint8Array;
}

export interface RuntimeAssetLoader {
  readonly plan: readonly ResolvedRuntimeAsset[];
  loadAssets(): Promise<ReadonlyMap<string, LoadedRuntimeAsset>>;
}

export interface TextGraphInstance {
  readonly state: 'ready' | 'disposing' | 'disposed';
  readonly info: TextGraphRuntimeInfo;
  validate(source: string, options?: { signal?: AbortSignal }): Promise<TextGraphValidationResult>;
  renderPng(source: string, options?: TextGraphRenderPngOptions): Promise<TextGraphRenderPngResult>;
  renderSvg(source: string, options?: TextGraphRenderSvgOptions): Promise<TextGraphRenderSvgResult>;
  readonly<T>(operation: () => T | Promise<T>): Promise<T>;
  mutate<T>(operation: () => T | Promise<T>): Promise<T>;
  dispose(): Promise<void>;
}

export interface TextGraphRuntime {
  readonly abiVersion: string;
  readonly capabilities?: readonly string[];
  validate?(source: string): string | Promise<string>;
  execute?(requestJson: string, context?: { signal?: AbortSignal; onPreview?(response: TextGraphNativeResponse): void }): TextGraphNativeResponse | Promise<TextGraphNativeResponse>;
}

/** One protocol 2 native call: the JSON envelope plus the image payload delivered beside it. */
export interface TextGraphNativeResponse {
  readonly json: string;
  /** Encoded PNG owned by the receiver; present only for a successful PNG render. */
  readonly png?: Uint8Array;
  /** SVG document; present only for a successful SVG render. */
  readonly svg?: string;
  dispose?(): void | Promise<void>;
}

export interface AdapterContext {
  readonly signal?: AbortSignal;
}

export interface FileAdapter {
  open(path: string, context: AdapterContext): Promise<Uint8Array>;
  save(path: string, data: Uint8Array, context: AdapterContext): Promise<void>;
}

export interface NetworkAdapter {
  fetch(input: RequestInfo | URL, init: RequestInit & AdapterContext): Promise<Response>;
}

export interface TextGraphAdapters {
  readonly files?: FileAdapter;
  readonly network?: NetworkAdapter;
}

export interface TextGraphInitializeOptions {
  /** Development hook. Default platform loading requires no custom runtime. */
  loadRuntime?(options: TextGraphInitializeOptions): Promise<TextGraphRuntime>;
  signal?: AbortSignal;
  adapters?: TextGraphAdapters;
  resolveAsset?(asset: RuntimeAsset, defaultUrl: URL): string | URL;
  fetch?: typeof globalThis.fetch;
  /** Legacy descriptors load on first render; descriptors with coverage load on demand. */
  languagePacks?: readonly TextGraphLanguagePack[];
  /** Select the theme and font distribution or control the default catalog fallback. */
  fontAssets?: TextGraphFontAssets;
}

export interface TextGraphFontAssets {
  /** Catalog URL; files resolve relative to this URL. A configured catalog is authoritative. */
  readonly catalog?: URL;
  /** Version 2 files.json with adjacent themes.css and split fonts. Exclusive with catalogs and language packs. */
  readonly inventory?: URL;
  /** Disable external fallback for offline hosts, or select another remote catalog. */
  readonly fallback?: false | URL;
}

export interface TextGraphFont {
  readonly family: string;
  /** Use a URL (including file: in Node) or bytes; bytes are copied during initialization. */
  readonly source: URL | Uint8Array;
  /** Sorted, disjoint inclusive Unicode ranges. Supply all metadata fields together for lazy loading. */
  readonly coverage?: readonly (readonly [number, number])[];
  readonly languages?: readonly string[];
  readonly bytes?: number;
  readonly sha256?: string;
}

export interface TextGraphLanguagePack {
  readonly fonts: readonly TextGraphFont[];
  /** Ordered fallback families supplied by this initialization, after explicit diagram fonts. */
  readonly fallbackFamilies?: readonly string[];
}

export interface TextGraphRenderPngOptions {
  /** Use the native dark theme. Defaults to false; true requires textgraph-render-dark-v1. */
  dark?: boolean;
  /** Receives a provisional image before optional fonts load; the promise returns the final image. */
  onPreview?(result: Extract<TextGraphRenderPngResult, { success: true }>): void;
  /** Optional language hint for ambiguous Han text, e.g. ja or zh-CN. */
  language?: string;
  /** Positive raster density relative to logical diagram size. Defaults to 1. */
  scale?: number;
  /** Non-negative padding in diagram units. Defaults to 10. */
  padding?: number;
  /** Positive integer upper bound on output width in pixels. */
  maxWidth?: number;
  /** Cancellation cannot preempt native work already running on this thread. */
  signal?: AbortSignal;
}

export type TextGraphRenderPngResult =
  | { readonly success: true; readonly png: Uint8Array; readonly width: number; readonly height: number;
      /** Logical display dimensions before density scaling; omitted by older runtimes. */
      readonly displayWidth?: number; readonly displayHeight?: number; readonly diagnostics: readonly TextGraphRenderDiagnostic[] }
  | { readonly success: false; readonly diagnostics: readonly TextGraphRenderDiagnostic[] };

/** Vector export uses logical diagram units and requires textgraph-render-svg-v1. */
export interface TextGraphRenderSvgOptions {
  /** Use the native dark theme. Defaults to false; true requires textgraph-render-dark-v1. */
  dark?: boolean;
  /** Receives a provisional vector before optional fonts load; the promise returns the final vector. */
  onPreview?(result: Extract<TextGraphRenderSvgResult, { success: true }>): void;
  /** Optional language hint for ambiguous Han text, e.g. ja or zh-CN. */
  language?: string;
  /** Non-negative padding in diagram units. Defaults to 10. */
  padding?: number;
  /** Cancellation cannot preempt native work already running on this thread. */
  signal?: AbortSignal;
}

export type TextGraphRenderSvgResult =
  | { readonly success: true; readonly svg: string; readonly displayWidth: number; readonly displayHeight: number; readonly diagnostics: readonly TextGraphRenderDiagnostic[] }
  | { readonly success: false; readonly diagnostics: readonly TextGraphRenderDiagnostic[] };

export interface TextGraphRuntimeInfo extends TextGraphRuntimeManifest {
  readonly protocolVersion: 2;
  readonly capabilities: readonly string[];
}

export interface TextGraphDiagnostic {
  readonly code: string;
  readonly severity: 'error' | 'warning';
  readonly stage: 'parse' | 'semantic';
  readonly message: string;
  /** Zero-based line and UTF-16 column; no fabricated end range. */
  readonly location?: { readonly line: number; readonly column: number };
}

export interface TextGraphValidationResult {
  readonly valid: boolean;
  readonly diagnostics: readonly TextGraphDiagnostic[];
}

export interface TextGraphRenderDiagnostic extends Omit<TextGraphDiagnostic, 'stage'> {
  readonly stage: 'parse' | 'semantic' | 'layout' | 'render' | 'font';
}

export declare const abiManifest: Readonly<TextGraphAbiManifest>;

export declare class DrawMotiveError extends Error {
  readonly code: string;
  readonly details: Readonly<Record<string, unknown>>;
}

export declare function validateTextGraphAdapters(adapters?: TextGraphAdapters): Readonly<TextGraphAdapters>;

export declare function resolveRuntimeAssets(options: {
  manifest: RuntimeAssetManifest;
  moduleUrl?: string | URL;
  resolveAsset?(asset: RuntimeAsset, defaultUrl: URL): string | URL;
}): readonly ResolvedRuntimeAsset[];

export declare function initializeTextGraph(
  options?: TextGraphInitializeOptions,
): Promise<TextGraphInstance>;
