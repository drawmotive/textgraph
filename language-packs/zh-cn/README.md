# TextGraph Simplified Chinese Fonts

Render Simplified Chinese labels with TextGraph.

## Installation

```bash
npm install @drawmotive/textgraph @drawmotive/textgraph-fonts-zh-cn
```

## Quickstart

```typescript
import { initializeTextGraph } from "@drawmotive/textgraph";
import { zhCN } from "@drawmotive/textgraph-fonts-zh-cn";

const textgraph = await initializeTextGraph({ languagePacks: [zhCN] });

try {
  const result = await textgraph.renderPng('A: 开始\nB: 完成\nA -> B', {
    encoding: "base64",
  });

  if (result.success) {
    image.src = `data:image/png;base64,${result.png}`;
  }
} finally {
  await textgraph.dispose();
}
```
