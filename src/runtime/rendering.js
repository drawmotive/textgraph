import { DrawMotiveError } from './errors.js';
import { decodeDiagnostics, validateSignal } from './validation.js';
import { protocolVersion } from './manifest.js';

const stages = ['parse', 'semantic', 'layout', 'render', 'font'];
const invalid = message => { throw new DrawMotiveError('INVALID_ARGUMENT', message); };

/** Both formats share native theme selection, logical padding, language and cancellation. */
function normalizeCommonOptions(source, options) {
  if (typeof source !== 'string' || !options || typeof options !== 'object' || Array.isArray(options)) invalid('Rendering requires a source string and options object');
  const { padding = 10, dark, signal, language, onPreview } = options;
  if (dark !== undefined && typeof dark !== 'boolean') invalid('dark must be a boolean');
  if (onPreview !== undefined && typeof onPreview !== 'function') invalid('onPreview must be a function');
  if (language !== undefined && (typeof language !== 'string' || !/^[a-z]{2,8}(?:-[A-Za-z0-9]+)*$/.test(language))) invalid('language must be a language tag');
  // The native geometry contract uses float32; reject values lost at that boundary.
  if (!Number.isFinite(padding) || !Number.isFinite(Math.fround(padding)) || padding < 0) invalid('padding must be non-negative and representable as a finite float32');
  validateSignal(signal);
  return { exportOptions: { padding, ...(dark === undefined ? {} : { dark }) }, signal, onPreview,
    request: { protocolVersion, operation: 'render', source, ...(language === undefined ? {} : { language }) } };
}

/** Normalize export settings before queuing; native receives only the render contract. */
export function normalizeRenderOptions(source, options) {
  const { exportOptions, signal, onPreview, request } = normalizeCommonOptions(source, options);
  const { scale = 1, maxWidth } = options;
  // PNG bytes leave WASM memory once; a text encoding would only add copies the caller can make itself.
  if (Object.hasOwn(options, 'encoding')) invalid('encoding is not supported; png is always a Uint8Array');
  // The native geometry contract uses float32; reject values lost at that boundary.
  if (!Number.isFinite(scale) || !Number.isFinite(Math.fround(scale)) || Math.fround(scale) <= 0) invalid('scale must be positive and representable as a finite float32');
  if (maxWidth !== undefined && (!Number.isSafeInteger(maxWidth) || maxWidth <= 0)) invalid('maxWidth must be a positive integer');
  return { signal, onPreview, request: { ...request, export: { format: 'png', scale, ...exportOptions, ...(maxWidth === undefined ? {} : { maxWidth }) } } };
}

/** SVG accepts only logical export settings; PNG density has no vector meaning. */
export function normalizeSvgOptions(source, options) {
  const { exportOptions, signal, onPreview, request } = normalizeCommonOptions(source, options);
  if (Reflect.ownKeys(options).some(key => !['padding', 'dark', 'language', 'signal', 'onPreview'].includes(key))) invalid('Unknown SVG rendering option');
  return { signal, onPreview, request: { ...request, export: { format: 'svg', ...exportOptions } } };
}

/**
 * Opens a native response `{ json, png?, svg? }`. Protocol 2 keeps image payloads beside the JSON
 * envelope, so the envelope itself must never carry them, and only a successful render may.
 */
function openResponse(response, payload) {
  if (!response || typeof response !== 'object' || typeof response.json !== 'string') throw new Error('Invalid native response');
  const value = JSON.parse(response.json);
  if (value?.protocolVersion !== protocolVersion || typeof value.success !== 'boolean') throw new Error('Invalid envelope');
  if (['png', 'svg'].some(key => Object.hasOwn(value, key))) throw new Error('Envelope contains an image payload');
  for (const key of ['png', 'svg']) if (key !== payload && response[key] !== undefined) throw new Error(`Unexpected ${key} payload`);
  const diagnostics = decodeDiagnostics(value.diagnostics, stages);
  if (value.success === diagnostics.some(item => item.severity === 'error')) throw new Error('Inconsistent success');
  if (!value.success && response[payload] !== undefined) throw new Error('Failure contains image data');
  return { value, diagnostics };
}

