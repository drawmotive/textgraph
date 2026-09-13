# TextGraph Fonts

One optional package for TextGraph fonts beyond the SDK's bundled defaults. Language descriptors are exported from `@drawmotive/textgraph-fonts` and selected through `languagePacks`. The first descriptor, `zhCN`, adds Simplified Chinese coverage; future fonts belong in this same package.

The package contains font assets, descriptors, and licenses. It does not include another runtime. The Simplified Chinese font license is in [zh-cn/OFL.txt](zh-cn/OFL.txt).

> **[Report all TextGraph issues on GitHub →](https://github.com/drawmotive/textgraph/issues)**
> Use this shared tracker for font problems, bugs, and feature requests.

## Installation

The package is not yet published. Once available:

```bash
npm install @drawmotive/textgraph @drawmotive/textgraph-fonts
```

## Quickstart

```typescript
import { initializeTextGraph } from "@drawmotive/textgraph";
import { zhCN } from "@drawmotive/textgraph-fonts";

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
