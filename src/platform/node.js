export * from '../index.js';
import { initializeTextGraph as initialize } from '../index.js';
import { loadNodeRuntime } from '../runtime/node.js';
import manifest from '../../generated/wasm-manifest.js';
import { DrawMotiveError } from '../runtime/errors.js';

export async function initializeTextGraph(options = {}) {
  if (!options || typeof options !== 'object') throw new DrawMotiveError('INVALID_ARGUMENT', 'Initialization options must be an object');
  // The workspace development command opts in explicitly; imports and browser
  // loaders never consult a local build directory or replace packaged assets.
  const directory = process.env.DRAWMOTIVE_TEXTGRAPH_RUNTIME;
  return initialize({ ...options, loadRuntime: options.loadRuntime ?? (context => loadNodeRuntime(context, manifest, directory)) });
}

export const platform = 'node';
