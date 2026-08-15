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
  return options.loadRuntime(options);
}
