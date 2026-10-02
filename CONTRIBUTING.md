# Contributing to TextGraph

Use the [shared issue tracker](https://github.com/drawmotive/textgraph/issues)
for SDK, font, sample and integration bugs or proposals. Include the affected
version, Node/npm or browser version, OS, expected result and a small reproducer.

Use Node.js 22 or 24 and npm 10 or 11. Vite samples require Node 22.12+ on the
22 line. Linux, Windows and macOS are supported build targets; see the
[README support matrix](README.md#supported-environments) for verification limits.

From a standalone public checkout, use the committed registry lock:

```bash
npm ci
npm test
npm run build
npm pack
```

`npm pack` creates a local npm archive and runs the existing release and
package checks. It does not publish. The committed runtime is sufficient;
no private checkout, C# build, credentials or sibling repository is needed.
Keep dependency versions and `package-lock.json` together. Use `npm install`
only when intentionally changing dependencies; do not replace public registry
dependencies with local paths or workspace links.

For browser/runtime changes, install the supported Playwright engines and run:

```bash
npx playwright install chromium firefox webkit
npm run test:browser
npm run test:samples
```

Linux CI uses `--with-deps` when installing browsers; other platforms use
their normal Playwright installation. Sample preparation intentionally creates
a local SDK tarball for testing, as described in [samples](samples/README.md).
It is not a public release input.

The optional font package has its own lock and commands. Run from
`language-packs/`:

```bash
npm ci
npm test
npm run build
npm pack
```

Public font builds validate committed assets. Their private producer command
is not required to build this checkout. Preserve OFL notices, provenance and
hash manifests when changing or copying fonts. See [NOTICE](NOTICE).

Keep pull requests focused, describe the behavior change and report the checks
actually run. Include a small regression for behavior fixes; documentation
changes need link and command review. Do not rewrite compiled runtime bytes
or their provenance to bypass integrity or release checks. Follow the
[MIT license](LICENSE) and the separate dependency/font terms.
