# Releasing

Releases are cut manually, on demand, from `main`; they do not happen on every
merge. See [CONTRIBUTING.md](CONTRIBUTING.md) for the general release trigger.
When `main` has release-worthy commits ready to ship, run:

```sh
gh workflow run release.yml --ref main
```

Add `-f dry_run=true` to validate versioning, the changelog, and staged packages
without publishing or tagging.

The workflow refuses to run unless dispatched on `main`. It repeats quality checks,
then analyzes commits since the last `v*` tag, updates the package version,
generates notes and a CHANGELOG.md, publishes to npm with `pnpm publish` and OIDC
trusted publishing, and creates a GitHub release/tag. No release-worthy commits
means the run succeeds as a no-op. Source `package.json` versions are placeholders
after adoption; npm versions and GitHub tags are authoritative. Generated
version/changelog files are not committed back to `main`. Each release's notes are
available on GitHub and in the published package; `packages/yargs-file-commands/CHANGELOG.md`
records the historical baseline and links to the release history.

`pnpm build:release` only builds the package; it never publishes. Do not run
`pnpm release` locally.

Keep the Conventional Commits preset on major 9 while the release-notes generator
uses changelog writer 8; preset 10 requires writer 9. Upgrade them together and
keep `pnpm test:release` passing.

## npm trusted publishing setup (maintainer)

On npm, open **yargs-file-commands → Settings → Trusted publishing**, select GitHub
Actions, and enter:

- Organization or user: `bhouston`
- Repository: `yargs-file-commands`
- Workflow filename: `release.yml`
- Environment name: leave blank (the workflow does not use an environment)

The workflow uses GitHub-hosted runners, Node 26 with pnpm >=11.1.3 (required for
OIDC-publish support), and `id-token: write`. No `NPM_TOKEN` or `NODE_AUTH_TOKEN`
secret is needed. See
[npm's trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/).
Configure this before running the release workflow.

## Release baseline

The initial `v1.2.2` baseline tag points to npm's recorded gitHead
`4b22698114bde648aab626c518e2e082187fc7a4`. Since that release, existing repository
changes raised requirements from Node 20/yargs 17 to Node 24/yargs 18. The workflow
adoption commit records this breaking change so the first automated release is 2.0.0.
Do not move existing release tags.

## GitHub settings

Use `main` as the default branch. Protect it with required PRs and required checks
`Quality` and `PR policy`; disable force pushes and deletion. A solo maintainer can
use zero required approvals while still requiring passing checks. Enable private
vulnerability reporting under Settings → Security if desired. `dev` is left inactive
after the single-branch migration; it is not used for contributions or releases.

## Rollout to other repositories

The shared workflow standard (CONTRIBUTING.md, agent loader files, SECURITY.md,
issue/PR templates, commitlint config, Husky hook, and CI/release config shape) now
lives in a dedicated standards reference; see
`/Users/bhouston/Coding/standards/AGENT_BRIEF.md`. New repositories adopt it from
there, adapting package paths, build commands, size/coverage budgets, repository
links, release baseline, and license ownership per repository.
