export interface TextGraphRuntimeManifest {
  readonly packageName: '@drawmotive/textgraph';
  readonly packageVersion: string;
  readonly abiVersion: string;
}

export interface RuntimeAsset {
  readonly path: string;
  readonly mediaType?: string;
}

export interface RuntimeAssetManifest {
  readonly assets: readonly RuntimeAsset[];
}

export interface ResolvedRuntimeAsset {
  readonly asset: RuntimeAsset;
  readonly url: URL;
}

export interface TextGraphInstance {
  readonly state: 'ready' | 'disposing' | 'disposed';
  readonly<T>(operation: () => T | Promise<T>): Promise<T>;
  mutate<T>(operation: () => T | Promise<T>): Promise<T>;
  dispose(): Promise<void>;
}

export interface TextGraphRuntime {
  readonly abiVersion: string;
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
  loadRuntime(options: TextGraphInitializeOptions): Promise<TextGraphRuntime>;
  signal?: AbortSignal;
  adapters?: TextGraphAdapters;
}

export declare const abiManifest: Readonly<TextGraphRuntimeManifest>;

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
  options: TextGraphInitializeOptions,
): Promise<TextGraphInstance>;
