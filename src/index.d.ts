export interface TextGraphRuntimeManifest {
  readonly packageName: '@drawmotive/textgraph';
  readonly packageVersion: string;
  readonly abiVersion: string;
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

export declare function initializeTextGraph(
  options: TextGraphInitializeOptions,
): Promise<TextGraphInstance>;
