import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";
import { command } from "./command.mjs";
import { assertRegistryState, assertPublishedState } from "./release-policy.mjs";
import { packageRoot, verifyArtifact, verifyPackage } from "./release.mjs";

/** Registry absence is valid for a first release; other failures must stop publishing. */
export async function readPublicRegistry() {
  const response = await fetch("https://registry.npmjs.org/@drawmotive%2ftextgraph", {
    headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(30000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`npm registry returned HTTP ${response.status}`);
  return response.json();
}

/** Registry reads may lag a successful write; unsafe visible state is never retried. */
export async function waitForPublication(release, before, readRegistry, delay = setTimeout) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const after = await readRegistry();
    assertRegistryState(release.version, after);
    if (after && release.tag === "alpha" && before?.["dist-tags"]?.latest !== after["dist-tags"]?.latest) {
      throw new Error("Alpha publication changed latest; inspect registry state before continuing.");
    }
    const published = after?.versions?.[release.version];
    if (published && published.dist?.integrity !== release.integrity) throw new Error("Published tarball integrity mismatch.");
    if (published && after?.["dist-tags"]?.[release.tag] === release.version) {
      assertPublishedState(release, before, after);
      return;
    }
    if (attempt < 5) await delay(2000);
  }
  throw new Error("Publication is not visible in registry reads yet. Do not republish blindly; inspect the version and retry verification.");
}

/** One immutable tarball is used for local bootstrap and CI trusted publishing. */
export async function publishRelease({ directory, expected, dryRun = false, readRegistry = readPublicRegistry, run = command }) {
  const release = await verifyArtifact(directory, expected);
  const before = await readRegistry();
  assertRegistryState(release.version, before);
  if (before?.versions?.[release.version]) {
    assertPublishedState(release, before, before);
    return { ...release, status: "already-published" };
  }
  const args = ["publish", path.join(directory, release.filename), "--ignore-scripts", "--access", "public", "--tag", release.tag, "--registry", "https://registry.npmjs.org/"];
  if (dryRun) args.push("--dry-run");
  await run("npm", args, packageRoot, { interactive: !dryRun });
  if (!dryRun) await waitForPublication(release, before, readRegistry);
  return { ...release, status: dryRun ? "dry-run" : "published" };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== "--dry-run")) throw new Error("Usage: node scripts/publish-release.mjs [--dry-run]");
  const expected = await verifyPackage(packageRoot, process.env.RELEASE_TAG);
  const result = await publishRelease({ directory: path.join(packageRoot, ".release"), expected, dryRun: args.includes("--dry-run") });
  console.log(JSON.stringify(result, null, 2));
}
