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
  const runtime = await waitForInitialResource(() => options.loadRuntime(options), options.signal);
  await validateAbi(runtime, abiManifest.abiVersion);
  return createManagedInstance([runtime]);
}
import { createManagedInstance, validateAbi, waitForInitialResource } from './runtime/lifecycle.js';

export { DrawMotiveError } from './runtime/errors.js';
