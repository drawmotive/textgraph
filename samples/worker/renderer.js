import { initializeTextGraph } from '@drawmotive/textgraph/worker';

// The Worker owns a reusable runtime. Only source and rendered bytes cross the boundary.
try {
  const runtime = await initializeTextGraph({
    resolveAsset: asset => new URL(`textgraph/${asset.path}`, new URL(import.meta.env.BASE_URL, self.location.origin)),
  });
  // Register only after startup: the .NET bootstrap inspects onmessage to identify its Worker environment.
  self.onmessage = async ({ data }) => {
    if (data.type !== 'render') return;
    try {
      const result = await runtime.renderPng(data.source);
      if (!result.success) throw new Error(result.diagnostics.map(item => item.message).join('\n'));
      postMessage({ type: 'rendered', png: result.png, width: result.width, height: result.height }, [result.png.buffer]);
    } catch (error) {
      postMessage({ type: 'error', message: error.message });
    }
  };
  postMessage({ type: 'ready' });
} catch (error) {
  postMessage({ type: 'error', message: error.message });
}
