import { DrawMotiveError } from './errors.js';
import { decodeDiagnostics, validateSignal } from './validation.js';

const stages = ['parse', 'semantic', 'layout', 'render', 'font'];

/** Normalize export settings before queuing; native receives only the render contract. */
export function normalizeRenderOptions(source, options) {
  const invalid = message => { throw new DrawMotiveError('INVALID_ARGUMENT', message); };
  if (typeof source !== 'string' || !options || typeof options !== 'object' || Array.isArray(options)) invalid('Rendering requires a source string and options object');
  const { encoding = 'bytes', scale = 2, padding = 10, maxWidth, signal } = options;
  if (!['bytes', 'base64'].includes(encoding)) invalid('encoding must be bytes or base64');
  // The native geometry contract uses float32; reject values lost at that boundary.
  if (!Number.isFinite(scale) || !Number.isFinite(Math.fround(scale)) || Math.fround(scale) <= 0) invalid('scale must be positive and representable as a finite float32');
  if (!Number.isFinite(padding) || !Number.isFinite(Math.fround(padding)) || padding < 0) invalid('padding must be non-negative and representable as a finite float32');
  if (maxWidth !== undefined && (!Number.isSafeInteger(maxWidth) || maxWidth <= 0)) invalid('maxWidth must be a positive integer');
  validateSignal(signal);
  return { encoding, signal, request: { protocolVersion: 1, operation: 'render', source, export: { format: 'png', scale, padding, ...(maxWidth === undefined ? {} : { maxWidth }) } } };
}

/** Accept canonical base64 only; platform atob implementations otherwise tolerate corruption. */
function decodeBase64(value) {
  if (typeof value !== 'string' || !value || value.length % 4 !== 0
      || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw new Error('Invalid base64');
  const binary = atob(value);
  if (btoa(binary) !== value) throw new Error('Non-canonical base64');
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

/** Validate the native image boundary before publishing caller-selected PNG data. */
export function decodeRender(json, encoding) {
  try {
    const value = JSON.parse(json);
    if (value?.protocolVersion !== 1 || typeof value.success !== 'boolean') throw new Error('Invalid envelope');
    const diagnostics = decodeDiagnostics(value.diagnostics, stages);
    if (value.success === diagnostics.some(item => item.severity === 'error')) throw new Error('Inconsistent success');
    if (!value.success) {
      if (['png', 'width', 'height'].some(key => Object.hasOwn(value, key))) throw new Error('Failure contains image data');
      return Object.freeze({ success: false, diagnostics });
    }
    if (![value.width, value.height].every(n => Number.isSafeInteger(n) && n > 0 && n <= 0x7fffffff)) throw new Error('Invalid dimensions');
    const bytes = decodeBase64(value.png);
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (bytes.length < 33 || !signature.every((byte, index) => bytes[index] === byte)) throw new Error('Invalid PNG signature');
    const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (header.getUint32(8) !== 13 || header.getUint32(12) !== 0x49484452
        || header.getUint32(16) !== value.width || header.getUint32(20) !== value.height) throw new Error('PNG dimensions disagree');
    return Object.freeze({ success: true, png: encoding === 'base64' ? value.png : bytes, width: value.width, height: value.height, diagnostics });
  } catch (cause) {
    throw new DrawMotiveError('INVALID_RESPONSE', 'The rendering response violates protocol 1', { cause });
  }
}

/** Resource setup and disposal failures are operational, separate from diagram diagnostics. */
export function decodeConfiguration(json, operation = 'configuration') {
  let value;
  let diagnostics;
  try {
    value = JSON.parse(json);
    if (value?.protocolVersion !== 1 || typeof value.success !== 'boolean') throw new Error('Invalid envelope');
    diagnostics = decodeDiagnostics(value.diagnostics, stages);
    if (value.success === diagnostics.some(item => item.severity === 'error')) throw new Error('Inconsistent success');
  } catch (cause) {
    throw new DrawMotiveError('INVALID_RESPONSE', `The ${operation} response violates protocol 1`, { cause });
  }
  if (!value.success) throw new DrawMotiveError('RUNTIME_FAILED', `Rendering resource ${operation} failed`, { details: { diagnostics } });
}
