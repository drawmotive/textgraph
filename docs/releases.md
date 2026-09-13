# Releasing TextGraph

Releases are selected deliberately and published by `.github/workflows/release.yml`. A push to `main` only runs CI. A tag named `textgraph-v<VERSION>` tests, packs, and publishes that version. Manual dispatch accepts an existing release tag for retries.

## Channels

| Version | npm dist-tag | Installation |
| --- | --- | --- |
| `0.1.0-alpha.1` | `alpha` | `npm install @drawmotive/textgraph@alpha` |
| `0.2.0` | `latest` | `npm install @drawmotive/textgraph` |

An exact prerelease version also works: `npm install @drawmotive/textgraph@0.1.0-alpha.1`. npm assigns `latest` on a first publication even when another tag is specified. This default is accepted: `0.1.0-alpha.1` initially owned both `alpha` and `latest`. Subsequent alpha releases update `alpha` and preserve the existing default. A stable release updates `latest`.

No stable release is required before publishing another alpha. The script verifies the existing default and immutable artifact integrity without attempting to delete tags. To graduate an alpha, prepare and publish a new stable version.

The scripts accept stable SemVer and `X.Y.Z-alpha.N`. Other channels require an explicit release-policy change. The shared optional `@drawmotive/textgraph-fonts` package has its own release lifecycle and is not published by this workflow.

## Account setup

1. Use an npm account with permission to publish under `@drawmotive`, with the account protection required by npm.
2. Create the GitHub repository environment `npm`. Restrict deployment refs to `textgraph-v*` tags. Add required reviewers if releases need a second approval.
3. Once the npm package exists, open its Settings and add a GitHub Actions trusted publisher: owner `drawmotive`, repository `textgraph`, workflow filename `release.yml`, environment `npm`.
4. The workflow uses a GitHub-hosted runner, Node.js 22, npm 11.11.1, and `id-token: write`. No long-lived npm token is needed for subsequent releases.

The trusted publisher for `drawmotive/textgraph`, `release.yml`, and environment `npm` is configured. To configure the equivalent account setting from a terminal, use npm 11.15.0+ (the older CLI omits permissions required by the current API):

```bash
npm trust github @drawmotive/textgraph --repo drawmotive/textgraph --file release.yml --env npm --allow-publish --yes
```

Trusted publishing requires npm 11.5.1+ and Node.js 22.14.0+. Publication from a public repository automatically includes provenance. A private repository does not produce public npm provenance; repository visibility is a separate owner decision. See [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/).

## Prepare a version

Native builds belong to the private DrawMotive repository. Commit native source, resource, and bridge changes first, then run there:

```bash
npm run release:textgraph -- 0.2.0
```

This updates the package and lock versions, builds Release assets from the recorded private source commit, generates matching JSON/ESM manifests, updates the root workspace lock, and verifies asset hashes. It does not commit, push, tag, or publish. The `just release-textgraph 0.2.0` alias runs the same command.

For a JavaScript-only release reusing already verified native bytes, run in this package:

```bash
npm run release:prepare -- VERSION_MATCHING_RELEASE_TARGET
npm run release:verify
```

This retains the actual native source provenance. ABI and protocol versions are not npm release numbers. Update the changelog and installation instructions for the chosen channel.

## Verify and pack

Run from a standalone checkout of this package, or use `--workspaces=false` for installation inside the private workspace:

```bash
npm ci
npm run release:pack
npx playwright install --with-deps chromium firefox webkit
npm run test:browser
npm run release:publish -- --dry-run
```

The package is written to `.release/drawmotive-textgraph-<VERSION>.tgz`; `.release/release.json` records its version, channel, and SHA-512 integrity. The publication script uses those exact bytes and verifies registry channels and integrity after publication. Never edit an artifact or its receipt.

Commit the package changes on the task branch, review them, and integrate according to repository policy. Push the package commit before updating and pushing the private parent repository submodule pointer.

## First publication

When the package does not exist yet, its trusted publisher may not be configurable. Bootstrap the verified release once from an authenticated terminal; an initial alpha can also become the npm default:

```bash
npm login --registry=https://registry.npmjs.org/
npm whoami --registry=https://registry.npmjs.org/
npm run release:publish
```

If npm requires a one-time code, run with `NPM_CONFIG_OTP` set in the local terminal. Do not commit credentials or paste tokens into issues, pull requests, or logs. A local bootstrap does not obtain GitHub Actions provenance. Configure the trusted publisher immediately after the package exists.

## Subsequent releases

After preparation, tests, and review, create the tag on the verified package commit:

```bash
git tag -a textgraph-v0.2.0 -m "Release 0.2.0"
git push origin textgraph-v0.2.0
```

The release workflow resolves the tag to a commit, runs Node.js and three-browser tests on Ubuntu, packs the tested checkout, and passes the artifact to the `npm` environment for publication. All CI and release jobs use `ubuntu-latest`; the browser suite covers Chromium, Firefox, and WebKit. Stable releases select `latest` automatically. Never pass a custom dist-tag to bypass the release policy.

## Verify publication and recover

```bash
npm view @drawmotive/textgraph dist-tags --json
npm view @drawmotive/textgraph@0.2.0 dist.integrity
npm install @drawmotive/textgraph@0.2.0
```

If a workflow fails before publishing, fix the configuration and rerun the same tag. For a manual dispatch, select the release tag as the workflow ref and supply the same tag as input; dispatching from `main` is rejected so OIDC and provenance identify the correct commit. For example:

```bash
gh workflow run release.yml --ref textgraph-v0.2.0 -f tag=textgraph-v0.2.0
```

If publication succeeded but a later check failed, the script accepts an identical registry artifact with the correct channel and refuses different bytes at the same version. Keep the original workflow artifact for diagnosing integrity differences.

The first alpha owning `latest` is expected and requires no repair. If a later publication unexpectedly changes an existing default, inspect registry state before retrying. Do not unpublish, overwrite versions, or delete tags as a routine recovery step.
