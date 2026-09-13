# Runnable TextGraph samples

These applications live with the SDK and consume its actual npm tarball. They do not import SDK source files or require the private .NET repository. Node.js 22.12+ is required for the Vite samples; the Node sample requires Node.js 22+.

| Sample | Purpose | Run after preparation |
| --- | --- | --- |
| [browser](browser/) | Plain HTML and JavaScript: DSL to PNG | `cd samples/browser && npm run dev` |
| [react-vite](react-vite/) | React component: source prop to diagram, live updates | `cd samples/react-vite && npm run dev` |
| [worker](worker/) | Render in a module Worker; transfer PNG bytes to the page | `cd samples/worker && npm run dev` |
| [node](node/) | Read a DSL file and write a PNG | `cd samples/node && npm start` |

## Prepare from a fresh checkout

Run from the TextGraph repository root:

```bash
node samples/prepare.mjs
```

This packs the checked-out SDK into `samples/.artifacts/textgraph.tgz`, then installs it and each sample's dependencies. It does not publish anything. To prepare only one sample, append its directory name, for example `node samples/prepare.mjs react-vite`. Run preparation again after changing the SDK; the same package version may have different local tarball contents.

Each sample has its own `package.json` and lockfile. Preparation refreshes the local tarball integrity in selected lockfiles. Copying a sample to another repository is supported: change `@drawmotive/textgraph` to a published version that includes the API demonstrated, then run `npm install`. The React entry point and asset-copy command were added after `0.1.0-alpha.1`.

## Browser deployment and WASM

Browser, React and Worker samples use Vite for development and production bundling. Their `predev` and `prebuild` scripts run:

```bash
textgraph-copy-assets public/textgraph/wasm
```

The command copies the **complete installed runtime**, including WASM assemblies, JavaScript bootstrap files, theme, fonts and licenses. It uses no network and preserves unrelated destination files. `resolveAsset` maps manifest paths such as `wasm/dotnet.js` to `/textgraph/wasm/dotnet.js`. Deploy the entire `dist/` directory so these files remain available alongside the bundled JavaScript. Serve `.wasm` as `application/wasm`, JavaScript as JavaScript, and keep SDK and runtime files from the same package version.

For a site under a URL prefix, configure Vite's `base`; the samples derive runtime URLs from `import.meta.env.BASE_URL`. Use an HTTP server, not `file://`. Node reads assets directly from its installed package and needs no copy step.

React uses `@drawmotive/textgraph/react` from the same package, with React installed by the application. A stable provider options object shares one runtime across renders; changing `source` updates the image. The sample also enables React Strict Mode.

## Build and verify

Run from the repository root. The aggregate test command prepares every sample from the current SDK tarball and builds all browser applications before testing:

```bash
npm ci
npx playwright install --with-deps chromium firefox webkit
npm run test:samples
```

All samples have automated coverage. The Node tests run with Node's native test runner, exercise default and custom DSL files, decode visible PNG pixels, and check that invalid DSL exits unsuccessfully without an image. Playwright runs browser, React and Worker samples serially in Chromium, Firefox and WebKit against production builds. It checks real WASM/font loading, visible PNG pixels, source updates, invalid DSL, and recovery after correction. Failed browser runs retain screenshots and traces.

CI runs the Node sample on Linux, Windows and macOS, and all browser samples in the three Playwright engines on Linux. Samples install the actual npm tarball rather than importing repository source. No .NET build is needed.

For a focused rerun after preparation and builds:

```bash
npm run test:samples:node
npm run test:samples:browser -- --project=chromium
```

Run `npm run samples:prepare` and `npm run samples:build` again if the SDK or sample source changed before a focused browser rerun. To run the Node sample manually, `npm --prefix samples/node start` writes `samples/node/output/diagram.png`.

To preview an individual production build:

```bash
cd samples/react-vite
npm run build
npm run preview
```

To render another DSL file in Node:

```bash
cd samples/node
npm start -- ./diagram.textgraph ./output/custom.png
```
