# TextGraph SDK

Validate TextGraph diagrams in your workflows and apps.

## Installation

```bash
npm install @drawmotive/textgraph
```

Requires Node.js 22+.

## Quickstart

```typescript
import { initializeTextGraph } from "@drawmotive/textgraph";

const textgraph = await initializeTextGraph();

try {
  const result = await textgraph.validate("A -> B");

  console.log(result.valid);
  console.log(result.diagnostics);
} finally {
  await textgraph.dispose();
}
```

Call `validate()` repeatedly on the same instance to check additional diagrams. Call `dispose()` when you are finished.
