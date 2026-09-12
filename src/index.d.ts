export interface TextGraphRuntimeManifest {
  readonly packageName: '@drawmotive/textgraph';
  readonly packageVersion: string;
  readonly abiVersion: string;
}

export interface TextGraphAbiManifest extends TextGraphRuntimeManifest {
  readonly schemaVersion: 1;
  readonly protocolVersion: 1;
  readonly targetFramework: 'net10.0';
  readonly privateSource: { readonly commit: string; readonly project: string };
  readonly entryAssembly: string;
  readonly runtimeWasm: string;
  readonly runtimeConfig: string;
  readonly runtimeModule: string;
  readonly bridge: { readonly assembly: string; readonly type: string; readonly info: string; readonly validate: string };
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
  readonly<T>(operation: () => T | Promise<T>): Promise<T>;
  mutate<T>(operation: () => T | Promise<T>): Promise<T>;
  dispose(): Promise<void>;
}

export interface TextGraphRuntime {
  readonly abiVersion: string;
  readonly capabilities?: readonly string[];
  validate?(source: string): string | Promise<string>;
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
}

export interface TextGraphRuntimeInfo extends TextGraphRuntimeManifest {
  readonly protocolVersion: 1;
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
