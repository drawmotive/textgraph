'use client';

import { Fragment, createContext, createElement, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { createRuntimeResource } from './runtime.js';

const RuntimeContext = createContext(null);
const defaultOptions = Object.freeze({});

// Layout effects publish the image URL before paint; servers never run effects and React 18 warns there.
const useClientLayoutEffect = typeof document === 'undefined' ? useEffect : useLayoutEffect;

/**
 * A Blob URL lets the browser read the PNG bytes directly; a data URL would base64-encode them.
 * The URL is created and revoked by one effect keyed by committed bytes, so results that React
 * batches away (for example a preview superseded in the same task) never allocate a URL to leak.
 */
function useImageUrl(png) {
  const [image, setImage] = useState(null);
  useClientLayoutEffect(() => {
    if (!png) return undefined;
    const src = URL.createObjectURL(new Blob([png], { type: 'image/png' }));
    setImage({ png, src });
    return () => URL.revokeObjectURL(src);
  }, [png]);
  return png && image?.png === png ? image.src : undefined;
}

/** Shares a lazy browser runtime across diagrams and owns its eventual disposal. */
export function TextGraphProvider({ options = defaultOptions, children }) {
  const resource = useMemo(() => createRuntimeResource(options), [options]);
  useEffect(() => resource.retain(), [resource]);
  return createElement(RuntimeContext.Provider, { value: resource }, children);
}

/** Renders DSL as an image; only the latest committed input may publish a result. */
export function TextGraph({ source, alt = 'TextGraph diagram', renderOptions = defaultOptions,
  loading = 'Rendering diagram…', fontsLoading = 'Fonts are still loading…', style, ...imageProps }) {
  const shared = useContext(RuntimeContext);
  const resource = useMemo(() => shared ?? createRuntimeResource(defaultOptions), [shared]);
  const { scale = 1, padding, maxWidth, dark, language } = renderOptions;
  const request = useMemo(() => ({ source, scale, padding, maxWidth, dark, language, resource }),
    [source, scale, padding, maxWidth, dark, language, resource]);
  const [state, setState] = useState(null);

  useEffect(() => {
    const release = resource.retain();
    const controller = new AbortController();
    void (async () => {
      try {
        const runtime = await resource.get();
        if (controller.signal.aborted) return;
        const result = await runtime.renderPng(source, { scale, padding, maxWidth, dark, language, signal: controller.signal,
          onPreview: result => { if (!controller.signal.aborted) setState({ request, result, fontsLoading: true }); },
        });
        if (!controller.signal.aborted) setState({ request, result });
      } catch (error) {
        if (!controller.signal.aborted) {
          // Host loaders may reject arbitrary values, including null. Keep the
          // failure branch explicit so reporting an error cannot break React render.
          setState(previous => ({ request, result: previous?.request === request ? previous.result : undefined,
            error: error instanceof Error ? error : new Error(String(error ?? 'Could not render diagram')) }));
        }
      }
    })();
    return () => { controller.abort(); release(); };
  }, [request]);
  const current = state?.request === request ? state : null;
  const src = useImageUrl(current?.result?.success ? current.result.png : undefined);

  // State is keyed by the whole request so old images disappear immediately,
  // even before passive effects clean up the previous asynchronous render.
  if (!current) return createElement('span', { role: 'status' }, loading);
  if (!state.result?.success) {
    const message = state.error?.message ?? state.result.diagnostics.map(item => item.message).join('\n');
    return createElement('span', { role: 'alert' }, message || 'Could not render diagram');
  }
  // The URL arrives in the layout effect right after the bytes commit, before the browser paints.
  if (!src) return createElement('span', { role: 'status' }, loading);
  const result = state.result;
  // Density improves sharpness without enlarging the diagram. Native dimensions
  // also preserve logical size when maxWidth lowers the actual render density.
  const image = createElement('img', { width: result.displayWidth ?? result.width / scale, height: result.displayHeight ?? result.height / scale, ...imageProps,
    style: { maxWidth: '100%', ...(imageProps.height == null ? { height: 'auto' } : {}), ...style },
    src, alt });
  if (state.error) return createElement(Fragment, null, image, createElement('span', { role: 'alert' }, state.error.message));
  if (state.fontsLoading) return createElement(Fragment, null, image, createElement('span', { role: 'status' }, fontsLoading));
  return image;
}
