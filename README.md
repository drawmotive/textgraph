# TextGraph SDK

Render TextGraph diagrams as PNG images and validate diagram source.

> **[Report all TextGraph issues on GitHub →](https://github.com/drawmotive/textgraph/issues)**
> Bugs, feature requests, documentation, playground, SDK, fonts, Markdown, and VS Code issues all belong in this shared tracker.

## Installation

```bash
npm install @drawmotive/textgraph@0.2.1
```

Requires Node.js 22+ or a modern browser.

Version `0.2.1` defaults React PNG rendering to scale `1`, matching the base SDK. Version `0.2.0` was the first stable release. The exact installation command above becomes available after `0.2.1` is published; `@latest` selects the current published stable release.

## Quickstart

```typescript
import { writeFile } from "node:fs/promises";
import { initializeTextGraph } from "@drawmotive/textgraph";

const textgraph = await initializeTextGraph();

try {
  const result = await textgraph.renderPng("A -> B");

  if (result.success) {
    await writeFile("diagram.png", result.png);
  } else {
    console.log(result.diagnostics);
  }
} finally {
  await textgraph.dispose();
}
```

PNG output defaults to bytes, scale `1`, padding `10`, and a white background. Reuse an instance for multiple diagrams, then call `dispose()`.

## Higher resolution

```typescript
const result = await textgraph.renderPng("A -> B", {
  scale: 4,
  padding: 24,
});
```

## Display in a browser

For a bundled application, copy the runtime into its public directory before development or build:

```bash
npx textgraph-copy-assets public/textgraph/wasm
```

The copy command and React entry below are available starting with `0.2.0`. The [repository samples](https://github.com/drawmotive/textgraph/tree/main/samples) install and run the SDK as a tarball.

```typescript
import { initializeTextGraph } from "@drawmotive/textgraph/browser";

const textgraph = await initializeTextGraph({
  resolveAsset: (asset) => new URL(`/textgraph/${asset.path}`, location.origin),
});
const result = await textgraph.renderPng("A -> B", {
  encoding: "base64",
  scale: 2,
  maxWidth: 1200,
});

if (result.success) {
  const image = document.createElement("img");
  image.src = `data:image/png;base64,${result.png}`;
  image.alt = "A connects to B";
  image.width = result.displayWidth ?? result.width / 2;
  image.height = result.displayHeight ?? result.height / 2;
  image.style.maxWidth = "100%";
  image.style.height = "auto";
  document.body.append(image);
}

await textgraph.dispose();
```

Scale `2` supplies more pixels for sharper web images; `displayWidth` and `displayHeight` keep the diagram at its logical size, including when `maxWidth` lowers the raster density. PNG DPI metadata does not control its CSS size. Older runtimes omit display dimensions; dividing pixel dimensions by the requested scale is a fallback that cannot recover logical size after `maxWidth` clamps the output.

The npm package includes WASM, .NET runtime modules, fonts, and themes. Bundlers do not automatically deploy these dynamically loaded files. Re-copy assets after SDK updates and use an asset URL matching your deployment base path. Node loads assets from the installed package without this copy step.

## React

React 18.2+ and 19 use the same SDK through an optional entry; non-React users do not need React. Configure assets once and pass DSL to `TextGraph`:

```tsx
import { TextGraph, TextGraphProvider } from "@drawmotive/textgraph/react";

const options = {
  resolveAsset: (asset) => new URL(`/textgraph/${asset.path}`, location.origin),
};

export function App() {
  return (
    <TextGraphProvider options={options}>
      <TextGraph source={"A -> B"} alt="Flow diagram" />
    </TextGraphProvider>
  );
}
```

The component defaults to scale `1`, displays at logical size, and shrinks to fit its container. Set `scale: 2` explicitly for higher raster density. Changing `source` updates the image. The provider shares one lazy runtime across diagrams and disposes it on unmount. See [React integration](docs/react.md) for loading, errors, rendering options, and server rendering.

## Runnable samples

The [samples directory](https://github.com/drawmotive/textgraph/tree/main/samples) contains browser JavaScript, React/Vite, Web Worker, and Node applications. Each installs a packed SDK and includes complete run instructions. Samples stay in the repository and are excluded from npm.

## Additional languages

All optional fonts share the `@drawmotive/textgraph-fonts` package, which is not yet published. Select the language descriptors needed by the application; `zhCN` provides Simplified Chinese coverage.

```bash
npm install @drawmotive/textgraph-fonts
```

```typescript
import { initializeTextGraph } from "@drawmotive/textgraph";
import { zhCN } from "@drawmotive/textgraph-fonts";

const textgraph = await initializeTextGraph({ languagePacks: [zhCN] });
const result = await textgraph.renderPng("A: 开始\nB: 完成\nA -> B");
await textgraph.dispose();
```

## Validation

```typescript
const result = await textgraph.validate("A -> B");
console.log(result.valid, result.diagnostics);
```

Diagram errors return diagnostics. Operational errors throw `DrawMotiveError`. See the [API reference](docs/api-v1.md) for options, cancellation, and deployment.
