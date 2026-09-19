# TextGraph API, protocol 1

This contract covers validation and PNG rendering. Validation checks parsing and semantic reference resolution; it does not certify layout feasibility or renderability. Empty source is valid. Public AST, editable layout and file APIs remain separate milestones.

```javascript
import { initializeTextGraph } from '@drawmotive/textgraph';
const runtime = await initializeTextGraph();
try {
  console.log(await runtime.validate('A -> B'));
} finally {
  await runtime.dispose();
}
```

## Public data

Initialization resolves after manifest and real bridge agree on ABI, protocol and validation capability. Import does not start .NET or fetch runtime data. `runtime.info` reports package/ABI/protocol versions and actual capabilities. `state` is `ready`, `disposing` or `disposed`.

`validate(source, { signal }?)` returns immutable detached `{ valid, diagnostics }`. Parse errors stop semantic resolution. Diagnostics contain `code`, `severity` (`error` or `warning`), `stage` (`parse` or `semantic`), `message`, and optional `location: { line, column }`. Lines and UTF-16 columns are zero-based, including CRLF and supplementary Unicode characters. Unknown locations are omitted; end spans are not fabricated. Initial codes are `TG_PARSE_ERROR`, `TG_PARSE_WARNING`, `TG_SEMANTIC_ERROR`, `TG_SEMANTIC_WARNING`. Message wording may evolve.

## PNG rendering

`renderPng(source, options?)` returns `{ success: true, png, width, height, displayWidth?, displayHeight?, diagnostics }` or `{ success: false, diagnostics }`. `width` and `height` are raster pixels. The optional display dimensions are positive numbers representing logical size: raster dimensions divided by the effective scale after any `maxWidth` reduction. Older runtimes omit both fields. Diagram failures resolve with diagnostics and contain no image data. Successful results and diagnostics are frozen; byte output is a detached, caller-owned `Uint8Array`. Output uses a white background.

| Option | Default | Meaning |
| --- | --- | --- |
| `encoding` | `"bytes"` | `"bytes"` returns `Uint8Array`; `"base64"` returns a string without a data-URL prefix. |
| `scale` | `1` | Positive finite raster density relative to logical diagram size. |
| `padding` | `10` | Non-negative finite padding in diagram units. |
| `maxWidth` | Omitted | Positive safe integer maximum output width in pixels; preserves proportions and only reduces output size. |
| `signal` | Omitted | Cancels queued work or discards completed work after cancellation. |

Literal encodings infer their corresponding PNG type in TypeScript; union encodings return `Uint8Array | string`. Render diagnostics may use `parse`, `semantic`, `layout`, `render`, or `font` stages. `validate()` retains its original parse/semantic contract.

Scale and padding must remain finite when represented as 32-bit floats; scale must also remain greater than zero. Invalid arguments reject with `INVALID_ARGUMENT`.

For web display, use scale `2` and the returned display dimensions as image dimensions, with `max-width: 100%; height: auto`. Increasing density then improves sharpness without enlarging the diagram. DPI metadata does not change CSS sizing. When an older runtime omits display dimensions, dividing raster dimensions by the requested scale works only when `maxWidth` did not reduce the effective density.

After applying `maxWidth`, output is limited to 16,384 pixels per side and 16,777,216 pixels in total. Larger images return the `TG_RENDER_SIZE_LIMIT` diagnostic. PNG dimensions and signature are checked against the response metadata; malformed responses reject with `INVALID_RESPONSE`.

## Fonts and language packs

Default rendering includes Noto Sans and Fuzzy Bubbles. Configure additional fonts with `initializeTextGraph({ languagePacks: [...] })`. A `TextGraphLanguagePack` has a non-empty `fonts` array of `{ family, source }` and optional ordered `fallbackFamilies`. Font sources are `URL` objects or non-empty `Uint8Array` values. In Node, use `pathToFileURL()` for filesystem paths; relative asset modules can use `new URL("./font.ttf", import.meta.url)` across platforms.

