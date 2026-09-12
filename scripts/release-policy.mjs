/** Select explicit publish tags; npm may also assign latest on first publication. */
export function releaseChannel(version) {
  if (typeof version !== "string" || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-alpha\.(0|[1-9]\d*))?$/.test(version) || version.trim() !== version) {
    throw new Error("Release version must be X.Y.Z or X.Y.Z-alpha.N, without a prefix or build metadata.");
  }
  return { version, tag: version.includes("-") ? "alpha" : "latest", gitTag: `textgraph-v${version}` };
}

function compareVersions(left, right) {
  const parts = value => value.split(/\.|-alpha\./).map(BigInt);
  const a = parts(left);
  const b = parts(right);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  if (a.length !== b.length) return a.length === 3 ? 1 : -1;
  return a[3] === b[3] ? 0 : a[3] > b[3] ? 1 : -1;
}

/** Reject broken defaults and accidental channel rollback before an immutable publish. */
export function assertRegistryState(version, packument) {
  const release = releaseChannel(version);
  const tags = packument?.["dist-tags"] ?? {};
  if (tags.latest && !packument.versions?.[tags.latest]) {
    throw new Error("Registry latest must reference an existing version.");
  }
  if (tags.latest) releaseChannel(tags.latest);
  if (tags[release.tag]) {
    releaseChannel(tags[release.tag]);
    if (compareVersions(version, tags[release.tag]) < 0) throw new Error(`Refusing an older ${release.tag} release.`);
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
export function assertPublishedState(release, before, after) {
  assertRegistryState(release.version, after);
  if (after?.versions?.[release.version]?.dist?.integrity !== release.integrity) throw new Error("Published tarball integrity does not match the verified artifact.");
  if (after?.["dist-tags"]?.[release.tag] !== release.version) throw new Error(`Published ${release.tag} does not reference the release version.`);
  assertLatestPreserved(release, before, after);
}
