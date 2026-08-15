import { DrawMotiveError } from './runtime/errors.js';

const contracts = Object.freeze({ files: ['open', 'save'], network: ['fetch'] });

/** Validates TextGraph host adapters and captures an immutable method snapshot. */
export function validateTextGraphAdapters(adapters = {}) {
  if (adapters === null || typeof adapters !== 'object') invalid('adapters');
  const snapshot = {};
  for (const [name, methods] of Object.entries(contracts)) {
    const adapter = adapters[name];
    if (adapter === undefined) continue;
    if (adapter === null || typeof adapter !== 'object') invalid(name);
    const captured = {};
    for (const method of methods) {
      if (typeof adapter[method] !== 'function') invalid(name, method);
      captured[method] = adapter[method].bind(adapter);
    }
    snapshot[name] = Object.freeze(captured);
  }
  return Object.freeze(snapshot);
}

function invalid(adapter, method) {
  throw new DrawMotiveError('INVALID_ADAPTER', `Adapter ${adapter}${method ? `.${method}` : ''} does not satisfy its contract`, {
    details: { adapter, method: method ?? null },
  });
}