The initializer copies byte arrays, URLs and descriptor arrays before asynchronous work, so later caller mutations cannot change rendering resources. Families must be unique across all packs and bundled defaults. Fallback families must name configured fonts. Descriptor validation performs no font I/O. Font contents are loaded and configured on first render; validate-only use does not read fonts or themes. Font-loading or configuration failures reject with `DrawMotiveError`; a later render can retry.

Bundled resource URLs use `resolveAsset`. Language-pack sources use their supplied URL directly and the platform data loader, including custom `fetch` or the network adapter for network URLs. All optional fonts share `@drawmotive/textgraph-fonts`, installed separately. It currently exports a `zhCN` descriptor for Simplified Chinese; additional language descriptors will use the same package. The package is not yet published.

## Lifecycle

Validation, render preparation and rendering calls serialize through one queue per instance. Independent instances have independent runtime module graphs and queues. Cancellation is checked before and after native work. Cancelling queued work prevents execution; it cannot preempt native parsing, layout or rendering already running on the same thread. A Promise does not move computation off the main thread.

`dispose()` is idempotent, rejects new work immediately and drains accepted work before releasing owned native font resources, cache timers and wrapper references. The wrapper stays disposed even if cleanup fails. .NET has no portable host-safe unload: its Node exit API terminates the process. Disposal does not promise reclamation of the entire VM/module cache. Reuse an instance; terminate its host-owned Worker for hard cancellation and full environment reclamation.

Existing `loadRuntime`, `readonly` and `mutate` hooks remain for development compatibility, outside the stable business API. Injected legacy runtimes may initialize without validation; `validate()` then reports `UNSUPPORTED_CAPABILITY`.

## Platforms

- Node 22 or later: root or `/node`; runtime modules use installed-package `file:` URLs, data uses `node:fs/promises`. HTTP data can use injected fetch, but Node does not import remote HTTP JavaScript. Node `worker_threads` uses `/node`.
- Browser: `/browser` or browser conditional export. Modern Chromium, Firefox and WebKit with WebAssembly, ESM, fetch, BigInt and Web Crypto are tested. HTTPS or localhost is required for Web Crypto. Exact engine versions are pinned by the Playwright lockfile; historical minimum browser versions are not claimed.
- Browser module Web Worker: `/worker` inside a host-created Worker; no DOM, window, automatic RPC or Worker pool.
- React 18.2+ or 19: `/react` provides `TextGraph` and `TextGraphProvider` over the browser runtime. See [React integration](react.md).

Root condition precedence is worker/browser/node/default. Explicit entries avoid bundler ambiguity. Browser/Worker source graphs exclude Node imports.

The repository development command can set `DRAWMOTIVE_TEXTGRAPH_RUNTIME` to an absolute generated directory for Node and inherited Node Workers. The default Node loader then reads that directory's `wasm-manifest.json` and resolves native modules, fonts, and themes there; existing manifest validation and asset integrity checks still apply. Missing or invalid local artifacts reject initialization or rendering without falling back to packaged assets. A supplied `resolveAsset` receives the selected local URL as its default; an explicit `loadRuntime` remains authoritative. Browser and browser Worker loaders ignore this environment variable.

Keep this selection scoped to the development command. With it absent, package loading is unchanged; `info.packageVersion` identifies the JavaScript wrapper and capabilities reflect the intersection of the selected manifest and native bridge. Native manifests marked `privateSource.development: true` are rejected by release verification.

## Assets, CSP and offline operation

Defaults resolve relative to the installed module. `resolveAsset(asset, defaultUrl)` may return an absolute URL or URL object for each asset. Deploy the complete `generated/wasm` directory: bundlers must preserve/copy these files and configure the resolver for their deployed location. It covers both JS and data. Instance query parameters isolate mutable .NET ESM state; servers should serve identical module bytes regardless of that query.

`fetch` or `adapters.network.fetch` receives data URLs and the applicable initialization or render signal. Independent startup data assets download concurrently; all must pass integrity checks before native startup. JS uses dynamic import, which injected fetch cannot intercept. Offline installations must cache the module graph as well as WASM/data at importable URLs, using a Service Worker or local server. No GitHub Releases download is required.

