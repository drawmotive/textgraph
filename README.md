# `@drawmotive/textgraph`

TextGraph DSL 以及无 UI 的解析、布局、渲染和 DrawMotive 文件处理工具。

该仓库目前处于基础结构阶段，尚未包含可用的 WASM 运行时，因此禁止发布。接入稳定公共 API、Release WASM 和独立构建验证后才会开放发布。

私有总仓生成的本地 Debug WASM 位于 `.local/`，仅用于联调且不会进入 Git 或 npm 包。正式 Release WASM 将由受验证的发布流程写入 `generated/wasm/`。

## 开发命令

```console
npm ci
npm test
npm run build
npm pack --dry-run
```

## 许可证

代码和随包发布的产物使用 MIT 许可证。
