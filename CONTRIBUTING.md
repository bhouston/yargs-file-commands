# Contributing

These rules apply to every contributor, including Claude and Codex. Keep workflow
rules here; AGENTS.md and CLAUDE.md only load this file.

## Issue → branch → PR

1. Before implementation, create or reuse a GitHub issue. Follow the change request
   template: describe what and why, constraints, and observable acceptance criteria.
2. Branch from current `origin/dev`, using `<type>/<issue>-<short-description>`:
   `feature/42-batch-export`, `fix/43-empty-input`, or `chore/44-update-ci`.
   Supported branch types: feature, fix, docs, chore, refactor, test, ci.
3. Make every commit a Conventional Commit: `type(scope): description`.
   Use feat, fix, docs, chore, refactor, test, style, perf, build, ci, or revert.
   Scope is optional. Reference the issue in the body when useful.
   `feat` triggers a minor release; `fix` and `perf` trigger a patch release.
   A `!` after the type/scope or a `BREAKING CHANGE:` footer triggers a major
   release. Other types do not release on their own.
4. Run the checks below. Open a PR against `dev`, with a Conventional Commit title
   and `Closes #<issue>` in the body matching the issue number in the branch.
   Explain resulting behavior, validation, and compatibility changes.
5. Merge reviewed implementation PRs into `dev`. Preserve Conventional Commits
   with merge/rebase, or use a conventional squash title and preserve any breaking
   change footer. Never commit directly to `main` or `dev`.

`dev` is the default integration branch, so issue closing keywords take effect
when implementation PRs merge there. CI checks branch naming, issue references,
PR titles, and commits; Husky validates local commit messages. Existing history
through `09abc19` predates enforcement and is excluded from CI commit linting.
All commits after that adoption boundary are checked.

## Development and quality gates

Use the Node version in `.nvmrc` and pnpm version in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm tsc
pnpm lint
pnpm test
pnpm test:release
pnpm audit --audit-level=high
pnpm build:release
pnpm size
```

Tests include coverage of production TypeScript source, including untested files.
Minimum coverage is 95% statements, 85% branches, 95% functions, and 95% lines.
`pnpm test:release` checks version selection and renders release notes using the
configured plugins without publishing. Keep the Conventional Commits preset on
major 9 while the release-notes generator uses changelog writer 8; preset 10
requires writer 9. Upgrade them together and keep the release check passing.
The 10 kB gzip size budget measures the staged package's JavaScript, excluding
peer dependencies. Adjust budgets only with a documented reason in the PR.
High and critical dependency advisories fail CI; investigate rather than suppressing
the gate. Coverage reports are uploaded as artifacts and to Codecov. The existing
`CODECOV_TOKEN` secret supports uploading; Codecov service failures are nonblocking,
while the local coverage gate always applies. The percentage badge needs a successful
Codecov upload.

## Releases

Open a release PR from this repository's `dev` branch to `main`. Use a **merge
commit**, never squash or rebase a release PR: shared history must be preserved
so semantic-release does not re-release old changes. Review changes since the last
release and verify breaking changes have Conventional Commit markers. Only `dev`
may target `main`. No release occurs on an ordinary merge into `dev`.

After merging to `main`, the release workflow repeats quality checks, analyzes
commits since the last `v*` tag, updates the staged package version, generates notes
and a CHANGELOG.md, publishes to npm with OIDC, and creates a GitHub release/tag.
No release-worthy commits means no release. Source package.json versions are
placeholders after adoption; npm versions and GitHub tags are authoritative.
Generated version/changelog files are not committed back to either branch. Each
release's notes are available on GitHub and in the published package; the repository
CHANGELOG.md records the historical baseline and links to the release history.

The former manual `make-release` command has been removed. `pnpm build:release`
only stages a clean package; it never publishes. Do not run `pnpm release` locally.

### npm trusted publishing setup (maintainer)

On npm, open **yargs-file-commands → Settings → Trusted publishing**, select GitHub
Actions, and enter:

- Organization or user: `bhouston`
- Repository: `yargs-file-commands`
- Workflow filename: `release.yml`
- Environment name: leave blank (the workflow does not use an environment)

The workflow uses GitHub-hosted runners, Node 26 with npm >=11.5.1, and
`id-token: write`. No `NPM_TOKEN` or `NODE_AUTH_TOKEN` secret is needed.
See [npm's trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/).
Configure this before merging the first release PR into `main`.

The initial `v1.2.2` baseline tag points to npm's recorded gitHead
`4b22698114bde648aab626c518e2e082187fc7a4`. Since that release, existing repository
changes raised requirements from Node 20/yargs 17 to Node 24/yargs 18. The workflow
adoption commit records this breaking change so the first automated release is 2.0.0.
Do not move existing release tags.

### GitHub settings

Use `dev` as the default branch. Protect `dev` and `main` with required PRs and
required checks `Quality` and `PR policy`; disable force pushes and deletion.
Allow merge commits so release PRs can preserve history. A solo maintainer can use
zero required approvals while still requiring passing checks. Enable private
vulnerability reporting under Settings → Security if desired.

## Rollout to other repositories

After a successful real npm release, extract the shared workflow files into a
separate GitHub template repository. Copy CONTRIBUTING.md, the agent loader files,
SECURITY.md, issue/PR templates, commitlint config, Husky hook, and CI/release config.
Adapt package paths, build commands, size/coverage budgets, repository links, release
baseline, and license ownership for each target. Install the matching development
dependencies and regenerate its lockfile. Configure its npm trusted publisher and
GitHub branch rules separately. A universal copy script/template repository is a
follow-up after this pilot has completed a real release.
