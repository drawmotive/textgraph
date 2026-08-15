/** Represents a stable public DrawMotive runtime failure. */
export class DrawMotiveError extends Error {
  constructor(code, message, options = {}) {
    super(message, { cause: options.cause });
    this.name = 'DrawMotiveError';
    this.code = code;
    this.details = Object.freeze({ ...(options.details ?? {}) });
  }
}

/** Creates the standard cancellation error used by all package entrypoints. */
export function createAbortError() {
  return new DOMException('The operation was aborted', 'AbortError');
}
