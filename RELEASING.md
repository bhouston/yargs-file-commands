# Releasing

Releases are manual and maintainer-only. Merging to `main` never publishes.

## Running a Release

```sh
gh workflow run release.yml --ref main                  # release
gh workflow run release.yml --ref main -f dry_run=true  # preview only, publishes nothing
```

When there are no release-worthy commits since the last `v*` tag, the run is a no-op.

## What the Workflow Does

1. Refuses any ref other than `main`.
2. Runs the full CI workflow on the dispatched commit.
3. Stops if `main` has moved since the dispatch.
4. Installs, builds, and runs `pnpm release`, which is semantic-release.
5. semantic-release computes the next version, creates the `v<version>` tag and GitHub Release, and publishes.

Releases run one at a time and never cancel a publish in progress. npm packages publish through npm trusted publishing (GitHub OIDC), so no `NPM_TOKEN` is stored.

## Versioning

The version comes from the Conventional Commits since the last `v*` tag. The highest change wins:

- `feat` produces a minor release.
- `fix` and `perf` produce a patch release.
- `!` or a `BREAKING CHANGE:` footer produces a major release.
- Other types do not trigger a release.

Everything this repository publishes shares one version. `package.json` versions in source are development snapshots; the Git tag and the registry hold the released version. [GitHub Releases](https://github.com/bhouston/yargs-file-commands/releases) is the changelog of record.

## One-Time Setup

1. On npmjs.com, open each package's Trusted Publisher settings, choose GitHub Actions, and enter organization or user `bhouston`, repository `yargs-file-commands`, workflow filename `release.yml`, and environment name `npm`.
2. Protect `main`: require pull requests and the CI checks, allow merge commits, and block force pushes and deletion.
3. If the repository uploads coverage to Codecov, add the `CODECOV_TOKEN` repository secret.

## Recovery

Publishing is not atomic. If a run fails part way, compare the registry versions, the `v<version>` tag, and the workflow log, then finish what is missing from the same release commit. If publishing succeeded but the GitHub Release failed, create the release from the existing tag. Never republish a version, delete a published version, or move a release tag. Resolve the failure before dispatching another release.

## Repository Specifics

### Published Artifacts

- npm: `yargs-file-commands`, from `packages/yargs-file-commands`. The GitHub Release carries generated notes only.
- The `website` package and the monorepo root are private and never published.

### Required Checks

`main` requires the `ci` and `contribution` checks. The `npm` GitHub environment is used by the release job.

### Local Validation

`pnpm test:release` checks version selection and release notes without publishing. `pnpm build:release` only builds the package. Do not run `pnpm release` locally.

Keep the Conventional Commits preset on major 9 while the release-notes generator uses changelog writer 8; preset 10 requires writer 9. Upgrade them together and keep `pnpm test:release` passing.
