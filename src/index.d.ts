export interface TextGraphRuntimeManifest {
  readonly packageName: '@drawmotive/textgraph';
  readonly packageVersion: string;
  readonly abiVersion: string;
}

export interface TextGraphInstance {
  readonly<T>(operation: () => T | Promise<T>): Promise<T>;
  mutate<T>(operation: () => T | Promise<T>): Promise<T>;
  dispose(): Promise<void>;
}

export interface TextGraphInitializeOptions {
  loadRuntime(options: TextGraphInitializeOptions): Promise<TextGraphInstance>;
  signal?: AbortSignal;
}

export declare const abiManifest: Readonly<TextGraphRuntimeManifest>;

export declare function initializeTextGraph(
  options: TextGraphInitializeOptions,
): Promise<TextGraphInstance>;
