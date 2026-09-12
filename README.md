# TextGraph SDK

Render TextGraph diagrams as PNG images and validate diagram source.

## Installation

```bash
npm install @drawmotive/textgraph
```

Requires Node.js 22+ or a modern browser.

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

PNG output defaults to bytes, scale `2`, padding `10`, and a white background. Reuse an instance for multiple diagrams, then call `dispose()`.

## Higher resolution

```typescript
const result = await textgraph.renderPng("A -> B", {
  scale: 4,
  padding: 24,
});
```

## Display in a browser

```typescript
import { initializeTextGraph } from "@drawmotive/textgraph/browser";

const textgraph = await initializeTextGraph();
const result = await textgraph.renderPng("A -> B", {
  encoding: "base64",
  maxWidth: 1200,
});

if (result.success) {
  const image = document.createElement("img");
  image.src = `data:image/png;base64,${result.png}`;
  image.alt = "A connects to B";
  document.body.append(image);
}

await textgraph.dispose();
```

## Additional languages

```bash
npm install @drawmotive/textgraph-fonts-zh-cn
```

```typescript
import { initializeTextGraph } from "@drawmotive/textgraph";
import { zhCN } from "@drawmotive/textgraph-fonts-zh-cn";

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
