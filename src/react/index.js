'use client';

import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import { createRuntimeResource } from './runtime.js';

const RuntimeContext = createContext(null);
const defaultOptions = Object.freeze({});

/** Shares a lazy browser runtime across diagrams and owns its eventual disposal. */
export function TextGraphProvider({ options = defaultOptions, children }) {
  const resource = useMemo(() => createRuntimeResource(options), [options]);
  useEffect(() => resource.retain(), [resource]);
  return createElement(RuntimeContext.Provider, { value: resource }, children);
}

/** Renders DSL as an image; only the latest committed input may publish a result. */
export function TextGraph({ source, alt = 'TextGraph diagram', renderOptions = defaultOptions,
  loading = 'Rendering diagram…', ...imageProps }) {
  const shared = useContext(RuntimeContext);
  const resource = useMemo(() => shared ?? createRuntimeResource(defaultOptions), [shared]);
  const { scale, padding, maxWidth } = renderOptions;
  const request = useMemo(() => ({ source, scale, padding, maxWidth, resource }),
    [source, scale, padding, maxWidth, resource]);
  const [state, setState] = useState(null);

  useEffect(() => {
    const release = resource.retain();
    const controller = new AbortController();
    void (async () => {
      try {
        const runtime = await resource.get();
        if (controller.signal.aborted) return;
        const result = await runtime.renderPng(source, { scale, padding, maxWidth, encoding: 'base64', signal: controller.signal });
        if (!controller.signal.aborted) setState({ request, result });
      } catch (error) {
        if (!controller.signal.aborted) {
          // Host loaders may reject arbitrary values, including null. Keep the
          // failure branch explicit so reporting an error cannot break React render.
          setState({ request, error: error instanceof Error ? error : new Error(String(error ?? 'Could not render diagram')) });
        }
      }
    })();
    return () => { controller.abort(); release(); };
  }, [request]);

  // State is keyed by the whole request so old images disappear immediately,
  // even before passive effects clean up the previous asynchronous render.
  if (state?.request !== request) return createElement('span', { role: 'status' }, loading);
  if (state.error || !state.result.success) {
    const message = state.error?.message ?? state.result.diagnostics.map(item => item.message).join('\n');
    return createElement('span', { role: 'alert' }, message || 'Could not render diagram');
  }
  const result = state.result;
  return createElement('img', { width: result.width, height: result.height, ...imageProps,
    src: `data:image/png;base64,${result.png}`, alt });
}
