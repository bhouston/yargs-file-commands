<p align="center">
  <a href="https://bhouston.github.io/yargs-file-commands/" target="_blank" rel="noopener noreferrer">
    <img alt="yargs-file-commands logo" src="https://raw.githubusercontent.com/bhouston/yargs-file-commands/main/packages/website/static/img/logo.svg" height="96">
  </a>
</p>
<br/>
<p align="center">
  <a href="https://npmjs.com/package/yargs-file-commands"><img src="https://img.shields.io/npm/v/yargs-file-commands.svg" alt="npm package"></a>
  <a href="https://www.npmtrends.com/yargs-file-commands"><img src="https://img.shields.io/npm/dw/yargs-file-commands.svg" alt="npm downloads"></a>
  <a href="https://codecov.io/gh/bhouston/yargs-file-commands"><img src="https://codecov.io/gh/bhouston/yargs-file-commands/branch/main/graph/badge.svg" alt="coverage"></a>
  <a href="https://discord.gg/fwupDN493R"><img src="https://img.shields.io/badge/chat-discord-blue?style=flat&logo=discord" alt="discord chat"></a>
  <a href="https://bhouston.github.io/yargs-file-commands/"><img src="https://img.shields.io/badge/docs-read-blue?style=flat" alt="documentation"></a>
</p>
<br/>

# Yargs File Commands

> Define yargs commands as files; your directory tree becomes the CLI.

- 📁 File-Based Command Tree
- 🔒 Type-Safe Arguments
- ⚡ Lazy Group Loading
- 🧩 Command Overlays
- ✅ Test-Time Validation

This Yargs helper function lets you define all your commands as individual files, where their file
names and directory structure imply your nested command structure. Supports both JavaScript and
TypeScript (on Node 24+).

[Read the Docs to Learn More](https://bhouston.github.io/yargs-file-commands/).

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

## Releases

See [RELEASING.md](RELEASING.md) for how releases are published and [GitHub Releases](https://github.com/bhouston/yargs-file-commands/releases) for changes. See [SECURITY.md](SECURITY.md) for private vulnerability reporting.

## Contribution

See [Contributing Guide](CONTRIBUTING.md).

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com).
