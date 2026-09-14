# React integration

The `/react` entry is an unreleased addition after `0.1.0-alpha.1`. React is an optional peer dependency (`^18.2.0 || ^19.0.0`); applications without React use the ordinary SDK entries.

## Browser assets

Run `textgraph-copy-assets public/textgraph/wasm` in your application after installing the SDK, and again after updates. Put it in `predev` and `prebuild` scripts. Serve the public directory, then resolve assets to that URL:

```tsx
import { TextGraph, TextGraphProvider } from '@drawmotive/textgraph/react';
import type { TextGraphInitializeOptions } from '@drawmotive/textgraph';

const options: TextGraphInitializeOptions = {
  resolveAsset: asset => new URL(`/textgraph/${asset.path}`, location.origin),
};

export function Diagram({ source }: { source: string }) {
  return (
    <TextGraphProvider options={options}>
      <TextGraph source={source} alt="Process flow"
        renderOptions={{ maxWidth: 1200 }} />
    </TextGraphProvider>
  );
}
```

For several diagrams, place a single provider around their common parent. Keep `options` stable using a module constant or `useMemo`; replacing it replaces the runtime, for example when changing language packs. Startup occurs only when a diagram mounts. StrictMode effect replay reuses startup, and final unmount disposes even an instance that is still initializing.

`TextGraph` can run without a provider when the SDK's default package-relative URLs are served intact. Each standalone component owns its runtime. Bundled applications should use a provider with explicit asset resolution.

Use your deployed base path instead of `/` for subdirectory hosting. The [React/Vite sample](https://github.com/drawmotive/textgraph/tree/main/samples/react-vite) demonstrates Vite's `BASE_URL`. No external CDN is needed. Assets follow the [SDK's MIME, CSP and offline requirements](api-v1.md#assets-csp-and-offline-operation); PNG data URLs need `img-src 'self' data:`.

## Component behavior

| Prop | Behavior |
| --- | --- |
| `source` | Required DSL string; changes trigger rendering. |
| `alt` | Image description; defaults to `TextGraph diagram`. |
| `renderOptions` | Defaults to `scale: 2` for sharper web images; `padding` and `maxWidth` use SDK defaults. |
| `loading` | React content shown with `role="status"`; defaults to `Rendering diagram…`. |
| Other image attributes | Passed to the successful `<img>`, including `className`, `style`, `width`, and `height`. |

The component owns `src`, encoding, and cancellation. While new input renders, old images are replaced by loading content. A stale result cannot replace newer input. DSL diagnostics and operational failures appear as escaped text with `role="alert"`; corrected input renders again. Changing only `alt` or image styles does not rerun layout.

Images use the render result's logical `displayWidth` and `displayHeight`, so increasing `scale` adds pixels without enlarging the diagram. `maxWidth` limits raster pixels rather than CSS width. Styles default to `maxWidth: '100%'` and `height: 'auto'`; supplied styles merge over these defaults, and explicit image dimensions override the logical dimensions.

Older runtimes omit display dimensions. The component then divides raster dimensions by the requested scale; this preserves logical size unless `maxWidth` has lowered the effective density. Deploy matching updated runtime assets for accurate sizing in that case. PNG DPI metadata does not control CSS size.

An ordinary React render uses the browser main thread. Native layout already running cannot be preempted by cancellation; for heavy interactive workloads use the [Worker sample](https://github.com/drawmotive/textgraph/tree/main/samples/worker) to move SDK execution off the UI thread. The React component does not automatically create a Worker.

## Server rendering

The entry carries `'use client'`. Server rendering emits the same loading placeholder without starting WASM; the browser renders the diagram after hydration. In frameworks such as Next.js, place the provider and resolver function in your own client component, because functions cannot be passed across a server/client serialization boundary.

To deliver a finished image in the initial HTML, call `@drawmotive/textgraph/node` during server/build work, persist the PNG, and render a normal `<img>` with its URL. That workflow does not load WASM in the reader's browser.
