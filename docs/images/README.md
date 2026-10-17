# Public previews

online-order.png is a byte-for-byte copy of the canonical VS Code repository preview, paired with examples/online-order.textgraph. Each public repository owns its image and uses a relative README reference.

In the parent workspace, regenerate with `npm run component -- vscode-editor examples:render`, then run `npm run docs:previews -- sync` and `npm run docs:previews -- check`. Browser and VS Code screenshots come from their real application capture operations, not from the plain diagram render.

The existing service-flow.png and its source remain available as a separate historical example. Public README display on npm must be checked separately from archive inclusion; publication is controller-owned.
