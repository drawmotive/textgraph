import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { createRenderingExecutor } from "../src/runtime/render-resources.js";
import { normalizeFontAssets, normalizeLanguagePacks } from "../src/runtime/language-packs.js";

const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const base = new Map([["wasm/theme.css", new TextEncoder().encode("theme")], ["wasm/base.ttf", new Uint8Array([1])]]);
const font = (id, language, point) => ({ id, family: id, path: `${id}.ttf`, bytes: 1, sha256: hash(new Uint8Array([point % 255])), languages: [language], coverage: [[point, point]] });
const entries = [font("chinese", "zh", 0x4e2d), font("japanese", "ja", 0x3042), font("emoji", "emoji", 0x1f600)];
const catalog = { schemaVersion: 1, fonts: entries };
const manifest = { capabilities: ["textgraph-fonts-v1"], rendering: { theme: "wasm/theme.css", fonts: [{ family: "base", asset: "wasm/base.ttf" }] }, assets: [...base].map(([path, bytes]) => ({ path, bytes: bytes.length, sha256: hash(bytes) })) };
const ok = { protocolVersion: 1, success: true, diagnostics: [] };
const request = source => JSON.stringify({ protocolVersion: 1, operation: "render", source });
function fixture(options = {}, overrides = {}) {
  const reads = [], calls = [], installed = new Set();
  const execute = createRenderingExecutor({ manifest, options: { ...options, languagePacks: normalizeLanguagePacks(options.languagePacks), fontAssets: normalizeFontAssets(options.fontAssets), resolveAsset: a => new URL(a.path, "https://site.test/") },
    readAsset: async (item, context) => {
      reads.push(item.url.href);
      if (overrides.read) { const result = await overrides.read(item, context); if (result) return result; }
      if (base.has(item.asset.path)) return new Response(base.get(item.asset.path));
      if (item.url.pathname.endsWith("font-catalog.json")) return Response.json(catalog);
      const entry = entries.find(e => item.url.pathname.endsWith(e.path));
      assert.ok(entry, item.url.href);
      return new Response(new Uint8Array([entry.coverage[0][0] % 255]));
    },
    execute: json => {
      const command = JSON.parse(json); calls.push(command);
      if (command.operation === "install-fonts") for (const font of command.fonts) installed.add(font.family);
      if (command.operation === "prepare-fonts") {
        if (command.source === "invalid") return JSON.stringify({ ...ok, success: false, diagnostics: [{ severity: "error", stage: "parse", code: "TG_PARSE_ERROR", message: "invalid" }], fontRuns: [] });
        return JSON.stringify({ ...ok, fontRuns: entries.filter(e => command.source.includes(String.fromCodePoint(e.coverage[0][0]))).map(e => ({ text: String.fromCodePoint(e.coverage[0][0]), language: e.languages[0], missing: !installed.has(e.family) })) });
      }
      return JSON.stringify(ok);
    },
  });
  return { execute, reads, calls, installed };
}

test("local catalog and font bytes load only for encountered text; installed fonts survive edits", async () => {
  const f = fixture({ fontAssets: { catalog: new URL("https://site.test/fonts/font-catalog.json"), fallback: false } });
  await f.execute(request("English 123"));
  assert.equal(f.reads.length, 2);
  await f.execute(request("中"));
  assert.deepEqual(f.reads.slice(2), ["https://site.test/fonts/font-catalog.json", `https://site.test/fonts/chinese.ttf?v=${entries[0].sha256}`]);
  await f.execute(request("あ"));
  await f.execute(request("😀"));
  await f.execute(request("中あ😀"));
  assert.equal(f.reads.length, 6);
  assert.equal(f.calls.filter(c => c.operation === "configure").length, 1);
  assert.equal(f.calls.filter(c => c.operation === "install-fonts").length, 3);
  assert.ok(f.calls.findIndex(c => c.operation === "install-fonts") < f.calls.findIndex(c => c.operation === "render" && c.source === "中"));
});

test("unconfigured online host falls back to staging only on demand; offline host never does", async () => {
  const online = fixture();
  await online.execute(request("English"));
  assert.ok(online.reads.every(url => url.startsWith("https://site.test/")));
  await online.execute(request("中"));
  assert.deepEqual(online.reads.slice(2), ["https://staging.drawmotive.com/static/font-catalog.json", `https://staging.drawmotive.com/static/chinese.ttf?v=${entries[0].sha256}`]);
  const offline = fixture({ fontAssets: { fallback: false } });
  await offline.execute(request("中"));
  assert.equal(offline.reads.length, 2);
});

