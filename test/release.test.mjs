import assert from "node:assert/strict";
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { releaseChannel, assertRegistryState, assertPublishedState } from "../scripts/release-policy.mjs";
import { prepareVersion, verifyPackage, verifyArtifact, verifyPackList } from "../scripts/release.mjs";
import { publishRelease, waitForPublication, readPublicRegistry } from "../scripts/publish-release.mjs";

const packageRoot = path.resolve(import.meta.dirname, "..");
const readJson = async file => JSON.parse(await readFile(file, "utf8"));

test("alpha releases never select the default installation channel", () => {
  assert.deepEqual(releaseChannel("0.1.0-alpha.1"), { version: "0.1.0-alpha.1", tag: "alpha", gitTag: "textgraph-v0.1.0-alpha.1" });
  assert.equal(releaseChannel("0.1.0").tag, "latest");
  for (const version of ["0.0.0-development", "v1.0.0", "1.0.0-beta.1", "01.0.0", "1.0.0-alpha.01", "1.0.0+build", "1.0.0-alpha.1\n"]) {
    assert.throws(() => releaseChannel(version), /version/i, version);
  }
});

test("registry preflight preserves stable defaults and refuses channel downgrades", () => {
  assert.doesNotThrow(() => assertRegistryState("0.1.0-alpha.1", null));
  const registry = { "dist-tags": { latest: "0.1.0", alpha: "0.2.0-alpha.2" }, versions: { "0.1.0": {}, "0.2.0-alpha.2": {} } };
  assert.doesNotThrow(() => assertRegistryState("0.2.0-alpha.3", registry));
  assert.throws(() => assertRegistryState("0.2.0-alpha.1", registry), /older/i);
  assert.throws(() => assertRegistryState("0.0.9", registry), /older/i);
  assert.doesNotThrow(() => assertRegistryState("0.2.0-alpha.3", { ...registry, "dist-tags": { latest: "0.2.0-alpha.2" } }));
  assert.doesNotThrow(() => assertRegistryState("0.2.0", { ...registry, "dist-tags": { latest: "0.2.0-alpha.2" } }));
  assert.throws(() => assertRegistryState("0.2.0-alpha.3", { ...registry, "dist-tags": { latest: "9.0.0" } }), /latest/i);
});

test("publication postflight detects alpha promotion and verifies exact registry bytes", () => {
  const release = { ...releaseChannel("0.1.0-alpha.1"), integrity: "sha512-example" };
  const published = { "dist-tags": { alpha: release.version }, versions: { [release.version]: { dist: { integrity: release.integrity } } } };
  assert.doesNotThrow(() => assertPublishedState(release, null, published));
  assert.doesNotThrow(() => assertPublishedState(release, null, { ...published, "dist-tags": { ...published["dist-tags"], latest: release.version } }));
  assert.throws(() => assertPublishedState({ ...release, integrity: "sha512-wrong" }, null, published), /integrity/i);
  const before = { "dist-tags": { latest: "0.0.1" }, versions: { "0.0.1": {} } };
  assert.throws(() => assertPublishedState(release, before, published), /latest/i);
});

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "textgraph-release-test-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, "generated"));
  for (const file of ["package.json", "package-lock.json", "generated/wasm-manifest.json", "generated/wasm-manifest.js"]) {
    await cp(path.join(packageRoot, file), path.join(root, file));
  }
  return root;
}

test("version preparation synchronizes metadata without relabeling native provenance or ABI", async t => {
  const root = await fixture(t);
  const original = await readJson(path.join(root, "generated/wasm-manifest.json"));
  await prepareVersion(root, "0.1.0-alpha.1");
  const pkg = await readJson(path.join(root, "package.json"));
  const lock = await readJson(path.join(root, "package-lock.json"));
  const manifest = await readJson(path.join(root, "generated/wasm-manifest.json"));
  assert.equal(pkg.version, "0.1.0-alpha.1");
  assert.notEqual(pkg.private, true);
  assert.deepEqual(pkg.publishConfig, { access: "public", registry: "https://registry.npmjs.org/", tag: "alpha" });
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[""].version, pkg.version);
  assert.deepEqual(manifest, { ...original, packageVersion: pkg.version });
  assert.deepEqual((await import(pathToFileURL(path.join(root, "generated/wasm-manifest.js")))).default, manifest);
  await prepareVersion(root, "0.1.0");
  assert.equal((await readJson(path.join(root, "package.json"))).publishConfig.tag, "latest");
});

test("invalid preparation leaves package metadata untouched", async t => {
  const root = await fixture(t);
  const before = await readFile(path.join(root, "package.json"), "utf8");
  await assert.rejects(prepareVersion(root, "0.1.0-beta.1"), /version/i);
  assert.equal(await readFile(path.join(root, "package.json"), "utf8"), before);
});

