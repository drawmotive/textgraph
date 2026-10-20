# Web Worker sample

A module Worker owns the TextGraph runtime and transfers rendered PNG bytes to the page. Edit the DSL and click **Render diagram**. Requires Node.js 22.12+.

From the repository root:

```bash
cd samples/worker
npm ci
npm run dev
```

Open the URL printed by Vite. For production, run `npm run build` followed by `npm run preview`, then deploy the complete `dist/` directory.

The Worker awaits initialization before registering its message handler, then announces readiness. The page terminates the Worker when leaving. Vite emits the Worker as ESM; asset copying runs before development and builds. See the [shared setup and deployment guide](../README.md).

The committed lockfile installs `@drawmotive/textgraph@0.3.0`. For explicit local SDK testing, see [development tarball preparation](../README.md#test-a-development-sdk-tarball).