test("official descriptors are lazy, verified, and suppress implicit remote lookup", async () => {
  const f = fixture({ languagePacks: [{ fonts: [{ ...entries[0], source: new URL("file:///fonts/chinese.ttf") }], fallbackFamilies: ["chinese"] }] });
  await f.execute(request("English"));
  assert.equal(f.reads.length, 2);
  await f.execute(request("中"));
  assert.deepEqual(f.reads.slice(2), ["file:///fonts/chinese.ttf"]);
  await f.execute(request("あ"));
  assert.equal(f.reads.length, 3);
});

test("invalid diagrams perform no optional font I/O", async () => {
  const f = fixture();
  const result = JSON.parse(await f.execute(request("invalid")));
  assert.equal(result.success, false);
  assert.equal(f.reads.length, 2);
  assert.equal(f.calls.some(c => c.operation === "render"), false);
});

test("explicit matching font is usable without reading an unavailable host catalog", async () => {
  const f = fixture({ languagePacks: [{ fonts: [{ ...entries[0], source: new URL("file:///fonts/chinese.ttf") }], fallbackFamilies: ["chinese"] }], fontAssets: { catalog: new URL("https://unavailable.test/font-catalog.json") } }, { read: item => {
    assert.notEqual(item.url.hostname, "unavailable.test");
  } });
  await f.execute(request("中"));
  assert.deepEqual(f.reads.slice(2), ["file:///fonts/chinese.ttf"]);
});

test("official descriptor integrity also applies when using an older eager runtime", async () => {
  const execute = createRenderingExecutor({
    manifest: { ...manifest, capabilities: [] },
    options: { languagePacks: normalizeLanguagePacks([{ fonts: [{ ...entries[0], source: new Uint8Array([0]) }] }]) },
    readAsset: async item => new Response(base.get(item.asset.path)),
    execute: () => { throw new Error("Corrupt font must not reach native configuration"); },
  });
  await assert.rejects(execute(request("中")), { code: "ASSET_INTEGRITY_MISMATCH" });
});

test("explicit fallback order selects the candidate before font declaration order", async () => {
  const second = { ...entries[0], family: "second", source: new URL("file:///fonts/chinese.ttf") };
  const first = { ...entries[0], source: new URL("file:///fonts/chinese.ttf") };
  const f = fixture({ languagePacks: [{ fonts: [first, second], fallbackFamilies: ["second", "chinese"] }] });
  await f.execute(request("中"));
  const installations = f.calls.filter(c => c.operation === "install-fonts");
  assert.equal(installations[0].fonts[0].family, "second");
  assert.deepEqual(installations[0].fallbackFamilies, ["second"]);
});

test("corrupt local fonts do not fall back or install and can recover on the next call", async () => {
  let corrupt = true;
  const f = fixture({ fontAssets: { catalog: new URL("https://site.test/fonts/font-catalog.json") } }, { read: item => item.url.pathname.endsWith("chinese.ttf") && corrupt ? new Response(new Uint8Array([0])) : undefined });
  await assert.rejects(f.execute(request("中")), { code: "ASSET_INTEGRITY_MISMATCH" });
  assert.equal(f.installed.size, 0);
  assert.equal(f.calls.at(-1).operation, "cancel-prepare");
  assert.ok(f.reads.every(url => url.startsWith("https://site.test/")));
  corrupt = false;
  await f.execute(request("中"));
  assert.equal(f.installed.size, 1);
});

test("abort cleans native preparation and retry installs missing font once", async () => {
  const controller = new AbortController();
  let abort = true;
  const f = fixture({}, { read: (item, context) => {
    if (item.url.pathname.endsWith("chinese.ttf") && abort) {
      assert.equal(context.signal, controller.signal); controller.abort();
    }
  } });
  await assert.rejects(f.execute(request("中"), { signal: controller.signal }), { name: "AbortError" });
  assert.equal(f.installed.size, 0);
  assert.equal(f.calls.at(-1).operation, "cancel-prepare");
  abort = false;
  await f.execute(request("中"));
  assert.equal(f.installed.size, 1);
});

test("font configuration validates without reading resources and detaches caller metadata", () => {
  const url = new URL("https://example.test/font-catalog.json");
  const normalized = normalizeFontAssets({ catalog: url, fallback: false });
  url.pathname = "/changed";
  assert.equal(normalized.catalog.pathname, "/font-catalog.json");
  for (const value of [null, [], { catalog: "relative.json" }, { fallback: true }, { catalog: new URL("javascript:0") }]) assert.throws(() => normalizeFontAssets(value), { code: "INVALID_ARGUMENT" });
  const raw = { ...entries[0], source: new URL("https://example.test/a.ttf"), coverage: [[0x4e00, 0x9fff]] };
  const packs = normalizeLanguagePacks([{ fonts: [raw] }]);
  raw.coverage[0][0] = 0;
  assert.equal(packs[0].fonts[0].coverage[0][0], 0x4e00);
});
