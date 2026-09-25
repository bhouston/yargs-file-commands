# Yargs File Commands

[![NPM Package][npm]][npm-url]
[![NPM Downloads][npm-downloads]][npmtrends-url]
[![Tests][tests-badge]][tests-url]
[![Coverage][coverage-badge]][coverage-url]
[![Discord](https://img.shields.io/badge/Discord-Join%20Chat-5865F2?logo=discord&logoColor=white)][discord-url]

This Yargs helper function lets you define all your commands as individual files, where their file
names and directory structure imply your nested command structure. Supports both JavaScript and
TypeScript (on Node 24+).

See [packages/yargs-file-commands/README.md](packages/yargs-file-commands/README.md) for full
documentation, including installation, usage examples, and options.

## Development

```bash
pnpm install
pnpm tsc
pnpm lint # oxlint
pnpm lint:fix
pnpm format # oxfmt
pnpm test # vitest
pnpm test:release # checks version selection and release notes without publishing
pnpm audit --audit-level=high
pnpm build:release
pnpm size
```

Tests cover production TypeScript source, including untested files. Minimum
coverage is 95% statements, 85% branches, 95% functions, and 95% lines. The
published package's JavaScript (gzipped, excluding peer dependencies) has a 10 kB
size budget; adjust it only with a documented reason in the PR. High and critical
dependency advisories fail CI. Coverage reports upload as CI artifacts and to
Codecov via the `CODECOV_TOKEN` secret; Codecov upload failures are nonblocking,
but the local coverage gate always applies.

Commit history through `09abc19` predates commitlint adoption and is excluded
from CI commit linting; all commits after that boundary are checked (see
`.github/workflows/ci.yml`'s `policy` job).

See [CONTRIBUTING.md](CONTRIBUTING.md) for the issue, PR, and release workflow,
[RELEASING.md](RELEASING.md) for cutting a release, and [SECURITY.md](SECURITY.md)
for private vulnerability reporting.

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com)

[npm]: https://img.shields.io/npm/v/yargs-file-commands
[npm-url]: https://www.npmjs.com/package/yargs-file-commands
[npm-downloads]: https://img.shields.io/npm/dw/yargs-file-commands
[npmtrends-url]: https://www.npmtrends.com/yargs-file-commands
[tests-badge]: https://github.com/bhouston/yargs-file-commands/actions/workflows/ci.yml/badge.svg?branch=main
[tests-url]: https://github.com/bhouston/yargs-file-commands/actions/workflows/ci.yml
[coverage-badge]: https://codecov.io/gh/bhouston/yargs-file-commands/branch/main/graph/badge.svg
[coverage-url]: https://codecov.io/gh/bhouston/yargs-file-commands
[discord-url]: https://discord.gg/fwupDN493R
