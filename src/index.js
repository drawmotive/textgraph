import { validateTextGraphAdapters } from './adapters.js';
import { createManagedInstance, throwIfAborted, validateAbi, waitForInitialResource } from './runtime/lifecycle.js';
import { decodeValidation, validateSignal } from './runtime/validation.js';
import { DrawMotiveError } from './runtime/errors.js';
import { normalizeFontAssets, normalizeLanguagePacks } from './runtime/language-packs.js';
import { decodeRender, normalizeRenderOptions } from './runtime/rendering.js';
import manifest from '../generated/wasm-manifest.js';

export { validateTextGraphAdapters } from './adapters.js';
export { DrawMotiveError } from './runtime/errors.js';
export { resolveRuntimeAssets } from './runtime/assets.js';

const freeze = value => {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
};
export const abiManifest = freeze(structuredClone(manifest));

/** Initializes one headless TextGraph instance through the selected platform loader. */
export async function initializeTextGraph(options = {}) {
  if (!options || typeof options !== 'object') throw new DrawMotiveError('INVALID_ARGUMENT', 'Initialization options must be an object');
  for (const key of ['resolveAsset', 'fetch', 'loadRuntime']) {
    if (options[key] !== undefined && typeof options[key] !== 'function') throw new DrawMotiveError('INVALID_ARGUMENT', `${key} must be a function`);
  }
  validateSignal(options.signal);
  if (typeof options.loadRuntime !== 'function') {
    throw new TypeError('initializeTextGraph requires a loadRuntime function');
  }
  const normalized = Object.freeze({ ...options, adapters: validateTextGraphAdapters(options.adapters), languagePacks: normalizeLanguagePacks(options.languagePacks), fontAssets: normalizeFontAssets(options.fontAssets) });
  const runtime = await waitForInitialResource(() => options.loadRuntime(normalized), options.signal);
  await validateAbi(runtime, abiManifest.abiVersion);
  const instance = createManagedInstance([runtime]);
  const capabilities = runtime.capabilities ?? [
    ...(typeof runtime.validate === 'function' ? ['textgraph-validate-v1'] : []),
    ...(typeof runtime.execute === 'function' ? ['textgraph-render-v1'] : []),
  ];
  const info = Object.freeze({ packageName: abiManifest.packageName, packageVersion: abiManifest.packageVersion, abiVersion: runtime.abiVersion, protocolVersion: 1, capabilities: Object.freeze([...capabilities]) });
  return Object.assign(instance, {
    info,
    async renderPng(source, callOptions = {}) {
      if (instance.state !== 'ready') throw new DrawMotiveError('INSTANCE_DISPOSED', 'The runtime instance is disposing or disposed');
      const { request, encoding, signal } = normalizeRenderOptions(source, callOptions);
      throwIfAborted(signal);
      if (typeof runtime.execute !== 'function' || !capabilities.includes('textgraph-render-v1')) throw new DrawMotiveError('UNSUPPORTED_CAPABILITY', 'Runtime does not support PNG rendering');
      return instance.mutate(async () => {
        throwIfAborted(signal);
        let response;
        try { response = await runtime.execute(JSON.stringify(request), { signal }); }
        catch (cause) {
          throwIfAborted(signal);
          if (cause instanceof DrawMotiveError || cause?.name === 'AbortError') throw cause;
          throw new DrawMotiveError('RUNTIME_FAILED', 'PNG rendering could not execute', { cause });
        }
        throwIfAborted(signal);
        return decodeRender(response, encoding);
      });
    },
    async validate(source, callOptions = {}) {
      if (instance.state !== 'ready') throw new DrawMotiveError('INSTANCE_DISPOSED', 'The runtime instance is disposing or disposed');
      if (typeof source !== 'string' || !callOptions || typeof callOptions !== 'object') throw new DrawMotiveError('INVALID_ARGUMENT', 'Validation requires a source string and options object');
      validateSignal(callOptions.signal);
      throwIfAborted(callOptions.signal);
      if (typeof runtime.validate !== 'function') throw new DrawMotiveError('UNSUPPORTED_CAPABILITY', 'Runtime does not support validation');
      return instance.mutate(async () => {
        throwIfAborted(callOptions.signal);
        let response;
        try { response = await runtime.validate(source); }
        catch (cause) {
          throwIfAborted(callOptions.signal);
          if (cause?.name === 'AbortError') throw cause;
          throw new DrawMotiveError('RUNTIME_FAILED', 'Validation could not execute', { cause });
        }
        throwIfAborted(callOptions.signal);
        return decodeValidation(response);
      });
    },
  });
}
