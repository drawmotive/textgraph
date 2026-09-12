export * from '../index.js';
import { initializeTextGraph as initialize } from '../index.js';
import { loadNodeRuntime } from '../runtime/node.js';
import manifest from '../../generated/wasm-manifest.js';
import { DrawMotiveError } from '../runtime/errors.js';

export async function initializeTextGraph(options = {}) {
  if (!options || typeof options !== 'object') throw new DrawMotiveError('INVALID_ARGUMENT', 'Initialization options must be an object');
  return initialize({ ...options, loadRuntime: options.loadRuntime ?? (context => loadNodeRuntime(context, manifest)) });
}

export const platform = 'node';
