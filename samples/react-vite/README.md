# React sample

The `TextGraph` element takes a `source` DSL string and renders a PNG. Editing the textarea updates that prop. The app uses React Strict Mode and shares one runtime through `TextGraphProvider`. Requires Node.js 22.12+.

From the repository root:

```bash
node samples/prepare.mjs react-vite
cd samples/react-vite
npm run dev
```

Open the URL printed by Vite. For production, run `npm run build` followed by `npm run preview`, then deploy the complete `dist/` directory.

React support is the `@drawmotive/textgraph/react` entry point of the same SDK package. Asset copying runs automatically before development and production builds. See the [shared setup and deployment guide](../README.md).