test("release verification rejects drift before packing", async t => {
  const root = await fixture(t);
  await prepareVersion(root, "0.1.0-alpha.1");
  await assert.rejects(verifyPackage(root, "textgraph-v0.2.0"), /tag/i);
  const manifest = await readJson(path.join(root, "generated/wasm-manifest.json"));
  manifest.packageVersion = "0.2.0";
  await writeFile(path.join(root, "generated/wasm-manifest.json"), JSON.stringify(manifest));
  await assert.rejects(verifyPackage(root), /manifest/i);
});

test("asset verification catches a changed runtime before publication", async t => {
  const root = await fixture(t);
  await prepareVersion(root, "0.1.0-alpha.1");
  await mkdir(path.join(root, "generated/wasm"));
  const manifest = await readJson(path.join(root, "generated/wasm-manifest.json"));
  const bytes = Buffer.from("runtime");
  manifest.assets = [{ path: "wasm/runtime.wasm", bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex") }];
  await writeFile(path.join(root, "generated/wasm/runtime.wasm"), bytes);
  await writeFile(path.join(root, "generated/wasm-manifest.json"), JSON.stringify(manifest));
  await writeFile(path.join(root, "generated/wasm-manifest.js"), `export default ${JSON.stringify(manifest, null, 2)};\n`);
  await verifyPackage(root);
  await writeFile(path.join(root, "generated/wasm/runtime.wasm"), "changed");
  await assert.rejects(verifyPackage(root), /hash mismatch/i);
});

async function artifact(t) {
  const directory = await mkdtemp(path.join(tmpdir(), "textgraph-release-artifact-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const bytes = Buffer.from("verified tarball fixture");
  const release = { ...releaseChannel("0.1.0-alpha.1"), name: "@drawmotive/textgraph", filename: "drawmotive-textgraph-0.1.0-alpha.1.tgz", integrity: `sha512-${createHash("sha512").update(bytes).digest("base64")}` };
  await writeFile(path.join(directory, release.filename), bytes);
  await writeFile(path.join(directory, "release.json"), JSON.stringify(release));
  return { directory, release };
}

test("artifact integrity and release identity are checked before any registry write", async t => {
  const { directory, release } = await artifact(t);
  assert.deepEqual(await verifyArtifact(directory, release), release);
  await assert.rejects(verifyArtifact(directory, { ...release, version: "0.1.0" }), /version mismatch/i);
  await writeFile(path.join(directory, release.filename), "tampered");
  await assert.rejects(verifyArtifact(directory), /integrity mismatch/i);
});

test("publication sends an explicit alpha tag and checks registry state afterward", async t => {
  const { directory, release } = await artifact(t);
  let published = false;
  let reads = 0;
  const before = { "dist-tags": { latest: "0.0.1" }, versions: { "0.0.1": {} } };
  const readRegistry = async () => {
    reads++;
    return published ? { "dist-tags": { latest: "0.0.1", alpha: release.version }, versions: { ...before.versions, [release.version]: { dist: { integrity: release.integrity } } } } : before;
  };
  const run = async (executable, args) => {
    assert.equal(executable, "npm");
    assert.deepEqual(args, ["publish", path.join(directory, release.filename), "--ignore-scripts", "--access", "public", "--tag", "alpha", "--registry", "https://registry.npmjs.org/"]);
    published = true;
    return { stdout: "published" };
  };
  const result = await publishRelease({ directory, expected: release, readRegistry, run });
  assert.equal(result.status, "published");
  assert.equal(reads, 2);
});

test("reruns accept identical publication and refuse immutable version collisions", async t => {
  const { directory, release } = await artifact(t);
  const run = async () => assert.fail("An existing version must never be republished");
  const registry = { "dist-tags": { alpha: release.version, latest: "0.0.1" }, versions: { "0.0.1": {}, [release.version]: { dist: { integrity: release.integrity } } } };
  assert.equal((await publishRelease({ directory, expected: release, readRegistry: async () => registry, run })).status, "already-published");
  registry.versions[release.version].dist.integrity = "sha512-other";
  await assert.rejects(publishRelease({ directory, expected: release, readRegistry: async () => registry, run }), /integrity/i);
});

test("dry run never performs a registry write", async t => {
  const { directory, release } = await artifact(t);
  let calls = 0;
  const result = await publishRelease({ directory, expected: release, dryRun: true, readRegistry: async () => ({ "dist-tags": { latest: "0.0.1" }, versions: { "0.0.1": {} } }), run: async (_cmd, args) => {
    calls++;
    assert.equal(args.at(-1), "--dry-run");
    return { stdout: "dry run" };
  } });
  assert.equal(calls, 1);
  assert.equal(result.status, "dry-run");
});

test("registry reads request install metadata when the full package document is unavailable", async () => {
  const originalFetch = globalThis.fetch;
  const packument = { "dist-tags": { alpha: "0.1.0-alpha.1" }, versions: { "0.1.0-alpha.1": {} } };
  globalThis.fetch = async (url, options) => {
    if (url.endsWith("/dist-tags")) return Response.json({ alpha: "0.1.0-alpha.1" });
    assert.equal(url, "https://registry.npmjs.org/@drawmotive%2ftextgraph");
    return options.headers.Accept === "application/vnd.npm.install-v1+json"
      ? Response.json(packument) : Response.json({ error: "Not found" }, { status: 404 });
  };
  try { assert.deepEqual(await readPublicRegistry(), packument); }
  finally { globalThis.fetch = originalFetch; }
});

test("registry checks use live dist-tags instead of a cached default in install metadata", async () => {
  const originalFetch = globalThis.fetch;
  const version = "0.1.0-alpha.1";
  globalThis.fetch = async url => url.endsWith("/dist-tags")
    ? Response.json({ alpha: version })
    : Response.json({ "dist-tags": { alpha: version, latest: version }, versions: { [version]: {} } });
  try { assert.deepEqual((await readPublicRegistry())["dist-tags"], { alpha: version }); }
  finally { globalThis.fetch = originalFetch; }
});

test("alpha bootstrap accepts npm default and reruns without tag changes or republication", async t => {
  const { directory, release } = await artifact(t);
  let registry = null;
  let writes = 0;
  const run = async (_cmd, args) => {
    assert.equal(args[0], "publish");
    assert.equal(args[args.indexOf("--tag") + 1], "alpha");
    writes++;
    registry = { "dist-tags": { alpha: release.version, latest: release.version }, versions: { [release.version]: { dist: { integrity: release.integrity } } } };
  };
  assert.equal((await publishRelease({ directory, expected: release, readRegistry: async () => registry, run })).status, "published");
  assert.equal((await publishRelease({ directory, expected: release, readRegistry: async () => registry, run })).status, "already-published");
  assert.equal(writes, 1);
});

test("publication never removes a preexisting stable default or an unrelated latest", async t => {
  const { directory, release } = await artifact(t);
  for (const [before, newLatest, integrity] of [
    [{ "dist-tags": { latest: "0.0.1" }, versions: { "0.0.1": {} } }, release.version, release.integrity],
    [null, "0.1.0-alpha.2", release.integrity],
    [null, release.version, "sha512-different"],
  ]) {
    let registry = before;
    await assert.rejects(publishRelease({ directory, expected: release, readRegistry: async () => registry, run: async (_cmd, args) => {
      assert.equal(args[0], "publish", "Unsafe state must never trigger tag removal");
      registry = { "dist-tags": { alpha: release.version, latest: newLatest }, versions: { ...before?.versions, [release.version]: { dist: { integrity } } } };
    } }), /latest|integrity/i);
  }
});

test("postflight waits only for propagation and never retries an unsafe registry state", async t => {
  const { release } = await artifact(t);
  const after = { "dist-tags": { alpha: release.version }, versions: { [release.version]: { dist: { integrity: release.integrity } } } };
  const snapshots = [null, { ...after, "dist-tags": {} }, after];
  let waits = 0;
  await waitForPublication(release, null, async () => snapshots.shift(), async () => { waits++; });
  assert.equal(waits, 2);
  const noWait = async () => assert.fail("Unsafe publication must fail immediately");
  await assert.rejects(waitForPublication(release, { "dist-tags": { latest: "0.0.1" }, versions: { "0.0.1": {} } }, async () => ({ ...after, "dist-tags": { latest: release.version } }), noWait), /latest/i);
  await assert.rejects(waitForPublication(release, null, async () => ({ ...after, versions: { [release.version]: { dist: { integrity: "wrong" } } } }), noWait), /integrity/i);
  await assert.rejects(waitForPublication(release, null, async () => null, async () => {}), /not visible/i);
  const stableBefore = { "dist-tags": { latest: "0.0.1" }, versions: { "0.0.1": {} } };
  const stableSnapshots = [null, { ...after, "dist-tags": { alpha: release.version, latest: "0.0.1" }, versions: { ...after.versions, "0.0.1": {} } }];
  await waitForPublication(release, stableBefore, async () => stableSnapshots.shift(), async () => {});
});

test("tarball inspection excludes private source and requires font licenses", () => {
  const release = { ...releaseChannel("0.1.0-alpha.1"), name: "@drawmotive/textgraph" };
  const packed = { ...release, filename: "drawmotive-textgraph-0.1.0-alpha.1.tgz", files: ["package.json", "LICENSE", "README.md", "generated/wasm-manifest.json", "generated/wasm-manifest.js", "generated/wasm/NotoSans-LICENSE.txt", "generated/wasm/FuzzyBubbles-LICENSE.txt"].map(path => ({ path })) };
  assert.doesNotThrow(() => verifyPackList(packed, release));
  assert.throws(() => verifyPackList({ ...packed, files: [...packed.files, { path: "src/secret.cs" }] }, release), /Unpublishable/i);
  assert.throws(() => verifyPackList({ ...packed, files: packed.files.slice(0, -1) }, release), /license/i);
});
