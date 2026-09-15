# Changelog

## 0.2.1 — 2026-09-15

- Default React PNG rendering to scale 1, matching the base SDK and native renderer; explicit higher scales remain supported.
- Preserve logical display dimensions when `maxWidth` limits raster resolution, while respecting explicit React image dimensions.
- Retain native source provenance `f5a5e5d027072d1faa79ac9b25d5899d1380fdfd`.

## 0.2.0 — 2026-09-13

- Include parser and inline-group fixes from the verified native source commit.
- Add the optional `/react` entry with DSL-to-image components and shared runtime ownership.
- Add `textgraph-copy-assets` for browser and Worker deployments.
- Add runnable browser, React/Vite, Worker, and Node samples tested against an installed npm tarball.

## 0.1.0-alpha.1

- Render TextGraph diagrams as PNG bytes or base64.
- Configure output scale, padding, and maximum width.
- Validate diagram source with structured diagnostics.
- Run in Node.js, browsers, and Web Workers.
- Include Noto Sans and Fuzzy Bubbles fonts with the default theme.
