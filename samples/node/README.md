# Node sample

Read a TextGraph DSL file and write a PNG using the WASM included in the installed SDK. Requires Node.js 22+.

From the repository root:

```bash
node samples/prepare.mjs node
cd samples/node
npm start
```

The result is `output/diagram.png`. To choose input and output paths:

```bash
npm start -- ./diagram.textgraph ./output/custom.png
```

No browser, HTTP server, .NET installation or asset-copy step is needed. The runtime is disposed after rendering. See the [shared setup guide](../README.md).
