import { initializeTextGraph } from '@drawmotive/textgraph/node';
try {
  const missing = process.argv[2] ?? 'Graphics.Core.wasm';
  await initializeTextGraph({ resolveAsset: (asset, url) => asset.path.endsWith(missing) ? new URL(`missing-${missing}`, url) : url });
  console.log('unexpected success');
} catch (error) { console.log(`caught:${error.code}`); }
