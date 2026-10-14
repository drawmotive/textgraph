import { releaseTag, compareReleaseVersions } from "../.release/release-version.cjs";

/** Explicit targets select historical suffix rules or the numeric release sequence. */
export function releaseChannel(version, options = {}) {
  return { version, tag: releaseTag(version, options), gitTag: `textgraph-v${version}` };
}

/** Reject broken defaults and accidental channel rollback before an immutable publish. */
export function assertRegistryState(version, packument, options = {}) {
  const release = releaseChannel(version, options);
  const tags = packument?.["dist-tags"] ?? {};
  if (tags.latest && !packument.versions?.[tags.latest]) {
    throw new Error("Registry latest must reference an existing version.");
  }
  for (const tag of new Set(['latest', release.tag])) {
    if (tags[tag] && compareReleaseVersions(version, tags[tag]) < 0) throw new Error(`Refusing an older ${tag} release.`);
  }
  return release;
}

/** Preserve an existing default, accepting npm choosing the first published alpha. */
export function assertLatestPreserved(release, before, after) {
  if (release.tag !== "alpha" || before?.["dist-tags"]?.latest === after?.["dist-tags"]?.latest) return;
  if (before === null && after?.["dist-tags"]?.latest === release.version && after?.["dist-tags"]?.alpha === release.version) return;
  throw new Error("Alpha publication changed an existing latest; inspect registry state before continuing.");
}

/** Verify bytes and channels independently of npm CLI success output. */
export function assertPublishedState(release, before, after, options = {}) {
  assertRegistryState(release.version, after, options);
  if (after?.versions?.[release.version]?.dist?.integrity !== release.integrity) throw new Error("Published tarball integrity does not match the verified artifact.");
  if (after?.["dist-tags"]?.[release.tag] !== release.version) throw new Error(`Published ${release.tag} does not reference the release version.`);
  assertLatestPreserved(release, before, after);
}
