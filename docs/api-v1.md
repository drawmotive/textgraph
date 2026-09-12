# TextGraph validation API, protocol 1

This contract covers local parsing and semantic reference resolution. Validity does not certify layout feasibility, renderability or DrawMotive file compatibility. Empty source is valid. Public AST, layout, rendering and file APIs are separate milestones.

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

## Lifecycle

Validation calls serialize per instance. Independent instances have independent runtime module graphs and queues. Cancellation is checked before execution and after the synchronous parser returns. Cancelling queued work prevents execution; it cannot preempt synchronous C# parsing on the same thread. A Promise does not move computation off the main thread.

`dispose()` is idempotent, rejects new work immediately and drains accepted work before releasing wrapper references. The wrapper stays disposed even if cleanup fails. .NET has no portable host-safe unload: its Node exit API terminates the process. Disposal does not promise reclamation of the entire VM/module cache. Reuse an instance; terminate its host-owned Worker for hard cancellation and full environment reclamation.

Existing `loadRuntime`, `readonly` and `mutate` hooks remain for development compatibility, outside the stable business API. Injected legacy runtimes may initialize without validation; `validate()` then reports `UNSUPPORTED_CAPABILITY`.

## Platforms

- Node 22 or later: root or `/node`; runtime modules use installed-package `file:` URLs, data uses `node:fs/promises`. HTTP data can use injected fetch, but Node does not import remote HTTP JavaScript. Node `worker_threads` uses `/node`.
- Browser: `/browser` or browser conditional export. Modern Chromium, Firefox and WebKit with WebAssembly, ESM, fetch, BigInt and Web Crypto are tested. HTTPS or localhost is required for Web Crypto. Exact engine versions are pinned by the Playwright lockfile; historical minimum browser versions are not claimed.
- Browser module Web Worker: `/worker` inside a host-created Worker; no DOM, window, automatic RPC or Worker pool.

Root condition precedence is worker/browser/node/default. Explicit entries avoid bundler ambiguity. Browser/Worker source graphs exclude Node imports.

## Assets, CSP and offline operation

Defaults resolve relative to the installed module. `resolveAsset(asset, defaultUrl)` may return an absolute URL or URL object for each asset. Deploy the complete `generated/wasm` directory: bundlers must preserve/copy these files and configure the resolver for their deployed location. It covers both JS and data. Instance query parameters isolate mutable .NET ESM state; servers should serve identical module bytes regardless of that query.

`fetch` or `adapters.network.fetch` receives data URLs and initialization signal. JS uses dynamic import, which injected fetch cannot intercept. Offline installations must cache the module graph as well as WASM/data at importable URLs, using a Service Worker or local server. No GitHub Releases download is required.

Serve WASM as `application/wasm`, JS as `text/javascript`, and provide applicable CORS headers for cross-origin assets. Same-origin CSP: `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; worker-src 'self'`. No eval, new Function or DOM script injection is used. Cross-origin isolation and SharedArrayBuffer are not required by this single-threaded runtime.

## Errors

DSL failures resolve with diagnostics. Operational errors reject with `DrawMotiveError`: stable `code`, optional `cause`, frozen structured `details`. Codes include `INVALID_ARGUMENT`, `INVALID_MANIFEST`, `INVALID_ASSET_URL`, `RESOURCE_NOT_FOUND`, `ASSET_INTEGRITY_MISMATCH`, `ABI_MISMATCH`, `UNSUPPORTED_CAPABILITY`, `INITIALIZATION_FAILED`, `UNSUPPORTED_ENVIRONMENT`, `INVALID_RESPONSE`, `RUNTIME_FAILED`, `INSTANCE_DISPOSED`, `INVALID_ADAPTER`. Cancellation errors have name `AbortError`. Messages and underlying runtime causes are not stable.

## ABI and versioning

ABI 1.0.0 retains GetAbiVersion/GetPackageKind/CountParseDiagnostics and adds GetRuntimeInfo() and Validate(source) on DrawMotive.TextGraph.Bridge.Program. Info returns JSON `{ abiVersion, packageKind, protocolVersion: 1, capabilities }`; Validate returns `{ protocolVersion: 1, valid, diagnostics }`. Wrappers require `textgraph-validate-v1`. This is a managed export/JSON protocol, not a raw WASM pointer ABI.

`generated/wasm-manifest.json` is authoritative; its ESM projection avoids JSON-module browser assumptions. Shipped schemas describe the manifest and validation response. Manifest schema, ABI, protocol and npm versions are separate. Additive exports use capabilities; incompatible wire changes require a new supported version. npm versions and bundled assets are released together. DSL/file-format versions are not frozen by this milestone.

Assets have relative path, media type, byte count and SHA-256. Packaging checks reject missing/extra assets, debug files, hash/projection/version drift. Data assets are also hash-checked before native startup. These checks establish distribution consistency, not authenticated runtime signatures. `privateSource.commit` identifies committed private C# and bridge inputs. Toolchain changes may change bytes; cross-toolchain byte-for-byte reproducibility is not promised.
