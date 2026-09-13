# Web Worker sample

A module Worker owns the TextGraph runtime and transfers rendered PNG bytes to the page. Edit the DSL and click **Render diagram**. Requires Node.js 22.12+.

From the repository root:

```bash
node samples/prepare.mjs worker
cd samples/worker
npm run dev
```

Open the URL printed by Vite. For production, run `npm run build` followed by `npm run preview`, then deploy the complete `dist/` directory.

The Worker awaits initialization before registering its message handler, then announces readiness. The page terminates the Worker when leaving. Vite emits the Worker as ESM; asset copying runs before development and builds. See the [shared setup and deployment guide](../README.md).