/** Validate the native image boundary before publishing PNG data. */
export function decodeRender(response) {
  try {
    const { value, diagnostics } = openResponse(response, 'png');
    if (!value.success) {
      if (['width', 'height', 'displayWidth', 'displayHeight'].some(key => Object.hasOwn(value, key))) throw new Error('Failure contains image data');
      return Object.freeze({ success: false, diagnostics });
    }
    if (![value.width, value.height].every(n => Number.isSafeInteger(n) && n > 0 && n <= 0x7fffffff)) throw new Error('Invalid dimensions');
    // Only the native exporter knows the effective density after maxWidth clamps
    // the raster. Older runtimes may omit this additive pair entirely.
    const displayDimensions = {};
    if (Object.hasOwn(value, 'displayWidth') || Object.hasOwn(value, 'displayHeight')) {
      if (![value.displayWidth, value.displayHeight].every(n => Number.isFinite(n) && n > 0)) throw new Error('Invalid display dimensions');
      displayDimensions.displayWidth = value.displayWidth;
      displayDimensions.displayHeight = value.displayHeight;
    }
    const bytes = response.png;
    if (!(bytes instanceof Uint8Array)) throw new Error('Missing PNG payload');
    const signature = [137, 80, 78, 71, 13, 10, 26, 10];
    if (bytes.length < 33 || !signature.every((byte, index) => bytes[index] === byte)) throw new Error('Invalid PNG signature');
    const header = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    if (header.getUint32(8) !== 13 || header.getUint32(12) !== 0x49484452
        || header.getUint32(16) !== value.width || header.getUint32(20) !== value.height) throw new Error('PNG dimensions disagree');
    // The host already copied these bytes out of WASM memory for this call alone; publish them as-is.
    return Object.freeze({ success: true, png: bytes, width: value.width, height: value.height, ...displayDimensions, diagnostics });
  } catch (cause) {
    throw new DrawMotiveError('INVALID_RESPONSE', `The rendering response violates protocol ${protocolVersion}`, { cause });
  }
}

/** Check the vector document boundary without requiring a DOM or loading external XML resources. */
export function decodeSvgRender(response) {
  try {
    const { value, diagnostics } = openResponse(response, 'svg');
    if (!value.success) {
      if (['displayWidth', 'displayHeight', 'width', 'height'].some(key => Object.hasOwn(value, key))) throw new Error('Failure contains image data');
      return Object.freeze({ success: false, diagnostics });
    }
    if (![value.displayWidth, value.displayHeight].every(n => Number.isFinite(n) && n > 0)) throw new Error('Invalid display dimensions');
    // This is an envelope check, not a general XML parser: the trusted native
    // exporter owns element syntax. Require its SVG root, namespace and complete document.
    const svg = response.svg;
    if (Object.hasOwn(value, 'width') || Object.hasOwn(value, 'height')) throw new Error('SVG response contains raster dimensions');
    const document = typeof svg === 'string' && /^(?:<\?xml\b[^?]*\?>\s*)?<svg(?=\s|\/?>)([^>]*?)(?:\/>|>[\s\S]*<\/svg\s*>)$/.exec(svg.trim());
    if (!document) throw new Error('Invalid SVG document');
    // Consume complete attribute values so namespace-like text inside another
    // quoted attribute cannot impersonate the root namespace.
    const attributes = [...document[1].matchAll(/(?:^|\s)([A-Za-z_:][A-Za-z0-9_.:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)];
    const namespaces = attributes.filter(attribute => attribute[1] === 'xmlns');
    if (namespaces.length !== 1 || (namespaces[0][2] ?? namespaces[0][3]) !== 'http://www.w3.org/2000/svg') throw new Error('Invalid SVG namespace');
    return Object.freeze({ success: true, svg, displayWidth: value.displayWidth, displayHeight: value.displayHeight, diagnostics });
  } catch (cause) {
    throw new DrawMotiveError('INVALID_RESPONSE', `The SVG rendering response violates protocol ${protocolVersion}`, { cause });
  }
}

/** Resource setup and disposal failures are operational, separate from diagram diagnostics. */
export function decodeConfiguration(json, operation = 'configuration') {
  let value;
  let diagnostics;
  try {
    value = JSON.parse(json);
    if (value?.protocolVersion !== protocolVersion || typeof value.success !== 'boolean') throw new Error('Invalid envelope');
    diagnostics = decodeDiagnostics(value.diagnostics, stages);
    if (value.success === diagnostics.some(item => item.severity === 'error')) throw new Error('Inconsistent success');
  } catch (cause) {
    throw new DrawMotiveError('INVALID_RESPONSE', `The ${operation} response violates protocol ${protocolVersion}`, { cause });
  }
  if (!value.success) throw new DrawMotiveError('RUNTIME_FAILED', `Rendering resource ${operation} failed`, { details: { diagnostics } });
}
