import { validateTextGraphAdapters } from './adapters.js';
import { createManagedInstance, validateAbi, waitForInitialResource } from './runtime/lifecycle.js';

export { validateTextGraphAdapters } from './adapters.js';
export { DrawMotiveError } from './runtime/errors.js';
export { resolveRuntimeAssets } from './runtime/assets.js';

export const abiManifest = Object.freeze({
  packageName: '@drawmotive/textgraph',
  packageVersion: '0.0.0-development',
  abiVersion: '1.0.0',
});

/** Initializes one headless TextGraph instance through the selected platform loader. */
export async function initializeTextGraph(options = {}) {
  if (typeof options.loadRuntime !== 'function') {
    throw new TypeError('initializeTextGraph requires a loadRuntime function');
  }
  const normalized = Object.freeze({ ...options, adapters: validateTextGraphAdapters(options.adapters) });
  const runtime = await waitForInitialResource(() => options.loadRuntime(normalized), options.signal);
  await validateAbi(runtime, abiManifest.abiVersion);
  return createManagedInstance([runtime]);
}
