# @drawmotive/textgraph

TextGraph 的无 UI JavaScript / TypeScript 工具包。当前提供真实 WASM 解析与语义验证，支持 Node.js、浏览器和 module Web Worker。

```javascript
import { initializeTextGraph } from '@drawmotive/textgraph';
const runtime = await initializeTextGraph();
try {
  const result = await runtime.validate('A -> B');
  console.log(result.valid, result.diagnostics);
} finally {
  await runtime.dispose();
}
```

[API、ABI、加载与兼容契约](docs/api-v1.md) · [Node 示例](examples/node.mjs) · [浏览器示例](examples/browser.html) · [Worker 示例](examples/worker.js)

Node ≥22。包内包含 Release WASM，使用者无需私有 C# 或 GitHub Releases。浏览器需部署完整 generated/wasm 目录；通过 resolveAsset 配置资源位置。Worker 由宿主创建，Node worker_threads 使用 /node 入口。

validate 仅判断解析与语义引用有效性。布局、渲染、文件读写和公开 AST 属后续里程碑。包仍为 private 开发候选，公开发布按独立发布清单执行。

## 独立验证

```console
npm ci
npm test
npm run build
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
npm pack
```

测试使用已提交 Release WASM；重新生成 WASM 需要私有总仓。Debug 产物位于忽略的 .local/。

## 许可证

公共 JS/TypeScript 使用 MIT。私有 C# 源码不随包公开；WASM 及第三方依赖再分发许可按发布审计和相应声明处理。
