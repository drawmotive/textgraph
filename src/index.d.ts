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

export interface TextGraphInitializeOptions {
  loadRuntime(options: TextGraphInitializeOptions): Promise<TextGraphRuntime>;
  signal?: AbortSignal;
}

export declare const abiManifest: Readonly<TextGraphRuntimeManifest>;

export declare class DrawMotiveError extends Error {
  readonly code: string;
  readonly details: Readonly<Record<string, unknown>>;
}

export declare function initializeTextGraph(
  options: TextGraphInitializeOptions,
): Promise<TextGraphInstance>;