Browser, Worker and Node entry points share this concurrent startup loader. Markdown integrations using the Node entry point inherit it when upgraded to the fixed SDK; their default asset reads are local files. Publishing an SDK version does not update pinned dependencies or previously bundled extensions: consumers must update their dependency and lockfile, then rebuild and redeploy or repackage. The separate `@drawmotive/editor` package uses Blazor's own concurrent loader.

Serve WASM as `application/wasm`, JS as `text/javascript`, and provide applicable CORS headers for cross-origin assets. Same-origin CSP: `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; worker-src 'self'`. No eval, new Function or DOM script injection is used. Cross-origin isolation and SharedArrayBuffer are not required by this single-threaded runtime.

Serve font files as `font/ttf` and themes as `text/css`. To display base64 PNGs, add `img-src 'self' data:` to CSP; include `blob:` too when displaying Blob URLs.

## Errors

DSL failures resolve with diagnostics. Operational errors reject with `DrawMotiveError`: stable `code`, optional `cause`, frozen structured `details`. Codes include `INVALID_ARGUMENT`, `INVALID_MANIFEST`, `INVALID_ASSET_URL`, `RESOURCE_NOT_FOUND`, `ASSET_INTEGRITY_MISMATCH`, `ABI_MISMATCH`, `UNSUPPORTED_CAPABILITY`, `INITIALIZATION_FAILED`, `UNSUPPORTED_ENVIRONMENT`, `INVALID_RESPONSE`, `RUNTIME_FAILED`, `INSTANCE_DISPOSED`, `INVALID_ADAPTER`. Cancellation errors have name `AbortError`. Messages and underlying runtime causes are not stable.

## ABI and versioning

ABI 1.0.0 retains GetAbiVersion/GetPackageKind/CountParseDiagnostics and adds GetRuntimeInfo(), Validate(source) and Execute(requestJson) on DrawMotive.TextGraph.Bridge.Program. Info returns JSON `{ abiVersion, packageKind, protocolVersion: 1, capabilities }`; Validate returns `{ protocolVersion: 1, valid, diagnostics }`. Wrappers require `textgraph-validate-v1`; PNG rendering additionally requires `textgraph-render-v1` and the manifest `bridge.execute` export. Legacy validation exports remain supported. This is a managed export/JSON protocol, not a raw WASM pointer ABI.

`generated/wasm-manifest.json` is authoritative; its ESM projection avoids JSON-module browser assumptions. Shipped schemas describe the manifest, validation response and rendering response. Manifest schema, ABI, protocol and npm versions are separate. Additive exports use capabilities; incompatible wire changes require a new supported version. npm versions and bundled assets are released together. DSL/file-format versions are not frozen by this milestone.

Assets have relative path, media type, byte count and SHA-256. Packaging checks reject missing/extra assets, debug files, hash/projection/version drift. Runtime data assets are hash-checked before native startup. Bundled fonts and themes are loaded and hash-checked lazily before the first render; license files require no runtime I/O. These checks establish distribution consistency, not authenticated runtime signatures. `privateSource.commit` identifies committed private C# and bridge inputs. Toolchain changes may change bytes; cross-toolchain byte-for-byte reproducibility is not promised.

The rendering wire uses one `Execute(requestJson)` export. Configuration is performed once before the first render with `{ protocolVersion: 1, operation: "configure", theme, fonts: [{ family, data }], fallbackFamilies }`, where `data` is base64 font data. Its response is `{ protocolVersion: 1, success, diagnostics }`. A render request is `{ protocolVersion: 1, operation: "render", source, export: { format: "png", scale, padding, maxWidth? } }`. Native success returns base64 `png`, `width`, `height`, and diagnostics, plus an additive optional `displayWidth`/`displayHeight` pair; failures contain only `success: false` and diagnostics beside the protocol version. The JavaScript wrapper validates the display dimensions when present and converts image data to the requested encoding.

For rendering-capable bridges, disposal sends `{ protocolVersion: 1, operation: "dispose" }` and validates the same success/diagnostics envelope as configuration. This request releases native resources without loading fonts or shutting down the host runtime. Legacy validation-only bridges release wrapper references directly.
