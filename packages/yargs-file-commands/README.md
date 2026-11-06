<p align="center">
  <a href="https://yargs-file-commands.ben3d.ca/" target="_blank" rel="noopener noreferrer">
    <img alt="yargs-file-commands logo" src="https://raw.githubusercontent.com/bhouston/yargs-file-commands/main/packages/docs/static/img/logo.svg" height="96">
  </a>
</p>
<br/>
<p align="center">
  <a href="https://npmjs.com/package/yargs-file-commands"><img src="https://img.shields.io/npm/v/yargs-file-commands.svg" alt="npm package"></a>
  <a href="https://www.npmtrends.com/yargs-file-commands"><img src="https://img.shields.io/npm/dw/yargs-file-commands.svg" alt="npm downloads"></a>
  <a href="https://codecov.io/gh/bhouston/yargs-file-commands"><img src="https://codecov.io/gh/bhouston/yargs-file-commands/branch/main/graph/badge.svg" alt="coverage"></a>
  <a href="https://discord.gg/fwupDN493R"><img src="https://img.shields.io/badge/chat-discord-blue?style=flat&logo=discord" alt="discord chat"></a>
  <a href="https://yargs-file-commands.ben3d.ca/"><img src="https://img.shields.io/badge/docs-read-blue?style=flat" alt="documentation"></a>
</p>
<br/>

# Yargs File Commands

> Define yargs commands as files; your directory tree becomes the CLI.

- 📁 [File-Based Command Tree](https://yargs-file-commands.ben3d.ca/docs/file-conventions/): directories and dotted names become nested commands
- 🔒 [Type-Safe Arguments](https://yargs-file-commands.ben3d.ca/docs/getting-started/): `defineCommand` infers handler arguments from your Yargs builder
- ⚡ [Lazy Group Loading](https://yargs-file-commands.ben3d.ca/docs/file-conventions/): a group imports its commands only when Yargs enters it
- 🧩 [Command Overlays](https://yargs-file-commands.ben3d.ca/docs/groups-and-overlays/): layer hand-written commands over generated ones
- ✅ [Test-Time Validation](https://yargs-file-commands.ben3d.ca/docs/validation/): `validateCommands` checks every command in a test

This Yargs helper function lets you define all your commands as individual files, where their file names and directory structure imply your nested command structure. Supports both JavaScript and
TypeScript (on Node 24+).

**Documentation: [yargs-file-commands.ben3d.ca](https://yargs-file-commands.ben3d.ca/)** · [Getting started](https://yargs-file-commands.ben3d.ca/docs/getting-started/) · [API reference](https://yargs-file-commands.ben3d.ca/docs/api/)

## Installation

_NOTE: This is an ESM-only package._

```sh
npm install yargs-file-commands
```

## Example

Register the commands directory:

```ts
import path from 'node:path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fileCommands } from 'yargs-file-commands';

await yargs(hideBin(process.argv))
  .scriptName('my-cli')
  .command(await fileCommands({ commandDirs: [path.join(import.meta.dirname, 'commands')] }))
  .help()
  .parseAsync();
```

Each file defines a command, and its path decides where it lives:

```
commands/
├── db/
│   ├── health.ts      // db health
│   └── migration/
│       └── command.ts // db migration
├── studio.start.ts    // studio start
└── $default.ts        // default command
```

```ts
// commands/studio.start.ts
import { defineCommand } from 'yargs-file-commands';

export const command = defineCommand({
  describe: 'Studio web interface',
  builder: (yargs) => yargs.option('port', { type: 'number', default: 3000 }),
  handler: async (argv) => {
    // argv.port is correctly typed as number
    console.log(`Starting studio on port ${argv.port}`);
  },
});
```

See the [guides](https://yargs-file-commands.ben3d.ca/docs/getting-started/) for positional arguments, groups, overlays and every option.

## Releases

Releases are published by the maintainer from `main`; see [RELEASING.md](https://github.com/bhouston/yargs-file-commands/blob/main/RELEASING.md). [GitHub Releases](https://github.com/bhouston/yargs-file-commands/releases) is the changelog. See [SECURITY.md](https://github.com/bhouston/yargs-file-commands/blob/main/SECURITY.md) for private vulnerability reporting.

## Contribution

See [Contributing Guide](https://github.com/bhouston/yargs-file-commands/blob/main/CONTRIBUTING.md).

## License

MIT

## Author

[Ben Houston](https://ben3d.ca), Sponsored by [Land of Assets](https://landofassets.com).
