# TextGraph

**Turn text into diagrams in your application.**

Render flowcharts and directed graphs as PNGs in Node.js, browsers, React, and Web
Workers. TextGraph handles automatic layout and provides source validation and
rendering diagnostics. The renderer runs where your code runs; no hosted rendering
API or API key is required.

[Documentation](https://textgraph.dev/diagrams/flowcharts) ·
[Runnable examples](https://github.com/drawmotive/textgraph/tree/main/samples) ·
[API reference](https://github.com/drawmotive/textgraph/blob/main/docs/api-v1.md)

## A few lines. A diagram.

```textgraph
(horizontal)
browser -> api -> database

browser: Browser
api(fill primary): API Gateway
database: Database
```

![TextGraph output: Browser connects to API Gateway, which connects to Database.](https://raw.githubusercontent.com/drawmotive/textgraph/main/docs/images/service-flow.png)

**[Edit this exact diagram in the playground →](https://textgraph.dev/playground#source=%28horizontal%29%0Abrowser%20-%3E%20api%20-%3E%20database%0A%0Abrowser%3A%20Browser%0Aapi%28fill%20primary%29%3A%20API%20Gateway%0Adatabase%3A%20Database%0A)**

Actual SDK output from
[service-flow.textgraph](https://github.com/drawmotive/textgraph/blob/main/examples/service-flow.textgraph).
Keep source in version control and render again when relationships change.
TextGraph uses a small, structured language; it does not interpret unrestricted prose.

## Choose your workflow

| What you want to do | Use | Working example |
| --- | --- | --- |
| Generate diagrams for documentation, reports, or build jobs | Node.js: write PNG bytes to a file | [Node sample](https://github.com/drawmotive/textgraph/tree/main/samples/node) |
| Embed live diagrams in dashboards or internal tools | React component and shared provider | [React + Vite sample](https://github.com/drawmotive/textgraph/tree/main/samples/react-vite) |
| Add editable source and previews to a web app | Browser SDK | [Plain JavaScript sample](https://github.com/drawmotive/textgraph/tree/main/samples/browser) |
| Keep the UI responsive while rendering larger diagrams | SDK in a module Web Worker | [Worker sample](https://github.com/drawmotive/textgraph/tree/main/samples/worker) |
| Check syntax and references before rendering | The SDK's `validate()` method | [Validation example](https://github.com/drawmotive/textgraph/blob/main/examples/node.mjs) |

For existing documentation, use the
[Markdown/VitePress plugin](https://textgraph.dev/integrations/markdown) or
[VS Code Markdown extension](https://textgraph.dev/integrations/vscode).

## Install

```bash
npm install @drawmotive/textgraph
```

Requires **Node.js 22+** or a modern browser with WebAssembly and Web Crypto.
Browser applications need HTTPS or localhost. React support is an optional entry
in this package, compatible with React 18.2+ and 19.

## Render a PNG in Node.js

Save as `render.mjs`, then run `node render.mjs`:

```javascript
import { writeFile } from "node:fs/promises";
import { initializeTextGraph } from "@drawmotive/textgraph/node";

const textgraph = await initializeTextGraph();
try {
  const result = await textgraph.renderPng("browser -> api -> database");
  if (result.success) {
    await writeFile("diagram.png", result.png);
    console.log("Saved diagram.png");
  } else {
    console.error(result.diagnostics);
    process.exitCode = 1;
  }
} finally {
  await textgraph.dispose();
}
```

Node reads the included runtime from the installed package. No browser, .NET
installation, or asset-copy step is needed. Reuse an initialized instance for
multiple diagrams, then dispose it when the job is finished.

[Complete file-to-PNG sample →](https://github.com/drawmotive/textgraph/tree/main/samples/node)

## Add a diagram to React

For browser, React, and Worker applications, copy the runtime assets before
starting development or building:

```bash
npx textgraph-copy-assets public/textgraph/wasm
```

Then render a component:

```tsx
import { TextGraph, TextGraphProvider } from "@drawmotive/textgraph/react";
import type { TextGraphInitializeOptions } from "@drawmotive/textgraph";

const options: TextGraphInitializeOptions = {
  resolveAsset: (asset) => new URL(`/textgraph/${asset.path}`, location.origin),
};

export function Diagram({ source }: { source: string }) {
  return (
    <TextGraphProvider options={options}>
      <TextGraph source={source} alt="Service dependencies" />
    </TextGraphProvider>
  );
}
```

Changing `source` updates the image. For several diagrams, put one provider
around their common parent. Loading states and rendering diagnostics are built in.
The component renders on the main thread; use the Worker sample for heavier
interactive workloads.

[React + Vite sample →](https://github.com/drawmotive/textgraph/tree/main/samples/react-vite) ·
[React guide →](https://github.com/drawmotive/textgraph/blob/main/docs/react.md)

## Render in a browser

After copying assets as shown above, use this in a bundled browser application:

```javascript
import { initializeTextGraph } from "@drawmotive/textgraph/browser";

const textgraph = await initializeTextGraph({
  resolveAsset: (asset) => new URL(`/textgraph/${asset.path}`, location.origin),
});
try {
  const result = await textgraph.renderPng("browser -> api -> database", {
    encoding: "base64",
    scale: 2,
  });
  if (result.success) {
    const image = document.createElement("img");
    image.src = `data:image/png;base64,${result.png}`;
    image.alt = "Browser connects to API, which connects to database";
    image.width = result.displayWidth ?? result.width / 2;
    image.height = result.displayHeight ?? result.height / 2;
    image.style.maxWidth = "100%";
    image.style.height = "auto";
    document.body.append(image);
  } else {
    console.error(result.diagnostics);
  }
} finally {
  await textgraph.dispose();
}
```

For repeated edits, keep the runtime alive and dispose it when the editor closes.
An async call still computes on its current thread; the Worker sample moves
rendering off the UI thread.

[Browser example →](https://github.com/drawmotive/textgraph/tree/main/samples/browser) ·
[Worker example →](https://github.com/drawmotive/textgraph/tree/main/samples/worker)

### Deploy the browser runtime

- Add the asset-copy command to your application's `predev` and `prebuild` scripts.
- Deploy the complete copied directory: WASM, JavaScript, fonts, themes, and
  licenses. Re-copy after SDK updates; keep SDK and runtime versions matched.
- The resolver above assumes hosting at `/`. For a subdirectory, use your deployed
  base path; the Vite samples demonstrate `import.meta.env.BASE_URL`.

[Asset hosting and CSP →](https://github.com/drawmotive/textgraph/blob/main/docs/api-v1.md#assets-csp-and-offline-operation)

## Validation and output options

On an initialized instance:

```javascript
const validation = await textgraph.validate("browser -> api -> database");
console.log(validation.valid, validation.diagnostics);

const image = await textgraph.renderPng("browser -> api -> database", {
  scale: 2,
  padding: 24,
  maxWidth: 1200,
});
```

Validation checks parsing and semantic references; rendering additionally checks
layout and output. Diagram failures return diagnostics. Operational failures
reject with `DrawMotiveError`.

PNG output defaults to bytes, scale `1`, padding `10`, and a white background.
Use higher scale for more pixels and returned display dimensions for web sizing.
TypeScript declarations are included for every public entry point.

[Full API and options →](https://github.com/drawmotive/textgraph/blob/main/docs/api-v1.md)

## Run the examples locally

Samples are complete applications in the public repository and use a local
package tarball. To try the React sample from a fresh checkout:

```bash
git clone https://github.com/drawmotive/textgraph.git
cd textgraph
node samples/prepare.mjs react-vite
cd samples/react-vite
npm run dev
```

Vite samples require Node.js **22.12+**. Replace `react-vite` with `browser` or
`worker` for those samples. The Node sample uses `npm start` instead.
Preparation packages the checkout and installs sample dependencies; it does not
publish anything. Samples are not included in the npm package.

[Sample setup and deployment →](https://github.com/drawmotive/textgraph/blob/main/samples/README.md)

## Current scope

- **Available:** flowcharts and directed graphs, automatic layout, PNG rendering,
  and source validation.
- **Not available yet:** mind maps, sequence diagrams, slides, and SVG export.
- **Fonts:** Noto Sans and Fuzzy Bubbles are included. Custom font descriptors are
  supported; the optional `@drawmotive/textgraph-fonts` package is not published.
  See [font configuration](https://github.com/drawmotive/textgraph/blob/main/docs/api-v1.md#fonts-and-language-packs).

## Project links

[Language guide](https://textgraph.dev/diagrams/flowcharts) ·
[Changelog](https://github.com/drawmotive/textgraph/blob/main/CHANGELOG.md) ·
[Report an issue](https://github.com/drawmotive/textgraph/issues) ·
[MIT license](https://github.com/drawmotive/textgraph/blob/main/LICENSE)

### Try it in a browser

[Open the runnable HTML/JavaScript example](https://textgraph.dev/examples/textgraph/) to edit source, see its PNG and copy the integration code without installing anything. For visual editing, see [the DrawMotive editor](https://textgraph.dev/editor/).
