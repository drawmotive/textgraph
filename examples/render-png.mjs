import { writeFile } from "node:fs/promises";
import { initializeTextGraph } from "@drawmotive/textgraph/node";

const textgraph = await initializeTextGraph();
try {
  const result = await textgraph.renderPng(process.argv[2] ?? "A -> B");
  if (result.success) await writeFile(process.argv[3] ?? "diagram.png", result.png);
  else { console.error(result.diagnostics); process.exitCode = 1; }
} finally {
  await textgraph.dispose();
}
