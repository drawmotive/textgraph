# Browser sample

[Open the live browser example](https://textgraph.dev/examples/textgraph/) to edit source and see the rendered PNG immediately, without cloning this repository.

Plain HTML and JavaScript render editable TextGraph source to a PNG. Vite serves and bundles the app. Requires Node.js 22.12+.

From the repository root:

```bash
node samples/prepare.mjs browser
cd samples/browser
npm run dev
```

Open the URL printed by Vite. Edit the DSL and click **Render diagram**. For production, run `npm run build` followed by `npm run preview`, then deploy the complete `dist/` directory.

Both development and build automatically copy the installed SDK's WASM, scripts, fonts and theme into `public/textgraph/wasm`. See the [shared setup and deployment guide](../README.md).
