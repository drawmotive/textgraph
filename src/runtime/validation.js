import { DrawMotiveError } from './errors.js';

/** Validates the wire boundary before publishing detached public diagnostic data. */
export function decodeValidation(json) {
  try {
    const value = JSON.parse(json);
    if (value?.protocolVersion !== 1 || typeof value.valid !== 'boolean' || !Array.isArray(value.diagnostics)) throw new Error('Invalid envelope');
    const diagnostics = value.diagnostics.map(item => {
      if (!item || !['parse', 'semantic'].includes(item.stage) || !['error', 'warning'].includes(item.severity)
          || typeof item.code !== 'string' || !item.code || typeof item.message !== 'string') throw new Error('Invalid diagnostic');
      const diagnostic = { code: item.code, severity: item.severity, stage: item.stage, message: item.message };
      if (item.location != null) {
        const { line, column } = item.location;
        if (![line, column].every(n => Number.isSafeInteger(n) && n >= 0)) throw new Error('Invalid location');
        diagnostic.location = Object.freeze({ line, column });
      }
      return Object.freeze(diagnostic);
    });
    if (value.valid === diagnostics.some(item => item.severity === 'error')) throw new Error('Inconsistent validity');
    return Object.freeze({ valid: value.valid, diagnostics: Object.freeze(diagnostics) });
  } catch (cause) {
    throw new DrawMotiveError('INVALID_RESPONSE', 'The validation response violates protocol 1', { cause });
  }
}

/** Signals are host objects; validate their callable contract without realm-sensitive instanceof. */
export function validateSignal(signal) {
  if (signal !== undefined && (!signal || typeof signal.aborted !== 'boolean'
      || typeof signal.addEventListener !== 'function' || typeof signal.removeEventListener !== 'function')) {
    throw new DrawMotiveError('INVALID_ARGUMENT', 'signal must be an AbortSignal');
  }
}
