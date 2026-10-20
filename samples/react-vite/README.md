# React sample

The `TextGraph` element takes a `source` DSL string and renders a PNG. Editing the textarea updates that prop. The app uses React Strict Mode and shares one runtime through `TextGraphProvider`. Requires Node.js 22.12+.

From the repository root:

```bash
cd samples/react-vite
npm ci
npm run dev
```

Open the URL printed by Vite. For production, run `npm run build` followed by `npm run preview`, then deploy the complete `dist/` directory.

React support is the `@drawmotive/textgraph/react` entry point of the same SDK package. Asset copying runs automatically before development and production builds. See the [shared setup and deployment guide](../README.md).

The committed lockfile installs `@drawmotive/textgraph@0.3.0`. For explicit local SDK testing, see [development tarball preparation](../README.md#test-a-development-sdk-tarball).
