# TextGraph Fonts

Optional local font assets for Chinese, Japanese, and color emoji. The package contains no WASM runtime and does not download fonts during installation. Importing its metadata does not read font binaries. Compatible TextGraph renderers load a font only when displayed text needs it.

## Supported environments

| Layer | Supported environment | Verification boundary |
| --- | --- | --- |
| Package build and font-copy CLI | Node.js 22 or 24; npm 10 or 11 on Linux, Windows and macOS | CI targets all three systems with both Node lines |
| Rendering | Matching TextGraph SDK 0.2.2-alpha.2 in Node, browser or module Worker | Font support follows the renderer; fonts do not supply their own runtime |
| Browser deployment | SDK-supported Chromium, Firefox and WebKit with HTTPS or localhost | These are SDK test engines, not separate font-package browser or device certification |

The standalone font-package audit on 2026-10-01 ran Linux x64, Node 22.23.2
and npm 10.9.8. It did not execute Windows/macOS or Node 24 checks. Vite hosts
require Node 22.12+ on the 22 line.

```bash
npm install @drawmotive/textgraph@0.2.2-alpha.2 @drawmotive/textgraph-fonts@0.2.2-alpha.2
```

```javascript
import { initializeTextGraph } from '@drawmotive/textgraph';
import { languagePacks } from '@drawmotive/textgraph-fonts';

const renderer = await initializeTextGraph({ languagePacks });
try {
  const result = await renderer.renderPng('A: 开始\nB: 日本語 😀\nA -> B');
} finally {
  await renderer.dispose();
}
```

`zhCN`, `ja`, and `emoji` are also exported individually. The existing `zhCN` API is preserved. `zhCN` includes common simplified and traditional Chinese characters using Simplified Chinese regional glyphs; it does not promise Taiwan/Hong Kong typography or every Unicode character. `ja` supplies Japanese regional glyphs and kana. Shared Han characters alone cannot determine a language: use the renderer's language hint when Japanese regional glyphs are needed for Han-only text. Native glyph and shaping checks remain authoritative, especially for combined emoji sequences.

## Browser and offline deployment

Copy the complete distribution during the host build:

```bash
npx textgraph-copy-fonts public/textgraph-fonts
```

The destination contains flat font files, `font-catalog.json`, `files.json`, licenses, and `provenance.json`. Configure the renderer's font assets with the deployed catalog URL. The catalog paths are relative to its directory; copying assets does not preload fonts in the browser. `fontCatalog`, `fontCatalogUrl`, and `fontAssetsUrl` are exported for host integration.

Offline distributions must include this directory or the installed npm package and disable remote fallback in the renderer. A website cannot load an uncached font while its server is unreachable; this package does not install a service worker or change browser caching. The optional package preserves renderer caches and uses stable SHA-256 identities for its assets.

## Asset maintenance

Font bytes originate from the editor's committed static assets. In the DrawMotive repository, run `node tooling/generate-font-assets.mjs` after an intentional asset update; `--check` verifies package and staging copies without rewriting them. Coverage is generated from the actual font's Unicode cmap rather than language-name guesses. No network download occurs in that command.

```bash
npm ci
npm run build
npm test
npm pack
```

Build verifies all bytes, hashes, coverage, provenance, and licenses. Tests include a tarball installation and asset copy with npm offline mode. Each redistributed font uses SIL OFL 1.1; matching copyright/license notices and pinned upstream source revisions are in `assets/`. The small JavaScript distribution helpers use MIT; see `LICENSE`.

[Report font and TextGraph issues on GitHub](https://github.com/drawmotive/textgraph/issues).
See [Contributing](../CONTRIBUTING.md) and [NOTICE](../NOTICE).
Vulnerability reports follow [Security reporting](../SECURITY.md).
